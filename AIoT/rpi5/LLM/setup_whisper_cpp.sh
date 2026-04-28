#!/bin/bash

set -e

WHISPER_DIR="${WHISPER_DIR:-$HOME/whisper.cpp}"
WHISPER_MODEL="${WHISPER_MODEL:-base}"

echo "========================================="
echo " Re:Bloom whisper.cpp 준비"
echo "========================================="
echo "  source dir : $WHISPER_DIR"
echo "  model      : $WHISPER_MODEL"

if ! command -v cmake >/dev/null 2>&1; then
    echo "[1/4] cmake 설치..."
    sudo apt-get update
    sudo apt-get install -y cmake build-essential
else
    echo "[1/4] cmake 확인됨"
fi

if [ ! -d "$WHISPER_DIR" ]; then
    echo "[2/4] whisper.cpp clone..."
    git clone https://github.com/ggml-org/whisper.cpp.git "$WHISPER_DIR"
else
    echo "[2/4] whisper.cpp 디렉터리 확인됨"
fi

cd "$WHISPER_DIR"

echo "[3/4] whisper-cli 빌드..."
cmake -B build
cmake --build build -j --config Release

echo "[4/4] STT 모델 확인/다운로드..."
if [ ! -f "$WHISPER_DIR/models/ggml-$WHISPER_MODEL.bin" ]; then
    sh ./models/download-ggml-model.sh "$WHISPER_MODEL"
fi

echo ""
echo "완료"
echo "아래 값을 shell에 등록하세요:"
echo "  export REBLOOM_WHISPER_BIN=$WHISPER_DIR/build/bin/whisper-cli"
echo "  export REBLOOM_WHISPER_MODEL=$WHISPER_DIR/models/ggml-$WHISPER_MODEL.bin"
echo ""
echo "테스트:"
echo "  cd ~/rebloom/LLM"
echo "  python3 voice_chat.py --record-seconds 5 --tts none"
