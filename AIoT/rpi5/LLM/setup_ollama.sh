#!/bin/bash

set -e

MODEL_NAME="${MODEL_NAME:-qwen2.5:1.5b}"
APP_MODEL_NAME="${APP_MODEL_NAME:-rebloom-qwen}"
OLLAMA_HOST="${OLLAMA_HOST:-127.0.0.1:11434}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo " Re:Bloom Local LLM 설치"
echo "========================================="
echo "  base model : $MODEL_NAME"
echo "  app model  : $APP_MODEL_NAME"
echo "  host       : $OLLAMA_HOST"

if ! command -v ollama >/dev/null 2>&1; then
    echo "[1/4] Ollama 설치..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "[1/4] Ollama 이미 설치됨"
fi

echo "[2/4] Ollama 서비스 활성화..."
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl enable ollama
    sudo systemctl start ollama
else
    echo "  systemctl 없음: ollama serve를 별도 터미널에서 실행하세요."
fi

echo "[3/4] Qwen 모델 다운로드..."
ollama pull "$MODEL_NAME"

echo "[4/4] Re:Bloom 모델 생성..."
ollama create "$APP_MODEL_NAME" -f "$SCRIPT_DIR/Modelfile"

echo ""
echo "설치 완료"
echo "  테스트: ollama run $APP_MODEL_NAME"
echo "  Python: python3 chat_client.py"
