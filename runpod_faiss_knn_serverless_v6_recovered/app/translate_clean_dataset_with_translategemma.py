from __future__ import annotations

import argparse
import json
import multiprocessing as mp
import queue
import re
import traceback
import unicodedata
from pathlib import Path
from typing import Dict, Iterable, List, Sequence

import pandas as pd
import torch
from tqdm.auto import tqdm
from transformers import AutoModelForImageTextToText, AutoProcessor


DEFAULT_MODEL = "google/translategemma-12b-it"
DEFAULT_OUTPUT = "Depression_Severity_Levels_Dataset_clean_translategemma_ko_summary.csv"
DEFAULT_CHECKPOINT = "translategemma_ko_summary_checkpoint.csv"

DRUG_PRONUNCIATIONS = {
    "zoloft": "졸로프트",
    "sertraline": "서트랄린",
    "cymbalta": "심발타",
    "lexapro": "렉사프로",
}

SYSTEM_MESSAGE = (
    "You are a careful professional translator and data summarizer. "
    "Translate social media text into natural Korean and write a short Korean summary. "
    "The source text is mostly English, but may sometimes be Spanish or Russian. "
    "Summaries must remove personal names, usernames, company names, school names, "
    "organization names, locations, URLs, and other identifying proper nouns. "
    "If drug or medication names appear, write them in Korean by sound, for example: "
    "Zoloft=졸로프트, Sertraline=서트랄린, Cymbalta=심발타, Lexapro=렉사프로. "
    "If the text contains only emoticons or emoji, explain only what the emoji/emoticon means. "
    "If the text is meaningless noise, mark it for exclusion. "
    "Do not add counseling, warnings, markdown, or extra explanations."
)

USER_MESSAGE_TEMPLATE = (
    "Process this one item. Return only one valid JSON object with exactly these keys: "
    '"Korean", "summary", and "exclude". '
    '"Korean" must be a faithful Korean translation of the source text. '
    '"summary" must be a concise Korean summary without proper nouns or identifying details. '
    '"exclude" must be true only if the source is meaningless random characters with no interpretable meaning. '
    "For emoji-only or emoticon-only text, exclude must be false and both Korean and summary should describe the meaning.\n\n"
    "Source text:\n{text}"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Translate text_clean to Korean and summarize it with google/translategemma-12b-it."
    )
    parser.add_argument("--input", default="Depression_Severity_Levels_Dataset_clean.csv")
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument("--checkpoint", default=DEFAULT_CHECKPOINT)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--text-col", default="text_clean")
    parser.add_argument("--label-col", default="label")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--max-chars", type=int, default=1800, help="Maximum source characters per model call.")
    parser.add_argument("--max-new-tokens", type=int, default=512)
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    parser.add_argument("--gpu-id", type=int, default=0)
    parser.add_argument(
        "--gpu-ids",
        default="0,1,2,3",
        help="Comma-separated CUDA GPU ids for parallel row processing, for example: 0,1,2,3.",
    )
    parser.add_argument(
        "--num-gpus",
        type=int,
        default=4,
        help="Number of CUDA GPUs to use when --gpu-ids is not set. Use 4 to process 4 rows in parallel.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=4,
        help="Number of rows to process concurrently. With --num-gpus 4, set this to 4.",
    )
    parser.add_argument("--torch-dtype", choices=["auto", "float16", "bfloat16", "float32"], default="bfloat16")
    parser.add_argument("--cache-dir", default=None)
    parser.add_argument(
        "--hf-token",
        default=None,
        help="Optional Hugging Face token. You can also login with `huggingface-cli login`.",
    )
    parser.add_argument(
        "--source-lang",
        default="auto",
        choices=["auto", "en", "es", "ru"],
        help="Source language for translation. auto uses a lightweight character heuristic.",
    )
    parser.add_argument("--save-every", type=int, default=25, help="Save checkpoint/output every N processed rows.")
    return parser.parse_args()


def parse_gpu_ids(value: str | None, num_gpus: int) -> List[int]:
    if value:
        gpu_ids = [int(part.strip()) for part in value.split(",") if part.strip()]
    else:
        gpu_ids = list(range(num_gpus))
    if not gpu_ids:
        raise ValueError("At least one GPU id is required.")
    return gpu_ids


def normalize_spaces(value: object) -> str:
    if pd.isna(value):
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def load_dataset(path: Path, text_col: str, label_col: str, limit: int | None) -> pd.DataFrame:
    df = pd.read_csv(path, encoding="utf-8", encoding_errors="replace")
    if text_col not in df.columns:
        raise ValueError(f"Input CSV does not have text column {text_col!r}. Columns: {list(df.columns)}")
    if label_col not in df.columns:
        raise ValueError(f"Input CSV does not have label column {label_col!r}. Columns: {list(df.columns)}")

    if limit is not None:
        df = df.head(limit).copy()

    df = df.reset_index(drop=True)
    df.insert(0, "row_id", range(len(df)))
    df[text_col] = df[text_col].map(normalize_spaces)
    df = df[df[text_col].str.len() > 0].reset_index(drop=True)
    df["row_id"] = range(len(df))
    return df


def looks_like_meaningless_noise(text: str) -> bool:
    compact = re.sub(r"\s+", "", text)
    if not compact:
        return True
    if compact.lower() in {"nan", "none", "null", "[deleted]", "[removed]"}:
        return True
    if len(compact) <= 2 and not contains_emoji_or_emoticon(compact):
        return True

    letters = sum(ch.isalpha() for ch in compact)
    digits = sum(ch.isdigit() for ch in compact)
    symbols = len(compact) - letters - digits
    if len(compact) >= 6 and letters == 0 and digits + symbols == len(compact):
        return not contains_emoji_or_emoticon(compact)

    ascii_letters = re.sub(r"[^A-Za-z]", "", compact)
    if len(ascii_letters) >= 12 and not re.search(r"[aeiouAEIOU]", ascii_letters):
        return True

    return False


def contains_emoji_or_emoticon(text: str) -> bool:
    if re.search(r"[:;=8xX][-o*']?[)(DPp/\\|]|[)(DPp/\\|][-o*']?[:;=8xX]|<3|T_T|ㅠㅠ|ㅜㅜ", text):
        return True
    return any(unicodedata.category(ch) in {"So", "Sk"} for ch in text)


def infer_source_lang(text: str, source_lang: str) -> str:
    if source_lang != "auto":
        return source_lang
    cyrillic = sum(1 for ch in text if "\u0400" <= ch <= "\u04ff")
    latin = sum(1 for ch in text if "A" <= ch <= "Z" or "a" <= ch <= "z")
    if cyrillic > max(3, latin // 3):
        return "ru"
    lower = f" {text.lower()} "
    spanish_hits = sum(
        marker in lower
        for marker in [" que ", " estoy ", " tengo ", " porque ", " pero ", " con ", " para ", " una ", " el ", " la "]
    )
    if re.search(r"[áéíóúñü¿¡]", text.lower()) or spanish_hits >= 3:
        return "es"
    return "en"


def split_text_into_chunks(text: str, max_chars: int) -> List[str]:
    if len(text) <= max_chars:
        return [text]

    chunks: List[str] = []
    current = ""
    sentences = re.split(r"(?<=[.!?。！？])\s+", text)
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(sentence) > max_chars:
            if current:
                chunks.append(current)
                current = ""
            for start in range(0, len(sentence), max_chars):
                chunks.append(sentence[start : start + max_chars].strip())
            continue

        candidate = f"{current} {sentence}".strip()
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                chunks.append(current)
            current = sentence

    if current:
        chunks.append(current)
    return chunks


def choose_dtype(dtype_option: str, device_option: str) -> torch.dtype | str:
    if dtype_option == "float16":
        return torch.float16
    if dtype_option == "bfloat16":
        return torch.bfloat16
    if dtype_option == "float32":
        return torch.float32
    if device_option == "cpu":
        return torch.float32
    return "auto"


def choose_device_map(device_option: str, gpu_id: int) -> dict[str, str] | str | None:
    if device_option == "cpu":
        return None
    if device_option == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA is not available. Use --device cpu or install a CUDA-enabled PyTorch build.")
    if not torch.cuda.is_available():
        return None

    gpu_count = torch.cuda.device_count()
    if gpu_id < 0 or gpu_id >= gpu_count:
        raise RuntimeError(f"CUDA GPU {gpu_id} is not available. This system reports {gpu_count} CUDA device(s).")
    torch.cuda.set_device(gpu_id)
    return {"": f"cuda:{gpu_id}"}


def load_model(args: argparse.Namespace):
    common_kwargs = {
        "cache_dir": args.cache_dir,
        "token": args.hf_token,
    }
    processor = AutoProcessor.from_pretrained(args.model, **common_kwargs)

    model_kwargs = {
        **common_kwargs,
        "torch_dtype": choose_dtype(args.torch_dtype, args.device),
        "device_map": choose_device_map(args.device, args.gpu_id),
    }
    if model_kwargs["device_map"] is None:
        model_kwargs.pop("device_map")

    model = AutoModelForImageTextToText.from_pretrained(args.model, **model_kwargs)
    if args.device == "cpu":
        model.to("cpu")
    model.eval()
    return processor, model


def model_device(model) -> torch.device:
    return next(model.parameters()).device


def render_translation_messages(text: str, source_lang: str) -> List[dict]:
    return [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "source_lang_code": source_lang,
                    "target_lang_code": "ko",
                    "text": text,
                }
            ],
        }
    ]


def render_instruction_prompt(text: str) -> str:
    return (
        "<start_of_turn>user\n"
        f"{SYSTEM_MESSAGE}\n\n"
        f"{USER_MESSAGE_TEMPLATE.format(text=text)}"
        "<end_of_turn>\n"
        "<start_of_turn>model\n"
    )


def generate_with_inputs(processor, model, inputs, max_new_tokens: int) -> str:
    inputs = inputs.to(model_device(model))
    input_len = inputs["input_ids"].shape[-1]
    with torch.inference_mode():
        generation = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            pad_token_id=processor.tokenizer.pad_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
        )
    generation = generation[0][input_len:]
    return processor.decode(generation, skip_special_tokens=True).strip()


def translate_text(processor, model, text: str, source_lang: str, max_new_tokens: int) -> str:
    messages = render_translation_messages(text, source_lang=source_lang)
    inputs = processor.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_dict=True,
        return_tensors="pt",
    )
    return normalize_spaces(generate_with_inputs(processor, model, inputs, max_new_tokens=max_new_tokens))


def generate_json_task(processor, model, text: str, max_new_tokens: int) -> dict:
    prompt = render_instruction_prompt(text)
    inputs = processor.tokenizer(prompt, return_tensors="pt")
    raw = generate_with_inputs(processor, model, inputs, max_new_tokens=max_new_tokens)
    return extract_json_object(raw)


def extract_json_object(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start < 0 or end <= start:
            raise
        parsed = json.loads(cleaned[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("Model response is not a JSON object.")
    return parsed


def apply_drug_pronunciations(text: str) -> str:
    fixed = text
    for english_name, korean_name in DRUG_PRONUNCIATIONS.items():
        fixed = re.sub(rf"\b{re.escape(english_name)}\b", korean_name, fixed, flags=re.IGNORECASE)
    return fixed


def process_row(
    *,
    processor,
    model,
    text: str,
    source_lang: str,
    max_chars: int,
    max_new_tokens: int,
) -> dict:
    if looks_like_meaningless_noise(text):
        return {"Korean": "", "summary": "", "exclude": True}

    korean_parts: List[str] = []
    summary_parts: List[str] = []
    kept_any = False

    for chunk in split_text_into_chunks(text, max_chars=max_chars):
        task = generate_json_task(processor, model, text=chunk, max_new_tokens=max_new_tokens)
        exclude = bool(task.get("exclude", False))
        if exclude:
            continue

        kept_any = True
        korean = normalize_spaces(task.get("Korean", ""))
        summary = normalize_spaces(task.get("summary", ""))
        if not korean:
            korean = translate_text(
                processor,
                model,
                text=chunk,
                source_lang=source_lang,
                max_new_tokens=max_new_tokens,
            )
        if not summary:
            summary = korean
        korean_parts.append(korean)
        summary_parts.append(summary)

    if not kept_any:
        return {"Korean": "", "summary": "", "exclude": True}

    korean = normalize_spaces(" ".join(korean_parts))
    summary = normalize_spaces(" ".join(summary_parts))

    return {
        "Korean": apply_drug_pronunciations(korean),
        "summary": apply_drug_pronunciations(summary),
        "exclude": exclude,
    }


def process_row_with_fallback(
    *,
    args: argparse.Namespace,
    processor,
    model,
    row: dict,
) -> dict:
    text = row[args.text_col]
    source_lang = infer_source_lang(text, args.source_lang)
    try:
        return process_row(
            processor=processor,
            model=model,
            text=text,
            source_lang=source_lang,
            max_chars=args.max_chars,
            max_new_tokens=args.max_new_tokens,
        )
    except Exception as exc:
        print(f"row_id={row['row_id']} failed once; retrying with direct translation fallback. Error: {exc}")
        korean = normalize_spaces(
            " ".join(
                translate_text(
                    processor,
                    model,
                    text=chunk,
                    source_lang=source_lang,
                    max_new_tokens=args.max_new_tokens,
                )
                for chunk in split_text_into_chunks(text, max_chars=args.max_chars)
            )
        )
        return {
            "Korean": apply_drug_pronunciations(korean),
            "summary": apply_drug_pronunciations(korean),
            "exclude": False,
        }


def translate_worker(
    *,
    gpu_id: int,
    args: argparse.Namespace,
    task_queue,
    result_queue,
) -> None:
    worker_args = argparse.Namespace(**vars(args))
    worker_args.device = "cuda"
    worker_args.gpu_id = gpu_id
    try:
        processor, model = load_model(worker_args)
    except Exception:
        result_queue.put(("fatal", gpu_id, traceback.format_exc()))
        return

    while True:
        row = task_queue.get()
        if row is None:
            break
        try:
            result = process_row_with_fallback(
                args=worker_args,
                processor=processor,
                model=model,
                row=row,
            )
            result_queue.put(("ok", gpu_id, int(row["row_id"]), result))
        except Exception:
            result_queue.put(("error", gpu_id, int(row["row_id"]), traceback.format_exc()))


def run_single_worker(
    *,
    args: argparse.Namespace,
    df: pd.DataFrame,
    output_path: Path,
    checkpoint_path: Path,
    rows: List[dict],
    remaining_rows: List[dict],
    results: Dict[str, dict],
) -> None:
    if not remaining_rows:
        return

    processor, model = load_model(args)
    progress = tqdm(remaining_rows, desc="Translating/summarizing", unit="row")
    for processed_count, row in enumerate(progress, start=1):
        result = process_row_with_fallback(
            args=args,
            processor=processor,
            model=model,
            row=row,
        )

        results[str(row["row_id"])] = result
        if processed_count % args.save_every == 0:
            save_checkpoint(checkpoint_path, results)
            save_output(
                df=df,
                output_path=output_path,
                text_col=args.text_col,
                label_col=args.label_col,
                results=results,
            )
        kept = sum(1 for value in results.values() if not value.get("exclude"))
        progress.set_postfix(done=f"{len(results)}/{len(rows)}", kept=kept)


def run_multi_gpu_workers(
    *,
    args: argparse.Namespace,
    df: pd.DataFrame,
    output_path: Path,
    checkpoint_path: Path,
    rows: List[dict],
    remaining_rows: List[dict],
    results: Dict[str, dict],
) -> None:
    if not remaining_rows:
        return

    gpu_ids = parse_gpu_ids(args.gpu_ids, args.num_gpus)
    if args.device == "cpu":
        raise RuntimeError("Multi-GPU mode requires CUDA. Remove --device cpu or use --batch-size 1.")
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is not available. Use --device cpu/--batch-size 1 or install CUDA-enabled PyTorch.")

    gpu_count = torch.cuda.device_count()
    unavailable = [gpu_id for gpu_id in gpu_ids if gpu_id < 0 or gpu_id >= gpu_count]
    if unavailable:
        raise RuntimeError(f"CUDA GPU id(s) are not available: {unavailable}. This system reports {gpu_count} GPU(s).")

    worker_count = min(args.batch_size, len(gpu_ids))
    gpu_ids = gpu_ids[:worker_count]
    print(f"Parallel workers: {worker_count}")
    print(f"CUDA GPU ids: {gpu_ids}")

    ctx = mp.get_context("spawn")
    task_queue = ctx.Queue()
    result_queue = ctx.Queue()
    workers = [
        ctx.Process(
            target=translate_worker,
            kwargs={
                "gpu_id": gpu_id,
                "args": args,
                "task_queue": task_queue,
                "result_queue": result_queue,
            },
        )
        for gpu_id in gpu_ids
    ]

    for worker in workers:
        worker.start()
    for row in remaining_rows:
        task_queue.put(row)
    for _ in workers:
        task_queue.put(None)

    processed_count = 0
    progress = tqdm(total=len(remaining_rows), desc="Translating/summarizing", unit="row")
    try:
        while processed_count < len(remaining_rows):
            try:
                message = result_queue.get(timeout=30)
            except queue.Empty:
                dead = [worker.pid for worker in workers if not worker.is_alive() and worker.exitcode not in (0, None)]
                if dead:
                    raise RuntimeError(f"Worker process exited unexpectedly: {dead}")
                continue

            status = message[0]
            if status == "fatal":
                _, gpu_id, error_text = message
                raise RuntimeError(f"Worker on cuda:{gpu_id} failed while loading the model:\n{error_text}")
            if status == "error":
                _, gpu_id, row_id, error_text = message
                raise RuntimeError(f"Worker on cuda:{gpu_id} failed on row_id={row_id}:\n{error_text}")

            _, gpu_id, row_id, result = message
            del gpu_id
            results[str(row_id)] = result
            processed_count += 1
            progress.update(1)

            if processed_count % args.save_every == 0:
                save_checkpoint(checkpoint_path, results)
                save_output(
                    df=df,
                    output_path=output_path,
                    text_col=args.text_col,
                    label_col=args.label_col,
                    results=results,
                )
            kept = sum(1 for value in results.values() if not value.get("exclude"))
            progress.set_postfix(done=f"{len(results)}/{len(rows)}", kept=kept)
    finally:
        progress.close()
        for worker in workers:
            worker.join(timeout=5)
        for worker in workers:
            if worker.is_alive():
                worker.terminate()
                worker.join(timeout=5)


def load_checkpoint(path: Path) -> Dict[str, dict]:
    if not path.exists():
        return {}
    checkpoint_df = pd.read_csv(path, encoding="utf-8", encoding_errors="replace")
    required = {"row_id", "Korean", "summary", "exclude"}
    if checkpoint_df.empty or not required.issubset(checkpoint_df.columns):
        return {}
    results: Dict[str, dict] = {}
    for _, row in checkpoint_df.iterrows():
        row_id = str(int(row["row_id"]))
        results[row_id] = {
            "Korean": normalize_spaces(row.get("Korean", "")),
            "summary": normalize_spaces(row.get("summary", "")),
            "exclude": str(row.get("exclude", "")).lower() in {"true", "1", "yes"},
        }
    return results


def save_checkpoint(path: Path, results: Dict[str, dict]) -> None:
    rows = [
        {
            "row_id": int(row_id),
            "Korean": result.get("Korean", ""),
            "summary": result.get("summary", ""),
            "exclude": bool(result.get("exclude", False)),
        }
        for row_id, result in sorted(results.items(), key=lambda item: int(item[0]))
    ]
    pd.DataFrame(rows).to_csv(path, index=False, encoding="utf-8-sig")


def save_output(
    *,
    df: pd.DataFrame,
    output_path: Path,
    text_col: str,
    label_col: str,
    results: Dict[str, dict],
) -> None:
    rows = []
    passthrough_cols = [
        column
        for column in ("source_id", "original_row_index")
        if column in df.columns
    ]
    for row in df.to_dict("records"):
        result = results.get(str(row["row_id"]))
        if not result or result.get("exclude"):
            continue
        korean = normalize_spaces(result.get("Korean", ""))
        summary = normalize_spaces(result.get("summary", ""))
        if not korean or not summary:
            continue
        rows.append(
            {
                **{column: row[column] for column in passthrough_cols},
                "label": row[label_col],
                "summary": summary,
                "Korean": korean,
                "text": row[text_col],
            }
        )
    pd.DataFrame(rows, columns=passthrough_cols + ["label", "summary", "Korean", "text"]).to_csv(
        output_path,
        index=False,
        encoding="utf-8-sig",
    )


def batched(items: Sequence[dict], batch_size: int) -> Iterable[List[dict]]:
    for start in range(0, len(items), batch_size):
        yield list(items[start : start + batch_size])


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)
    checkpoint_path = Path(args.checkpoint)

    df = load_dataset(input_path, text_col=args.text_col, label_col=args.label_col, limit=args.limit)
    results = load_checkpoint(checkpoint_path)
    rows = df.to_dict("records")
    remaining_rows = [row for row in rows if str(row["row_id"]) not in results]

    print(f"Input rows: {len(rows)}")
    print(f"Already processed rows: {len(results)}")
    print(f"Remaining rows: {len(remaining_rows)}")
    print(f"Model: {args.model}")

    if remaining_rows:
        if args.batch_size > 1 or args.num_gpus > 1 or args.gpu_ids:
            run_multi_gpu_workers(
                args=args,
                df=df,
                output_path=output_path,
                checkpoint_path=checkpoint_path,
                rows=rows,
                remaining_rows=remaining_rows,
                results=results,
            )
        else:
            run_single_worker(
                args=args,
                df=df,
                output_path=output_path,
                checkpoint_path=checkpoint_path,
                rows=rows,
                remaining_rows=remaining_rows,
                results=results,
            )

    save_checkpoint(checkpoint_path, results)
    save_output(
        df=df,
        output_path=output_path,
        text_col=args.text_col,
        label_col=args.label_col,
        results=results,
    )
    print(f"Saved output CSV: {output_path}")
    print(f"Saved checkpoint CSV: {checkpoint_path}")


if __name__ == "__main__":
    mp.freeze_support()
    main()
