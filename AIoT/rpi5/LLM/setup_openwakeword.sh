#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON_BIN="${REBLOOM_PYTHON:-$PROJECT_DIR/venv/bin/python}"

if [ ! -x "$PYTHON_BIN" ]; then
    echo "Python 실행 파일을 찾을 수 없습니다: $PYTHON_BIN" >&2
    exit 1
fi

"$PYTHON_BIN" -m pip install openwakeword

echo "openWakeWord 설치 완료"
echo "기본 모델 테스트: REBLOOM_WAKE_ENGINE=openwakeword LLM/run_voice_chat.sh"
echo "커스텀 모델 사용: REBLOOM_OPENWAKEWORD_MODELS=/path/to/hi_blooming.tflite"
