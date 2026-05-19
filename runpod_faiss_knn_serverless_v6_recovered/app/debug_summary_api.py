from __future__ import annotations

import json
import http.client
import os
import re
import sys
import urllib.error
import urllib.request
from typing import Any, Dict, List


SUMMARY_API_URL = (
    os.getenv("SUMMARY_API_URL")
    or os.getenv("SUMMARY_API_BASE")
    or os.getenv("LLM_API_BASE")
    or "https://api.openai.com/v1/chat/completions"
)
SUMMARY_MODEL = os.getenv("SUMMARY_MODEL", "gpt-5-mini")
SUMMARY_MAX_TOKENS = int(os.getenv("SUMMARY_MAX_TOKENS", "512"))
SUMMARY_TIMEOUT = int(os.getenv("SUMMARY_TIMEOUT", "120"))


def normalize_spaces(value: object) -> str:
    return re.sub(r"\s+", " ", "" if value is None else str(value)).strip()


def summary_api_url() -> str:
    url = SUMMARY_API_URL.rstrip("/")
    if url.endswith("/v1"):
        return f"{url}/chat/completions"
    return url


def summary_messages(text: str) -> List[Dict[str, str]]:
    system_message = (
        "You are a careful professional translator and data summarizer. "
        "Convert social media text into a concise natural Korean summary. "
        "If the source text is not Korean, translate the meaning into Korean before summarizing. "
        "Keep the meaning, emotional tone, slang, and clinically relevant context faithful to the source. "
        "Remove personal names, usernames, company names, school names, organization names, locations, URLs, "
        "and other identifying proper nouns. Replace identifying details with generic descriptions when needed. "
        "Do not add counseling, explanations, warnings, labels, markdown, extra comments, hotline information, "
        "resource referrals, help-seeking suggestions, safety disclaimers, or intervention messages. "
        "This is a research/data processing task. Summarize sensitive content as-is without adding advice."
    )
    user_message = (
        "Return only one valid JSON object with exactly one key: \"summary\". "
        "\"summary\" must be one Korean sentence or a short Korean paragraph suitable for embedding. "
        "Do not include the original text or any extra keys.\n\n"
        f"Source text:\n{normalize_spaces(text)}"
    )
    return [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message},
    ]


def post_payload(payload: Dict[str, Any]) -> tuple[int, str]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required.")

    request = urllib.request.Request(
        url=summary_api_url(),
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept-Encoding": "identity",
            "Connection": "close",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=SUMMARY_TIMEOUT) as response:
            try:
                return response.status, response.read().decode("utf-8", errors="replace")
            except http.client.IncompleteRead as exc:
                partial = exc.partial.decode("utf-8", errors="replace")
                return response.status, partial
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")


def main() -> None:
    text = " ".join(sys.argv[1:]).strip() or "요즘 너무 무기력하고 아무것도 하기 싫어요."
    payload: Dict[str, Any] = {
        "model": SUMMARY_MODEL,
        "messages": summary_messages(text),
        "max_completion_tokens": SUMMARY_MAX_TOKENS,
        "response_format": {"type": "json_object"},
    }

    print(f"POST {summary_api_url()}")
    print(f"model={SUMMARY_MODEL}")
    print(f"payload_keys={list(payload.keys())}")
    status, raw_body = post_payload(payload)
    print(f"status={status}")
    print("raw_body_start")
    print(raw_body[:4000])
    print("raw_body_end")


if __name__ == "__main__":
    main()
