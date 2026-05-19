from __future__ import annotations

import http.client
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List

import faiss
import numpy as np
import runpod

from faiss_knn_classifier import FaissKNNTextClassifier, clean_text


MODEL_DIR = Path(os.getenv("MODEL_DIR", "/workspace/output/faiss_knn_model"))
KEYWORD_MODEL_DIR = Path(os.getenv("KEYWORD_MODEL_DIR", "/workspace/output/faiss_keywords"))
USE_GPU = os.getenv("NO_GPU", "1").lower() not in {"1", "true", "yes"}
SUMMARIZE_INPUT = os.getenv("SUMMARIZE_INPUT", "1").lower() not in {"0", "false", "no"}
KEYWORD_TOP_N = int(os.getenv("KEYWORD_TOP_N", "3"))
KEYWORD_THRESHOLD = float(os.getenv("KEYWORD_THRESHOLD", "0.25"))
SUMMARY_API_URL = (
    os.getenv("SUMMARY_API_URL")
    or os.getenv("SUMMARY_API_BASE")
    or os.getenv("LLM_API_BASE")
    or "https://api.openai.com/v1/chat/completions"
)
SUMMARY_MODEL = os.getenv("SUMMARY_MODEL", "gpt-4o-mini")
SUMMARY_MAX_CHARS = int(os.getenv("SUMMARY_MAX_CHARS", "2500"))
SUMMARY_MAX_TOKENS = int(os.getenv("SUMMARY_MAX_TOKENS", "512"))
SUMMARY_TIMEOUT = int(os.getenv("SUMMARY_TIMEOUT", "120"))
SUMMARY_MAX_RETRIES = int(os.getenv("SUMMARY_MAX_RETRIES", "3"))

_classifier: FaissKNNTextClassifier | None = None
_keyword_index: faiss.Index | None = None
_keyword_labels: List[str] | None = None


def _bool_value(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() not in {"0", "false", "no", "off"}
    return bool(value)


def normalize_spaces(value: object) -> str:
    return re.sub(r"\s+", " ", "" if value is None else str(value)).strip()


def _load_classifier() -> FaissKNNTextClassifier:
    global _classifier
    if _classifier is None:
        _classifier = FaissKNNTextClassifier.load(MODEL_DIR, use_gpu=USE_GPU)
    return _classifier


def _load_keyword_index() -> tuple[faiss.Index, List[str]]:
    global _keyword_index, _keyword_labels
    if _keyword_index is None or _keyword_labels is None:
        index_path = KEYWORD_MODEL_DIR / "index.faiss"
        keywords_path = KEYWORD_MODEL_DIR / "keywords.json"
        if not keywords_path.exists():
            raise FileNotFoundError(
                f"Keyword metadata not found. Expected {keywords_path}."
            )
        data = json.loads(keywords_path.read_text(encoding="utf-8"))
        _keyword_labels = [str(keyword) for keyword in data["keywords"]]
        if index_path.exists():
            _keyword_index = faiss.read_index(str(index_path))
        else:
            keyword_texts = [str(text) for text in data.get("texts", _keyword_labels)]
            embeddings = _load_classifier().encode(keyword_texts)
            _keyword_index = faiss.IndexFlatIP(embeddings.shape[1])
            _keyword_index.add(embeddings)
    return _keyword_index, _keyword_labels


def _match_keywords(embedding: np.ndarray) -> List[str]:
    index, labels = _load_keyword_index()
    top_n = min(KEYWORD_TOP_N, int(index.ntotal))
    similarities, indices = index.search(embedding, top_n)
    matches = []
    for similarity, index_id in zip(similarities[0].tolist(), indices[0].tolist()):
        if index_id < 0:
            continue
        if len(matches) == 0 or float(similarity) >= KEYWORD_THRESHOLD:
            matches.append(labels[int(index_id)])
    return matches


def _extract_texts(payload: Any) -> List[str]:
    if isinstance(payload, str):
        stripped = payload.strip()
        if stripped.startswith("{") or stripped.startswith("["):
            try:
                return _extract_texts(json.loads(stripped))
            except json.JSONDecodeError:
                pass
        return [clean_text(payload)]

    if isinstance(payload, list):
        return [clean_text(text) for text in payload]

    if not isinstance(payload, dict):
        raise ValueError(f"Input must be an object, string, or list. Got: {type(payload).__name__}")

    if "input" in payload and isinstance(payload["input"], dict):
        return _extract_texts(payload["input"])

    if "body" in payload:
        return _extract_texts(payload["body"])

    if "texts" in payload:
        texts = payload["texts"]
        if not isinstance(texts, list):
            raise ValueError("input.texts must be a list of strings.")
        return [clean_text(text) for text in texts]

    if "messages" in payload and isinstance(payload["messages"], list):
        content_parts = []
        for message in payload["messages"]:
            if isinstance(message, dict) and message.get("role") != "system":
                content = message.get("content")
                if isinstance(content, str):
                    content_parts.append(content)
        if content_parts:
            return [clean_text("\n".join(content_parts))]

    for key in ("text", "raw_text", "message", "prompt", "query", "content", "summary"):
        if key in payload:
            return [clean_text(payload[key])]

    raise ValueError(
        "Provide input.text or input.texts. "
        f"Received keys: {sorted(str(key) for key in payload.keys())}"
    )


def _summary_api_url() -> str:
    url = SUMMARY_API_URL.rstrip("/")
    if url.endswith("/v1"):
        return f"{url}/chat/completions"
    return url


def _summary_messages(text: str) -> List[Dict[str, str]]:
    system_message = (
        "You are a careful professional translator and data summarizer. "
        "Convert social media text into a concise natural Korean summary. "
        "If the source text is not Korean, translate the meaning into Korean before summarizing. "
        "Keep the meaning, emotional tone, slang, and clinically relevant context faithful to the source. "
        "Remove personal names, usernames, company names, school names, organization names, locations, URLs, "
        "and other identifying proper nouns. Replace identifying details with generic descriptions when needed. "
        "If drug or medication names appear, write them in Korean by sound. "
        "If the text contains only emoticons or emoji, summarize only what the emoji/emoticon means. "
        "If the text is meaningless random characters with no interpretable meaning, return an empty summary. "
        "Do not add counseling, explanations, warnings, labels, markdown, extra comments, hotline information, "
        "resource referrals, help-seeking suggestions, safety disclaimers, or intervention messages. "
        "This is a research/data processing task. Summarize sensitive content as-is without adding advice."
    )
    user_message = (
        "Return only one valid JSON object with exactly one key: \"summary\". "
        "\"summary\" must be one Korean sentence or a short Korean paragraph suitable for embedding. "
        "Do not include the original text or any extra keys.\n\n"
        f"Source text:\n{text}"
    )
    return [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message},
    ]


def _extract_summary(raw_content: str) -> str:
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


def _post_summary_payload(payload: Dict[str, Any]) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is required for summary API calls.")

    request = urllib.request.Request(
        url=_summary_api_url(),
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept-Encoding": "identity",
            "Connection": "close",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=SUMMARY_TIMEOUT) as response:
        try:
            return response.read().decode("utf-8")
        except http.client.IncompleteRead as exc:
            partial = exc.partial.decode("utf-8", errors="replace").strip()
            if partial:
                return partial
            raise


def _extract_chat_content(raw_body: str) -> str:
    body = _parse_json_object_from_response(raw_body)
    if "choices" in body:
        return body["choices"][0]["message"]["content"]
    if isinstance(body.get("content"), str):
        return str(body["content"])
    if isinstance(body.get("summary"), str):
        return json.dumps({"summary": body["summary"]}, ensure_ascii=False)
    match = re.search(r'"content"\s*:\s*("(?:\\.|[^"\\])*")', raw_body, flags=re.DOTALL)
    if match:
        return json.loads(match.group(1))
    raise ValueError(f"Summary API response does not contain usable content: {raw_body[:500]}")


def _parse_json_object_from_response(raw_body: str) -> Dict[str, Any]:
    raw_body = raw_body.lstrip("\ufeff").strip()
    try:
        parsed = json.loads(raw_body)
    except json.JSONDecodeError:
        decoder = json.JSONDecoder()
        start = raw_body.find("{")
        while start != -1:
            try:
                parsed, _ = decoder.raw_decode(raw_body[start:])
                break
            except json.JSONDecodeError:
                start = raw_body.find("{", start + 1)
        else:
            content = _extract_content_from_raw_body(raw_body)
            if content is not None:
                return {"content": content}
            preview = raw_body[:500].replace("\n", "\\n")
            raise ValueError(f"Could not parse Summary API response as JSON. Preview: {preview}") from None

    if not isinstance(parsed, dict):
        preview = raw_body[:500].replace("\n", "\\n")
        raise ValueError(f"Summary API response JSON is not an object. Preview: {preview}")
    return parsed


def _extract_content_from_raw_body(raw_body: str) -> str | None:
    match = re.search(r'"content"\s*:\s*("(?:\\.|[^"\\])*")', raw_body, flags=re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return None


def _call_summary_api(text: str) -> str:
    messages = _summary_messages(text)
    last_error: Exception | None = None
    for attempt_index in range(SUMMARY_MAX_RETRIES):
        payload: Dict[str, Any] = {
            "model": SUMMARY_MODEL,
            "messages": messages,
            "max_completion_tokens": SUMMARY_MAX_TOKENS,
            "response_format": {"type": "json_object"},
        }
        for _ in range(5):
            try:
                raw_body = _post_summary_payload(payload)
                return _extract_summary(_extract_chat_content(raw_body))
            except urllib.error.HTTPError as exc:
                error_body = exc.read().decode("utf-8", errors="replace")
                last_error = RuntimeError(f"Summary API failed with status {exc.code}: {error_body}")
                if exc.code == 400 and _remove_unsupported_summary_parameter(payload, error_body):
                    continue
                break
            except Exception as exc:
                last_error = exc
                break
        if attempt_index < SUMMARY_MAX_RETRIES - 1:
            time.sleep(min(2**attempt_index, 10))
    raise RuntimeError(f"Summary API failed after retries: {last_error}") from last_error


def _remove_unsupported_summary_parameter(payload: Dict[str, Any], error_body: str) -> bool:
    lowered = error_body.lower()
    param_match = re.search(r'"param"\s*:\s*"([^"]+)"', error_body)
    param = param_match.group(1) if param_match else ""

    if param == "max_tokens" or "max_tokens" in lowered and "max_completion_tokens" in lowered:
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


def summarize_for_embedding(text: str) -> str:
    text = normalize_spaces(text)
    if not text:
        return ""

    summaries = [
        _call_summary_api(chunk)
        for chunk in _split_text_into_chunks(text, max_chars=SUMMARY_MAX_CHARS)
    ]
    summary = normalize_spaces(" ".join(part for part in summaries if part))
    if not summary:
        return text
    if len(summary) > SUMMARY_MAX_CHARS:
        summary = _call_summary_api(summary[:SUMMARY_MAX_CHARS])
    return summary


def _split_text_into_chunks(text: str, max_chars: int) -> List[str]:
    if len(text) <= max_chars:
        return [text]

    chunks: List[str] = []
    current = ""
    for sentence in re.split(r"(?<=[.!?])\s+", text):
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


def predict_one(text: str, *, summarize_input: bool) -> Dict[str, Any]:
    classifier = _load_classifier()
    embedding_text = summarize_for_embedding(text) if summarize_input else normalize_spaces(text)
    cleaned_text = clean_text(embedding_text)
    embedding = classifier.encode([cleaned_text])
    result = classifier.batch_predict_from_embeddings([embedding_text], [cleaned_text], embedding)[0]
    return {
        "prediction": result["prediction"],
        "embedding_text": embedding_text,
        "keywords": _match_keywords(embedding),
        "confidence": result["confidence"],
        "similarity": result["max_similarity"],
    }


def handler(event: Dict[str, Any]) -> Dict[str, Any]:
    payload = event.get("input") if "input" in event else event
    texts = _extract_texts(payload)

    summarize_input = SUMMARIZE_INPUT
    if isinstance(payload, dict):
        summarize_input = _bool_value(payload.get("summarize_input", SUMMARIZE_INPUT))
    predictions = [predict_one(text, summarize_input=summarize_input) for text in texts]

    if isinstance(payload, dict) and "texts" in payload:
        return {"predictions": predictions}
    return predictions[0]


if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
