import json
import os
import urllib.request
from pathlib import Path


DEFAULT_HOST = os.getenv("REBLOOM_OLLAMA_CHAT_URL", "http://127.0.0.1:11434/api/chat")
DEFAULT_MODEL = os.getenv("REBLOOM_MODEL", "qwen2.5:1.5b")
DEFAULT_HISTORY_TURNS = 2

SYSTEM_PROMPT = (
    "너는 Re:Bloom의 한국어 음성 비서입니다. "
    "반드시 한국어로만 답하세요. 영어, 중국어, 일본어, 로마자 표기는 사용하지 마세요. "
    "사용자의 질문에 한두 문장으로 짧고 자연스럽게 답하세요. "
    "확실하지 않은 정보는 추측하지 말고 모른다고 말하세요."
)


def _int_env(name, default):
    value = os.getenv(name, "").strip()
    if not value:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def post_chat_stream(host, model, messages):
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "keep_alive": os.getenv("REBLOOM_OLLAMA_KEEP_ALIVE", "30m"),
        "options": {
            "num_predict": _int_env("REBLOOM_NUM_PREDICT", 96),
            "num_ctx": _int_env("REBLOOM_NUM_CTX", 2048),
        },
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        host,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    timeout = float(os.getenv("REBLOOM_OLLAMA_TIMEOUT", "120"))
    with urllib.request.urlopen(request, timeout=timeout) as response:
        for raw_line in response:
            line = raw_line.strip()
            if not line:
                continue
            try:
                chunk = json.loads(line)
            except json.JSONDecodeError:
                continue
            content = (chunk.get("message") or {}).get("content", "")
            if content:
                yield content
            if chunk.get("done"):
                break


def post_chat(host, model, messages):
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "keep_alive": os.getenv("REBLOOM_OLLAMA_KEEP_ALIVE", "30m"),
        "options": {
            "num_predict": _int_env("REBLOOM_NUM_PREDICT", 96),
            "num_ctx": _int_env("REBLOOM_NUM_CTX", 2048),
        },
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        host,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    timeout = float(os.getenv("REBLOOM_OLLAMA_TIMEOUT", "120"))
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = json.loads(response.read().decode("utf-8"))

    message = body.get("message") or {}
    content = message.get("content", "")
    if not content and "response" in body:
        content = body.get("response", "")
    content = str(content).strip()
    if not content:
        raise RuntimeError(f"Ollama가 빈 답변을 반환했습니다. model={model}")
    return content


def trim_messages(messages, history_turns=DEFAULT_HISTORY_TURNS):
    if not messages:
        return [{"role": "system", "content": SYSTEM_PROMPT}]

    system = messages[0] if messages[0].get("role") == "system" else {"role": "system", "content": SYSTEM_PROMPT}
    non_system = [message for message in messages if message.get("role") != "system"]
    keep = max(0, history_turns) * 2
    if keep:
        non_system = non_system[-keep:]
    else:
        non_system = []
    return [system, *non_system]


def load_messages(history_file):
    path = Path(history_file)
    if not path.exists():
        return [{"role": "system", "content": SYSTEM_PROMPT}]

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return [{"role": "system", "content": SYSTEM_PROMPT}]

    if not isinstance(data, list):
        return [{"role": "system", "content": SYSTEM_PROMPT}]

    messages = [
        message
        for message in data
        if isinstance(message, dict)
        and isinstance(message.get("role"), str)
        and isinstance(message.get("content"), str)
    ]
    if not messages or messages[0].get("role") != "system":
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})
    return trim_messages(messages)


def save_messages(messages, history_file):
    path = Path(history_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(trim_messages(messages), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
