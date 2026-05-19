from __future__ import annotations

import json
import os
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Sequence

import faiss
import numpy as np
import runpod
import torch
from dotenv import load_dotenv
from openai import OpenAI
from transformers import (
    AutoModelForImageTextToText,
    AutoModelForSequenceClassification,
    AutoProcessor,
    AutoTokenizer,
)

from faiss_knn_classifier import FaissKNNTextClassifier, clean_text


load_dotenv()

TRANSLATION_MODEL_NAME = os.getenv("TRANSLATION_MODEL", "google/translategemma-12b-it")
DEPRESSION_MODEL_NAME = os.getenv("DEPRESSION_MODEL", "rafalposwiata/deproberta-large-depression")
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HUGGING_FACE_HUB_TOKEN")
CACHE_DIR = os.getenv("HF_HOME", "/workspace/.cache/huggingface")
MODEL_DIR = Path(os.getenv("MODEL_DIR", "/workspace/output/faiss_openai_large"))
KEYWORD_MODEL_DIR = Path(os.getenv("KEYWORD_MODEL_DIR", "/workspace/output/faiss_keywords"))
USE_FAISS = os.getenv("USE_FAISS", "0").lower() not in {"0", "false", "no", "off"}
USE_GPU_FAISS = os.getenv("NO_GPU", "1").lower() not in {"1", "true", "yes"}
SUMMARIZE_INPUT = os.getenv("SUMMARIZE_INPUT", "1").lower() not in {"0", "false", "no", "off"}
SUMMARY_API_URL = (
    os.getenv("SUMMARY_API_URL")
    or os.getenv("SUMMARY_API_BASE")
    or os.getenv("LLM_API_BASE")
    or os.getenv("OPENAI_API_URL")
    or os.getenv("GMS_API_URL")
    or "https://api.openai.com/v1/chat/completions"
)
SUMMARY_API_KEY = os.getenv("SUMMARY_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("GMS_API_KEY")
SUMMARY_MODEL = os.getenv("SUMMARY_MODEL", "gpt-4o-mini")
SUMMARY_MAX_CHARS = int(os.getenv("SUMMARY_MAX_CHARS", "2500"))
SUMMARY_MAX_TOKENS = int(os.getenv("SUMMARY_MAX_TOKENS", "512"))
SUMMARY_TIMEOUT = int(os.getenv("SUMMARY_TIMEOUT", "120"))
SUMMARY_MAX_RETRIES = int(os.getenv("SUMMARY_MAX_RETRIES", "3"))
KEYWORD_TOP_N = int(os.getenv("KEYWORD_TOP_N", "3"))
KEYWORD_THRESHOLD = float(os.getenv("KEYWORD_THRESHOLD", "0.25"))

SOURCE_LANG = os.getenv("SOURCE_LANG", "ko")
TARGET_LANG = os.getenv("TARGET_LANG", "en")
SKIP_TRANSLATION = os.getenv("SKIP_TRANSLATION", "0").lower() in {"1", "true", "yes", "on"}
MAX_TRANSLATION_TOKENS = int(os.getenv("MAX_TRANSLATION_TOKENS", "512"))
MAX_GMS_TOKENS = int(os.getenv("MAX_GMS_TOKENS", "512"))
MAX_INPUT_CHARS = int(os.getenv("MAX_INPUT_CHARS", "4000"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "2"))
GMS_API_URL = os.getenv("GMS_API_URL") or os.getenv("GMS_POST_URL") or os.getenv("OPENAI_API_URL")
GMS_API_KEY = os.getenv("GMS_API_KEY") or os.getenv("OPENAI_API_KEY")
GMS_MODEL = os.getenv("GMS_MODEL", "gpt-5-mini")
GMS_TIMEOUT = int(os.getenv("GMS_TIMEOUT", "120"))
DEVICE = os.getenv("DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
GPU_ID = int(os.getenv("GPU_ID", "0"))
TORCH_DTYPE = os.getenv("TORCH_DTYPE", "bfloat16")

DEPRESSION_FEATURE_KEYS = [
    "not_depressed_logit",
    "moderately_depressed_logit",
    "severely_depressed_logit",
]

GMS_QUESTIONS = [
    {
        "key": "suicidal_thought",
        "question": "Have you had thoughts of death or suicide, or have you made any suicide attempts?",
    },
    {
        "key": "anhedonia",
        "question": "Have you lost interest or pleasure in activities you used to enjoy?",
    },
    {
        "key": "concentration_problem",
        "question": "Are you finding it challenging to concentrate on tasks or make decisions?",
    },
    {
        "key": "mood_change",
        "question": "Have you noticed significant changes in your mood, such as feeling persistently sad, empty, or hopeless?",
    },
    {
        "key": "financial_problem",
        "question": "Have you been experiencing any financial problems recently?",
    },
    {
        "key": "social_withdrawal",
        "question": "Do you find it challenging to socialize and prefer solitary activities, indicating introverted tendencies?",
    },
    {
        "key": "sleep_problem",
        "question": "Have you experienced difficulties with your sleep, such as trouble falling asleep, staying asleep, or waking up too early?",
    },
    {
        "key": "wellbeing",
        "question": "Have you felt emotionally and physically well lately?",
    },
]

ALL_FEATURE_KEYS = DEPRESSION_FEATURE_KEYS + [item["key"] for item in GMS_QUESTIONS]


@dataclass
class ModelBundle:
    depression_tokenizer: Any
    depression_model: Any


@dataclass
class TranslatorBundle:
    processor: Any
    model: Any


_bundle: ModelBundle | None = None
_translator_bundle: TranslatorBundle | None = None
_gms_client: OpenAI | None = None
_classifier: FaissKNNTextClassifier | None = None
_keyword_index: faiss.Index | None = None
_keyword_labels: List[str] | None = None


def normalize_spaces(value: object) -> str:
    return re.sub(r"\s+", " ", "" if value is None else str(value)).strip()


def bool_value(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def load_classifier() -> FaissKNNTextClassifier:
    global _classifier
    if _classifier is None:
        _classifier = FaissKNNTextClassifier.load(MODEL_DIR, use_gpu=USE_GPU_FAISS)
    return _classifier


def load_keyword_index() -> tuple[faiss.Index, List[str]]:
    global _keyword_index, _keyword_labels
    if _keyword_index is None or _keyword_labels is None:
        keywords_path = KEYWORD_MODEL_DIR / "keywords.json"
        index_path = KEYWORD_MODEL_DIR / "index.faiss"
        data = json.loads(keywords_path.read_text(encoding="utf-8"))
        _keyword_labels = [str(keyword) for keyword in data["keywords"]]
        if index_path.exists():
            _keyword_index = faiss.read_index(str(index_path))
        else:
            keyword_texts = [str(text) for text in data.get("texts", _keyword_labels)]
            embeddings = load_classifier().encode(keyword_texts)
            _keyword_index = faiss.IndexFlatIP(embeddings.shape[1])
            _keyword_index.add(embeddings)
    return _keyword_index, _keyword_labels


def match_keywords(embedding: np.ndarray) -> List[str]:
    index, labels = load_keyword_index()
    if embedding.ndim != 2:
        raise ValueError(f"Embedding must be a 2D matrix, got shape {embedding.shape}.")
    if embedding.shape[1] != index.d:
        raise ValueError(
            "Embedding dimension does not match keyword FAISS index. "
            f"Got {embedding.shape[1]}, expected {index.d}. "
            "Use the same embedding model/dimensions that were used to build faiss_keywords."
        )
    top_n = min(KEYWORD_TOP_N, int(index.ntotal))
    similarities, indices = index.search(embedding, top_n)
    matches: List[str] = []
    for similarity, index_id in zip(similarities[0].tolist(), indices[0].tolist()):
        if index_id < 0:
            continue
        if not matches or float(similarity) >= KEYWORD_THRESHOLD:
            matches.append(labels[int(index_id)])
    return matches


def summary_api_url() -> str:
    url = SUMMARY_API_URL.rstrip("/")
    if url.endswith("/v1"):
        return f"{url}/chat/completions"
    return url


def summary_messages(text: str) -> List[Dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You are a careful professional translator and data summarizer. "
                "Convert the supplied user text into a concise natural Korean summary for embedding. "
                "Keep clinically relevant context, emotional tone, and concrete problems faithful. "
                "Remove personal names, usernames, locations, URLs, and identifying proper nouns. "
                "Return no advice, diagnosis, safety resources, markdown, or commentary."
            ),
        },
        {
            "role": "user",
            "content": (
                "Return only one valid JSON object with exactly one key: \"summary\". "
                "\"summary\" must be one Korean sentence or a short Korean paragraph suitable for embedding.\n\n"
                f"Source text:\n{text}"
            ),
        },
    ]


def extract_summary(raw_content: str) -> str:
    cleaned = re.sub(r"^```(?:json|text|markdown)?\s*", "", raw_content.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            parsed = json.loads(cleaned[start : end + 1])
        else:
            return normalize_spaces(cleaned)
    if isinstance(parsed, dict):
        return normalize_spaces(parsed.get("summary", ""))
    return normalize_spaces(cleaned)


def post_summary_payload(payload: Dict[str, Any]) -> str:
    if not SUMMARY_API_KEY:
        raise RuntimeError("SUMMARY_API_KEY, OPENAI_API_KEY, or GMS_API_KEY is required for embedding summaries.")
    request = urllib.request.Request(
        url=summary_api_url(),
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {SUMMARY_API_KEY}",
            "Content-Type": "application/json",
            "Accept-Encoding": "identity",
            "Connection": "close",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=SUMMARY_TIMEOUT) as response:
        return response.read().decode("utf-8", errors="replace")


def extract_chat_content(raw_body: str) -> str:
    body = extract_json_object(raw_body)
    if "choices" in body:
        return body["choices"][0]["message"]["content"]
    if isinstance(body.get("content"), str):
        return str(body["content"])
    if isinstance(body.get("summary"), str):
        return json.dumps({"summary": body["summary"]}, ensure_ascii=False)
    raise ValueError(f"Summary API response does not contain usable content: {raw_body[:500]}")


def remove_unsupported_summary_parameter(payload: Dict[str, Any], error_body: str) -> bool:
    lowered = error_body.lower()
    param_match = re.search(r'"param"\s*:\s*"([^"]+)"', error_body)
    param = param_match.group(1) if param_match else ""
    if param == "max_tokens" or ("max_tokens" in lowered and "max_completion_tokens" in lowered):
        payload.pop("max_tokens", None)
        payload["max_completion_tokens"] = SUMMARY_MAX_TOKENS
        return True
    if param == "max_completion_tokens":
        payload.pop("max_completion_tokens", None)
        payload["max_tokens"] = SUMMARY_MAX_TOKENS
        return True
    for removable in ("response_format", "temperature"):
        if param == removable or removable in lowered:
            return payload.pop(removable, None) is not None
    if param and param in payload:
        payload.pop(param, None)
        return True
    return False


def call_summary_api(text: str) -> str:
    last_error: Exception | None = None
    for attempt_index in range(SUMMARY_MAX_RETRIES):
        payload: Dict[str, Any] = {
            "model": SUMMARY_MODEL,
            "messages": summary_messages(text),
            "max_completion_tokens": SUMMARY_MAX_TOKENS,
            "response_format": {"type": "json_object"},
        }
        for _ in range(5):
            try:
                raw_body = post_summary_payload(payload)
                return extract_summary(extract_chat_content(raw_body))
            except urllib.error.HTTPError as exc:
                error_body = exc.read().decode("utf-8", errors="replace")
                last_error = RuntimeError(f"Summary API failed with status {exc.code}: {error_body}")
                if exc.code == 400 and remove_unsupported_summary_parameter(payload, error_body):
                    continue
                break
            except Exception as exc:
                last_error = exc
                break
        if attempt_index < SUMMARY_MAX_RETRIES - 1:
            time.sleep(min(2**attempt_index, 10))
    raise RuntimeError(f"Summary API failed after retries: {last_error}") from last_error


def split_text_into_chunks(text: str, max_chars: int) -> List[str]:
    if len(text) <= max_chars:
        return [text]
    chunks: List[str] = []
    current = ""
    for sentence in re.split(r"(?<=[.!?。！？])\s+", text):
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(sentence) > max_chars:
            if current:
                chunks.append(current)
                current = ""
            chunks.extend(sentence[start : start + max_chars].strip() for start in range(0, len(sentence), max_chars))
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


def summarize_for_embedding(text: str) -> str:
    text = normalize_spaces(text)
    if not text:
        return ""
    summaries = [call_summary_api(chunk) for chunk in split_text_into_chunks(text, SUMMARY_MAX_CHARS)]
    summary = normalize_spaces(" ".join(part for part in summaries if part))
    if not summary:
        return text
    if len(summary) > SUMMARY_MAX_CHARS:
        summary = call_summary_api(summary[:SUMMARY_MAX_CHARS])
    return summary


def embedding_payload(text: str, *, summarize_input: bool) -> Dict[str, Any]:
    if not USE_FAISS:
        return {"embedding_text": normalize_spaces(text), "keywords": []}
    classifier = load_classifier()
    embedding_text = summarize_for_embedding(text) if summarize_input else normalize_spaces(text)
    cleaned_text = clean_text(embedding_text)
    embedding = classifier.encode([cleaned_text])
    return {
        "embedding_text": embedding_text,
        "keywords": match_keywords(embedding),
    }


def choose_dtype() -> torch.dtype:
    if DEVICE == "cpu":
        return torch.float32
    if TORCH_DTYPE == "float16":
        return torch.float16
    if TORCH_DTYPE == "float32":
        return torch.float32
    return torch.bfloat16


def model_kwargs() -> Dict[str, Any]:
    kwargs: Dict[str, Any] = {
        "cache_dir": CACHE_DIR,
        "torch_dtype": choose_dtype(),
    }
    if HF_TOKEN:
        kwargs["token"] = HF_TOKEN
    if DEVICE == "cuda":
        if not torch.cuda.is_available():
            raise RuntimeError("DEVICE=cuda was requested, but CUDA is not available.")
        torch.cuda.set_device(GPU_ID)
        kwargs["device_map"] = {"": f"cuda:{GPU_ID}"}
    return kwargs


def tokenizer_kwargs() -> Dict[str, Any]:
    kwargs: Dict[str, Any] = {"cache_dir": CACHE_DIR}
    if HF_TOKEN:
        kwargs["token"] = HF_TOKEN
    return kwargs


def load_models() -> ModelBundle:
    global _bundle
    if _bundle is not None:
        return _bundle
    depression_tokenizer = AutoTokenizer.from_pretrained(DEPRESSION_MODEL_NAME, **tokenizer_kwargs())
    depression_model = AutoModelForSequenceClassification.from_pretrained(
        DEPRESSION_MODEL_NAME,
        **model_kwargs(),
    )
    if DEVICE == "cpu":
        depression_model.to("cpu")
    depression_model.eval()

    _bundle = ModelBundle(
        depression_tokenizer=depression_tokenizer,
        depression_model=depression_model,
    )
    return _bundle


def load_translator() -> TranslatorBundle:
    global _translator_bundle
    if _translator_bundle is not None:
        return _translator_bundle

    processor = AutoProcessor.from_pretrained(TRANSLATION_MODEL_NAME, **tokenizer_kwargs())
    model = AutoModelForImageTextToText.from_pretrained(
        TRANSLATION_MODEL_NAME,
        **model_kwargs(),
    )
    if DEVICE == "cpu":
        model.to("cpu")
    model.eval()

    _translator_bundle = TranslatorBundle(processor=processor, model=model)
    return _translator_bundle


def generate_with_translategemma(prompt_or_messages: Any, max_new_tokens: int, *, is_translation: bool) -> str:
    bundle = load_translator()
    processor = bundle.processor
    model = bundle.model

    if is_translation:
        inputs = processor.apply_chat_template(
            prompt_or_messages,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt",
        )
    else:
        inputs = processor.tokenizer(str(prompt_or_messages), return_tensors="pt")

    inputs = inputs.to(next(model.parameters()).device)
    input_len = inputs["input_ids"].shape[-1]
    with torch.inference_mode():
        output = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            pad_token_id=processor.tokenizer.pad_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
        )
    generated_ids = output[0][input_len:]
    return normalize_spaces(processor.decode(generated_ids, skip_special_tokens=True))


def translate_to_english(text: str, *, source_lang: str, target_lang: str) -> str:
    if source_lang.lower() == "en" and target_lang.lower() == "en":
        return text
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "source_lang_code": source_lang,
                    "target_lang_code": target_lang,
                    "text": text,
                }
            ],
        }
    ]
    return generate_with_retry(
        lambda: generate_with_translategemma(messages, MAX_TRANSLATION_TOKENS, is_translation=True)
    )


def render_gms_prompt(text: str) -> str:
    question_lines = "\n".join(
        f'- "{item["key"]}": {item["question"]}' for item in GMS_QUESTIONS
    )
    keys = ", ".join(f'"{item["key"]}"' for item in GMS_QUESTIONS)
    return (
        "You are extracting structured mental-health related features from Korean user text. "
        "This is for research feature extraction, not diagnosis or advice.\n\n"
        "For each question, score only from explicit or strongly implied evidence in the text:\n"
        "- 1 means yes / clearly present.\n"
        "- 0.5 means somewhat present / partially present / ambiguous but likely.\n"
        "- 0 means no symptom, no problem, or not mentioned.\n\n"
        "Return only one valid JSON object. The object must have exactly these numeric keys: "
        f"{keys}. Values must be only 0, 0.5, or 1.\n\n"
        "Questions:\n"
        f"{question_lines}\n\n"
        f"Korean text:\n{text}"
    )


def extract_json_object(raw: str) -> Dict[str, Any]:
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
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
        raise ValueError("GMS response is not a JSON object.")
    return parsed


def coerce_gms_score(value: Any) -> float:
    if isinstance(value, (int, float)):
        number = float(value)
    elif isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"1", "yes", "true"}:
            number = 1.0
        elif lowered in {"0.5", "somewhat", "partial"}:
            number = 0.5
        else:
            number = 0.0
    else:
        number = 0.0

    if number >= 0.75:
        return 1.0
    if number >= 0.25:
        return 0.5
    return 0.0


def normalize_openai_chat_base_url(url: str | None) -> str | None:
    if not url:
        return None
    cleaned = url.rstrip("/")
    if cleaned.endswith("/chat/completions"):
        cleaned = cleaned[: -len("/chat/completions")].rstrip("/")
    return cleaned


def load_gms_client() -> OpenAI:
    global _gms_client
    if _gms_client is not None:
        return _gms_client
    if not GMS_API_KEY:
        raise RuntimeError("GMS_API_KEY or OPENAI_API_KEY must be set for external GMS extraction.")

    kwargs: Dict[str, Any] = {
        "api_key": GMS_API_KEY,
        "timeout": GMS_TIMEOUT,
    }
    base_url = normalize_openai_chat_base_url(GMS_API_URL)
    if base_url:
        kwargs["base_url"] = base_url
    _gms_client = OpenAI(**kwargs)
    return _gms_client


def gms_messages(korean_text: str) -> List[Dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You extract numeric research features from Korean clinical interview text. "
                "Return only valid JSON. Do not provide diagnosis, advice, safety resources, or commentary."
            ),
        },
        {"role": "user", "content": render_gms_prompt(korean_text)},
    ]


def call_gms_api(korean_text: str) -> Dict[str, Any]:
    client = load_gms_client()
    request: Dict[str, Any] = {
        "model": GMS_MODEL,
        "messages": gms_messages(korean_text),
        "response_format": {"type": "json_object"},
        "max_completion_tokens": MAX_GMS_TOKENS,
    }
    for _ in range(4):
        try:
            response = client.chat.completions.create(**request)
            content = response.choices[0].message.content or "{}"
            return extract_json_object(content)
        except Exception as exc:
            message = str(exc).lower()
            if "max_completion_tokens" in message and "max_tokens" not in request:
                request.pop("max_completion_tokens", None)
                request["max_tokens"] = MAX_GMS_TOKENS
                continue
            if "max_tokens" in message and "max_completion_tokens" not in request:
                request.pop("max_tokens", None)
                request["max_completion_tokens"] = MAX_GMS_TOKENS
                continue
            if "response_format" in message and request.pop("response_format", None) is not None:
                continue
            raise
    raise RuntimeError("GMS API request could not be built with supported parameters.")


def extract_gms_features(korean_text: str) -> Dict[str, float]:
    parsed = generate_with_retry(lambda: call_gms_api(korean_text))
    return {
        item["key"]: coerce_gms_score(parsed.get(item["key"], 0.0))
        for item in GMS_QUESTIONS
    }


def generate_with_retry(fn):
    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            return fn()
        except Exception as exc:
            last_error = exc
            if attempt < MAX_RETRIES:
                time.sleep(min(2**attempt, 8))
    raise RuntimeError(f"Model generation failed after retries: {last_error}") from last_error


def canonical_depression_label(label: str, index: int) -> str:
    normalized = re.sub(r"[^a-z0-9]+", " ", label.lower()).strip()
    if normalized in {"not depression", "not depressed", "none", "minimal", "label 0"}:
        return "not_depressed_logit"
    if normalized in {"moderate", "moderately depressed", "moderate depression", "label 1"}:
        return "moderately_depressed_logit"
    if normalized in {"severe", "severely depressed", "severe depression", "label 2"}:
        return "severely_depressed_logit"
    return DEPRESSION_FEATURE_KEYS[index] if index < len(DEPRESSION_FEATURE_KEYS) else f"logit_{index}"


def depression_logits(english_text: str) -> Dict[str, float]:
    bundle = load_models()
    tokenizer = bundle.depression_tokenizer
    model = bundle.depression_model
    inputs = tokenizer(
        english_text,
        return_tensors="pt",
        truncation=True,
        max_length=int(os.getenv("DEPRESSION_MAX_LENGTH", "512")),
    ).to(next(model.parameters()).device)

    with torch.inference_mode():
        logits = model(**inputs).logits[0].detach().float().cpu().numpy()

    id2label = getattr(model.config, "id2label", {}) or {}
    features = {key: 0.0 for key in DEPRESSION_FEATURE_KEYS}
    raw_by_label = {}
    for index, value in enumerate(logits.tolist()):
        label = str(id2label.get(index, f"LABEL_{index}"))
        key = canonical_depression_label(label, index)
        raw_by_label[label] = float(value)
        if key in features:
            features[key] = float(value)

    return features | {"_raw_logits": raw_by_label}


def extract_payload(payload: Any) -> Any:
    if isinstance(payload, dict) and "input" in payload:
        return payload["input"]
    return payload


def extract_texts(payload: Any) -> List[str]:
    if isinstance(payload, str):
        return [normalize_spaces(payload)]
    if isinstance(payload, list):
        return [normalize_spaces(item) for item in payload]
    if not isinstance(payload, dict):
        raise ValueError(f"Input must be an object, string, or list. Got {type(payload).__name__}.")
    if "texts" in payload:
        if not isinstance(payload["texts"], list):
            raise ValueError("input.texts must be a list.")
        return [normalize_spaces(item) for item in payload["texts"]]
    for key in ("text", "message", "content", "query", "prompt"):
        if key in payload:
            return [normalize_spaces(payload[key])]
    raise ValueError("Provide input.text or input.texts.")


def predict_one(
    text: str,
    *,
    source_lang: str = SOURCE_LANG,
    target_lang: str = TARGET_LANG,
    skip_translation: bool = SKIP_TRANSLATION,
    summarize_input: bool = SUMMARIZE_INPUT,
    target_date: str | None = None,
    include_debug: bool = False,
) -> Dict[str, Any]:
    input_text = normalize_spaces(text)[:MAX_INPUT_CHARS]
    if not input_text:
        raise ValueError("Input text is empty.")

    embedding = embedding_payload(input_text, summarize_input=summarize_input)
    english_text = input_text if skip_translation else translate_to_english(
        input_text,
        source_lang=source_lang,
        target_lang=target_lang,
    )
    dep = depression_logits(english_text)
    raw_logits = dep.pop("_raw_logits")
    gms = extract_gms_features(input_text)
    features = {**dep, **gms}
    logits = [features[key] for key in ALL_FEATURE_KEYS]

    output: Dict[str, Any] = {
        "embedding_text": embedding["embedding_text"],
        "keywords": embedding["keywords"],
        "logits": logits,
        "target_date": target_date or date.today().isoformat(),
    }
    if include_debug:
        output.update(
            {
                "features": features,
                "feature_order": ALL_FEATURE_KEYS,
                "feature_vector": logits,
                "translated_english": english_text,
                "translation_skipped": bool(skip_translation),
                "source_lang": source_lang,
                "target_lang": target_lang,
                "deproberta_raw_logits": raw_logits,
            }
        )
    return output


def handler(event: Dict[str, Any]) -> Dict[str, Any]:
    payload = extract_payload(event)
    texts = extract_texts(payload)
    source_lang = SOURCE_LANG
    target_lang = TARGET_LANG
    skip_translation = SKIP_TRANSLATION
    summarize_input = SUMMARIZE_INPUT
    target_date = None
    include_debug = False
    if isinstance(payload, dict):
        source_lang = str(payload.get("source_lang", source_lang))
        target_lang = str(payload.get("target_lang", target_lang))
        target_date = payload.get("target_date")
        summarize_input = bool_value(payload.get("summarize_input", SUMMARIZE_INPUT))
        include_debug = bool_value(payload.get("include_debug", False))
        if "skip_translation" in payload:
            skip_translation = bool_value(payload["skip_translation"])
    predictions = [
        predict_one(
            text,
            source_lang=source_lang,
            target_lang=target_lang,
            skip_translation=skip_translation,
            summarize_input=summarize_input,
            target_date=str(target_date) if target_date else None,
            include_debug=include_debug,
        )
        for text in texts
    ]
    if isinstance(payload, dict) and "texts" in payload:
        return {"predictions": predictions}
    return predictions[0]


if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
