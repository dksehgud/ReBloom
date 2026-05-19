from __future__ import annotations

import argparse
import json
import multiprocessing as mp
import queue
import re
import traceback
from pathlib import Path
from typing import Dict, List

import pandas as pd
import torch
from tqdm.auto import tqdm

from translate_clean_dataset_with_translategemma import (
    DEFAULT_MODEL,
    apply_drug_pronunciations,
    generate_with_inputs,
    load_model,
    normalize_spaces,
    split_text_into_chunks,
)


DEFAULT_INPUT = "Depression_Severity_Levels_Dataset_clean_translategemma_ko_summary.csv"
DEFAULT_OUTPUT = "Depression_Severity_Levels_Dataset_clean_translategemma_ko_summary_source_id.csv"
DEFAULT_CHECKPOINT = "repair_summary_with_source_id_checkpoint.csv"

SUMMARY_SYSTEM_MESSAGE = (
    "You are a careful Korean data summarizer. "
    "Write a concise Korean summary for a mental-health social media dataset. "
    "Remove personal names, usernames, company names, school names, organization names, "
    "locations, URLs, and other identifying proper nouns. "
    "Do not add counseling, warnings, markdown, or extra explanations. "
    "Return only the summary text."
)

SUMMARY_PROMPT_TEMPLATE = (
    "<start_of_turn>user\n"
    "{system_message}\n\n"
    "Summarize the following Korean text. Keep the core meaning, but make it shorter. "
    "If the text is very long, focus on the main situation, emotion, and clinically relevant context. "
    "Return only one Korean summary sentence or a short Korean paragraph.\n\n"
    "Korean text:\n{text}"
    "<end_of_turn>\n"
    "<start_of_turn>model\n"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Add source_id and repair rows where summary is identical to Korean."
    )
    parser.add_argument("--input", default=DEFAULT_INPUT)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument("--checkpoint", default=DEFAULT_CHECKPOINT)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--source-id-col", default="source_id")
    parser.add_argument("--source-id-prefix", default="dsl")
    parser.add_argument("--start-id", type=int, default=1)
    parser.add_argument("--summary-col", default="summary")
    parser.add_argument("--korean-col", default="Korean")
    parser.add_argument("--label-col", default="label")
    parser.add_argument("--text-col", default="text")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument(
        "--max-chars",
        type=int,
        default=1200,
        help="Maximum Korean characters per model call. Lower this for very long rows.",
    )
    parser.add_argument(
        "--final-max-chars",
        type=int,
        default=2400,
        help="If chunk summaries are still long, summarize this many characters at a time again.",
    )
    parser.add_argument("--max-new-tokens", type=int, default=192)
    parser.add_argument("--final-max-new-tokens", type=int, default=224)
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    parser.add_argument("--gpu-id", type=int, default=0)
    parser.add_argument(
        "--gpu-ids",
        default=None,
        help="Comma-separated CUDA GPU ids for parallel processing, for example: 0,1,2,3.",
    )
    parser.add_argument(
        "--num-gpus",
        type=int,
        default=1,
        help="Number of CUDA GPUs to use when --gpu-ids is not set.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=1,
        help="Number of parallel GPU workers. Set this to the number of GPUs to use.",
    )
    parser.add_argument("--torch-dtype", choices=["auto", "float16", "bfloat16", "float32"], default="bfloat16")
    parser.add_argument("--cache-dir", default=None)
    parser.add_argument("--hf-token", default=None)
    parser.add_argument("--save-every", type=int, default=25)
    return parser.parse_args()


def validate_columns(df: pd.DataFrame, args: argparse.Namespace) -> None:
    required = [args.label_col, args.summary_col, args.korean_col, args.text_col]
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Input CSV is missing required columns: {missing}. Columns: {list(df.columns)}")


def make_source_id(prefix: str, number: int) -> str:
    return f"{prefix}_{number:08d}"


def parse_gpu_ids(value: str | None, num_gpus: int) -> List[int]:
    if value:
        gpu_ids = [int(part.strip()) for part in value.split(",") if part.strip()]
    else:
        gpu_ids = list(range(num_gpus))
    if not gpu_ids:
        raise ValueError("At least one GPU id is required.")
    return gpu_ids


def load_checkpoint(path: Path) -> Dict[int, str]:
    if not path.exists():
        return {}
    checkpoint_df = pd.read_csv(path, encoding="utf-8", encoding_errors="replace")
    if checkpoint_df.empty or not {"row_index", "summary"}.issubset(checkpoint_df.columns):
        return {}
    return {
        int(row["row_index"]): normalize_spaces(row["summary"])
        for _, row in checkpoint_df.iterrows()
        if normalize_spaces(row.get("summary", ""))
    }


def save_checkpoint(path: Path, repaired: Dict[int, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = [
        {"row_index": row_index, "summary": summary}
        for row_index, summary in sorted(repaired.items())
    ]
    pd.DataFrame(rows, columns=["row_index", "summary"]).to_csv(path, index=False, encoding="utf-8-sig")


def strip_model_output(text: str) -> str:
    text = re.sub(r"^```(?:text|markdown)?\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text).strip()
    text = re.sub(r"^(요약|summary)\s*[:：]\s*", "", text, flags=re.IGNORECASE)
    return normalize_spaces(text)


def summarize_once(processor, model, text: str, max_new_tokens: int) -> str:
    prompt = SUMMARY_PROMPT_TEMPLATE.format(system_message=SUMMARY_SYSTEM_MESSAGE, text=text)
    inputs = processor.tokenizer(prompt, return_tensors="pt")
    summary = generate_with_inputs(processor, model, inputs, max_new_tokens=max_new_tokens)
    return apply_drug_pronunciations(strip_model_output(summary))


def summarize_long_korean(
    *,
    processor,
    model,
    text: str,
    max_chars: int,
    final_max_chars: int,
    max_new_tokens: int,
    final_max_new_tokens: int,
) -> str:
    chunks = split_text_into_chunks(text, max_chars=max_chars)
    if len(chunks) == 1:
        return summarize_once(processor, model, chunks[0], max_new_tokens=final_max_new_tokens)

    chunk_summaries: List[str] = []
    for chunk in chunks:
        summary = summarize_once(processor, model, chunk, max_new_tokens=max_new_tokens)
        if summary:
            chunk_summaries.append(summary)

    merged = normalize_spaces(" ".join(chunk_summaries))
    if not merged:
        return ""
    if len(merged) <= final_max_chars:
        return summarize_once(processor, model, merged, max_new_tokens=final_max_new_tokens)

    second_pass = [
        summarize_once(processor, model, chunk, max_new_tokens=max_new_tokens)
        for chunk in split_text_into_chunks(merged, max_chars=final_max_chars)
    ]
    return summarize_once(
        processor,
        model,
        normalize_spaces(" ".join(summary for summary in second_pass if summary)),
        max_new_tokens=final_max_new_tokens,
    )


def needs_repair(summary: object, korean: object) -> bool:
    return normalize_spaces(summary) == normalize_spaces(korean) and bool(normalize_spaces(korean))


def save_output(df: pd.DataFrame, output_path: Path, source_id_col: str) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    ordered_columns = [source_id_col, "label", "summary", "Korean", "text"]
    remaining = [column for column in df.columns if column not in ordered_columns]
    df[ordered_columns + remaining].to_csv(output_path, index=False, encoding="utf-8-sig")


def repair_one_text(*, args: argparse.Namespace, processor, model, korean: str) -> str:
    summary = summarize_long_korean(
        processor=processor,
        model=model,
        text=korean,
        max_chars=args.max_chars,
        final_max_chars=args.final_max_chars,
        max_new_tokens=args.max_new_tokens,
        final_max_new_tokens=args.final_max_new_tokens,
    )
    return summary or korean


def repair_worker(*, gpu_id: int, args: argparse.Namespace, task_queue, result_queue) -> None:
    worker_args = argparse.Namespace(**vars(args))
    worker_args.device = "cuda"
    worker_args.gpu_id = gpu_id
    try:
        processor, model = load_model(worker_args)
    except Exception:
        result_queue.put(("fatal", gpu_id, traceback.format_exc()))
        return

    while True:
        task = task_queue.get()
        if task is None:
            break
        row_index, korean = task
        try:
            summary = repair_one_text(
                args=worker_args,
                processor=processor,
                model=model,
                korean=korean,
            )
            result_queue.put(("ok", gpu_id, int(row_index), summary))
        except Exception:
            result_queue.put(("error", gpu_id, int(row_index), traceback.format_exc()))


def run_single_worker(
    *,
    args: argparse.Namespace,
    df: pd.DataFrame,
    output_path: Path,
    checkpoint_path: Path,
    remaining: List[int],
    repaired: Dict[int, str],
) -> None:
    processor, model = load_model(args)
    progress = tqdm(remaining, desc="Repairing summaries", unit="row")
    for processed_count, row_index in enumerate(progress, start=1):
        korean = normalize_spaces(df.at[row_index, args.korean_col])
        summary = repair_one_text(args=args, processor=processor, model=model, korean=korean)
        repaired[row_index] = summary
        df.at[row_index, args.summary_col] = summary

        if processed_count % args.save_every == 0:
            save_checkpoint(checkpoint_path, repaired)
            save_output(df, output_path, args.source_id_col)


def run_multi_gpu_workers(
    *,
    args: argparse.Namespace,
    df: pd.DataFrame,
    output_path: Path,
    checkpoint_path: Path,
    remaining: List[int],
    repaired: Dict[int, str],
) -> None:
    gpu_ids = parse_gpu_ids(args.gpu_ids, args.num_gpus)
    if args.device == "cpu":
        raise RuntimeError("Multi-GPU mode requires CUDA. Use --batch-size 1 for CPU.")
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is not available. Use --device cpu/--batch-size 1 or install CUDA-enabled PyTorch.")

    gpu_count = torch.cuda.device_count()
    unavailable = [gpu_id for gpu_id in gpu_ids if gpu_id < 0 or gpu_id >= gpu_count]
    if unavailable:
        raise RuntimeError(f"CUDA GPU id(s) are not available: {unavailable}. This system reports {gpu_count} GPU(s).")

    worker_count = min(args.batch_size, len(gpu_ids), len(remaining))
    gpu_ids = gpu_ids[:worker_count]
    print(f"Parallel workers: {worker_count}")
    print(f"CUDA GPU ids: {gpu_ids}")

    ctx = mp.get_context("spawn")
    task_queue = ctx.Queue()
    result_queue = ctx.Queue()
    workers = [
        ctx.Process(
            target=repair_worker,
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
    for row_index in remaining:
        korean = normalize_spaces(df.at[row_index, args.korean_col])
        task_queue.put((int(row_index), korean))
    for _ in workers:
        task_queue.put(None)

    processed_count = 0
    progress = tqdm(total=len(remaining), desc="Repairing summaries", unit="row")
    try:
        while processed_count < len(remaining):
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
                _, gpu_id, row_index, error_text = message
                raise RuntimeError(f"Worker on cuda:{gpu_id} failed on row_index={row_index}:\n{error_text}")

            _, gpu_id, row_index, summary = message
            del gpu_id
            repaired[int(row_index)] = summary
            df.at[int(row_index), args.summary_col] = summary
            processed_count += 1
            progress.update(1)

            if processed_count % args.save_every == 0:
                save_checkpoint(checkpoint_path, repaired)
                save_output(df, output_path, args.source_id_col)
    finally:
        progress.close()
        for worker in workers:
            worker.join(timeout=5)
        for worker in workers:
            if worker.is_alive():
                worker.terminate()
                worker.join(timeout=5)


def main() -> None:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)
    checkpoint_path = Path(args.checkpoint)

    if not input_path.exists():
        raise SystemExit(
            f"Input CSV does not exist: {input_path}\n"
            "Use the original CSV as --input, and a new path as --output. "
            "For example:\n"
            "  --input Depression_Severity_Levels_Dataset_clean_translategemma_ko_summary.csv\n"
            "  --output Depression_Severity_Levels_Dataset_clean_translategemma_ko_summary_source_id.csv"
        )

    df = pd.read_csv(input_path, encoding="utf-8", encoding_errors="replace")
    validate_columns(df, args)
    if args.limit is not None:
        df = df.head(args.limit).copy()
    df = df.reset_index(drop=True)

    if args.source_id_col in df.columns:
        df[args.source_id_col] = df[args.source_id_col].astype(str).map(normalize_spaces)
        missing_ids = df[args.source_id_col].eq("")
    else:
        df.insert(0, args.source_id_col, "")
        missing_ids = pd.Series([True] * len(df), index=df.index)

    for row_index in df.index[missing_ids]:
        df.at[row_index, args.source_id_col] = make_source_id(
            args.source_id_prefix,
            args.start_id + int(row_index),
        )

    repair_indices = [
        int(index)
        for index, row in df.iterrows()
        if needs_repair(row[args.summary_col], row[args.korean_col])
    ]
    repaired = load_checkpoint(checkpoint_path)
    remaining = [index for index in repair_indices if index not in repaired]

    print(f"Input rows: {len(df)}")
    print(f"Rows needing summary repair: {len(repair_indices)}")
    print(f"Already repaired rows: {len(repaired)}")
    print(f"Remaining rows: {len(remaining)}")
    print(f"Model: {args.model}")

    for row_index, summary in repaired.items():
        if row_index < len(df):
            df.at[row_index, args.summary_col] = summary

    # Create an inspectable output file before slow model inference starts.
    # This also preserves source_id assignments if the job stops during model loading.
    save_output(df, output_path, args.source_id_col)

    if remaining:
        if args.batch_size > 1 or args.num_gpus > 1 or args.gpu_ids:
            run_multi_gpu_workers(
                args=args,
                df=df,
                output_path=output_path,
                checkpoint_path=checkpoint_path,
                remaining=remaining,
                repaired=repaired,
            )
        else:
            run_single_worker(
                args=args,
                df=df,
                output_path=output_path,
                checkpoint_path=checkpoint_path,
                remaining=remaining,
                repaired=repaired,
            )

    save_checkpoint(checkpoint_path, repaired)
    save_output(df, output_path, args.source_id_col)

    metadata = {
        "input": str(input_path),
        "output": str(output_path),
        "source_id_col": args.source_id_col,
        "rows": int(len(df)),
        "rows_needing_summary_repair": int(len(repair_indices)),
        "model": args.model,
    }
    output_path.with_suffix(".meta.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Saved output CSV: {output_path}")
    print(f"Saved checkpoint CSV: {checkpoint_path}")


if __name__ == "__main__":
    mp.freeze_support()
    torch.set_grad_enabled(False)
    main()
