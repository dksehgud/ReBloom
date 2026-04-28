#!/bin/bash

set -e

echo "========================================="
echo " Re:Bloom Voice Pipeline 준비"
echo "========================================="

echo "[1/3] 오디오 유틸리티 설치..."
sudo apt-get update
sudo apt-get install -y alsa-utils espeak-ng

echo "[2/3] 모델 디렉터리 생성..."
mkdir -p "$HOME/rebloom/models/stt"
mkdir -p "$HOME/rebloom/models/tts"

echo "[3/3] 설치 확인..."
command -v arecord
command -v aplay
command -v espeak-ng

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
echo "음성 입력 테스트:"
echo "  python3 voice_chat.py --record-seconds 5"
