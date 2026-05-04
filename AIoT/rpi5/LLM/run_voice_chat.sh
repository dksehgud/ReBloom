#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON_BIN="${REBLOOM_PYTHON:-$PROJECT_DIR/venv/bin/python}"
OLLAMA_HOST_URL="${REBLOOM_OLLAMA_HEALTH_URL:-http://127.0.0.1:11434/api/tags}"
OLLAMA_CHAT_URL="${REBLOOM_OLLAMA_CHAT_URL:-http://127.0.0.1:11434/api/chat}"
OLLAMA_MODEL="${REBLOOM_MODEL:-rebloom-gemma4}"
OLLAMA_KEEP_ALIVE="${REBLOOM_OLLAMA_KEEP_ALIVE:-30m}"

if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$SCRIPT_DIR/.env"
    set +a
fi

if [ -z "${REBLOOM_WHISPER_BIN:-}" ] && [ -x "$HOME/whisper.cpp/build/bin/whisper-cli" ]; then
    export REBLOOM_WHISPER_BIN="$HOME/whisper.cpp/build/bin/whisper-cli"
fi

if [ -z "${REBLOOM_WHISPER_MODEL:-}" ] && [ -f "$HOME/whisper.cpp/models/ggml-base.bin" ]; then
    export REBLOOM_WHISPER_MODEL="$HOME/whisper.cpp/models/ggml-base.bin"
fi

if [ -z "${REBLOOM_WHISPER_BIN:-}" ] || [ -z "${REBLOOM_WHISPER_MODEL:-}" ]; then
    echo "[voice] whisper.cpp 경로가 없습니다. REBLOOM_WHISPER_BIN / REBLOOM_WHISPER_MODEL을 설정하세요." >&2
    exit 1
fi

if [ ! -x "$PYTHON_BIN" ]; then
    echo "[voice] Python 실행 파일을 찾을 수 없습니다: $PYTHON_BIN" >&2
    exit 1
fi

wait_for_wifi() {
    if [ "${REBLOOM_SKIP_WIFI_WAIT:-0}" = "1" ]; then
        return 0
    fi
    if ! command -v nmcli >/dev/null 2>&1; then
        return 0
    fi

    until nmcli -t -f TYPE,STATE device | grep -q '^wifi:connected'; do
        echo "[voice] Wi-Fi 연결 대기 중..."
        sleep 5
    done
}

wait_for_ollama() {
    if [ "${REBLOOM_SKIP_OLLAMA_WAIT:-0}" = "1" ]; then
        return 0
    fi

    until "$PYTHON_BIN" - "$OLLAMA_HOST_URL" <<'PY'
import sys
import urllib.request

try:
    with urllib.request.urlopen(sys.argv[1], timeout=3) as response:
        raise SystemExit(0 if response.status < 500 else 1)
except Exception:
    raise SystemExit(1)
PY
    do
        echo "[voice] Ollama API 대기 중..."
        sleep 5
    done
}

warm_up_ollama() {
    if [ "${REBLOOM_OLLAMA_WARMUP:-1}" != "1" ]; then
        return 0
    fi

    echo "[voice] Ollama 모델 워밍업 중: $OLLAMA_MODEL"
    "$PYTHON_BIN" - "$OLLAMA_CHAT_URL" "$OLLAMA_MODEL" "$OLLAMA_KEEP_ALIVE" <<'PY'
import json
import sys
import urllib.request

url, model, keep_alive = sys.argv[1:4]
payload = {
    "model": model,
    "messages": [{"role": "user", "content": "ping"}],
    "stream": False,
    "keep_alive": keep_alive,
    "options": {"num_predict": 1, "num_ctx": 256},
}
data = json.dumps(payload).encode("utf-8")
request = urllib.request.Request(
    url,
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(request, timeout=120) as response:
    response.read()
PY
}

wait_for_audio_input() {
    if [ "${REBLOOM_SKIP_AUDIO_WAIT:-0}" = "1" ]; then
        return 0
    fi
    if ! command -v arecord >/dev/null 2>&1 || ! command -v aplay >/dev/null 2>&1; then
        echo "[voice] ALSA 명령이 없어 오디오 장치 대기를 건너뜁니다."
        return 0
    fi

    until arecord -l 2>/dev/null | grep -q '^card '; do
        echo "[voice] 마이크 입력 장치 대기 중..."
        sleep 5
    done

    until aplay -l 2>/dev/null | grep -q '^card '; do
        echo "[voice] 스피커 출력 장치 대기 중..."
        sleep 5
    done
}

wait_for_wifi
wait_for_ollama
warm_up_ollama
wait_for_audio_input

if [ "${REBLOOM_WAKE_ENGINE:-whisper}" = "openwakeword" ]; then
    exec "$PYTHON_BIN" "$SCRIPT_DIR/wake_openwakeword.py" "$@"
fi

exec "$PYTHON_BIN" "$SCRIPT_DIR/voice_chat.py" "$@"
