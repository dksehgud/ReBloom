#!/bin/bash

set -e

echo "========================================="
echo " Re:Bloom Voice Pipeline 준비"
echo "========================================="

echo "[1/4] 오디오 유틸리티 설치..."
sudo apt-get update
sudo apt-get install -y alsa-utils espeak-ng ffmpeg mpg123 python3-pip

echo "[2/4] Edge TTS 설치..."
if python3 -c "import edge_tts" >/dev/null 2>&1; then
    echo "  edge-tts 이미 설치됨"
elif [ -n "${VIRTUAL_ENV:-}" ]; then
    echo "  virtualenv 감지됨: $VIRTUAL_ENV"
    python3 -m pip install edge-tts
else
    python3 -m pip install --user edge-tts || \
        python3 -m pip install --user --break-system-packages edge-tts
fi

echo "[3/4] 모델 디렉터리 생성..."
mkdir -p "$HOME/rebloom/models/stt"
mkdir -p "$HOME/rebloom/models/tts"

echo "[4/4] 설치 확인..."
command -v arecord
command -v aplay
command -v espeak-ng
command -v ffplay
command -v mpg123
python3 -c "import edge_tts"

echo ""
echo "기본 오디오 도구 준비 완료"
echo ""
echo "다음으로 whisper.cpp CLI와 STT 모델을 준비하세요."
echo "예시:"
echo "  export REBLOOM_WHISPER_BIN=/path/to/whisper-cli"
echo "  export REBLOOM_WHISPER_MODEL=$HOME/rebloom/models/stt/ggml-base.bin"
echo ""
echo "텍스트 경로 테스트:"
echo "  python3 voice_chat.py --text '안녕, 오늘 기분 어때?' --tts none"
echo ""
echo "TTS만 테스트:"
echo "  python3 voice_chat.py --tts edge --tts-text '안녕하세요. 리블룸 음성 출력 테스트입니다.'"
echo ""
echo "음성 입력 테스트:"
echo "  python3 voice_chat.py --record-seconds 5"
