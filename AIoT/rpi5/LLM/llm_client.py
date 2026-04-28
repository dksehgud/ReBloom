# llm 테스트 코드

import json
import urllib.error
import urllib.request


DEFAULT_MODEL = "rebloom-qwen"
DEFAULT_HOST = "http://127.0.0.1:11434"

SYSTEM_PROMPT = (
    "You are Re:Bloom, a compact local AI assistant running on a Raspberry Pi. "
    "Speak in natural Korean by default. Keep answers short, warm, and practical. "
    "If device control is requested, say what command should be routed instead of "
    "pretending that hardware control already happened."
)


def post_chat(host, model, messages, timeout=120):
    url = host.rstrip("/") + "/api/chat"
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.6,
            "top_p": 0.9,
            "num_ctx": 4096,
        },
    }
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except urllib.error.URLError as exc:
        raise RuntimeError(
            "Ollama API에 연결할 수 없습니다. "
            "`systemctl status ollama` 또는 `ollama serve`를 확인하세요."
        ) from exc

    result = json.loads(body)
    return result["message"]["content"]


def trim_messages(messages, keep_turns=6):
    max_messages = 1 + keep_turns * 2
    if len(messages) <= max_messages:
        return messages
    return [messages[0]] + messages[-(max_messages - 1):]
