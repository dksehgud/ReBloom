#!/bin/bash
# WakeOnWord 환경 설정 스크립트
# "hi blooming" 커스텀 웨이크워드 모델 학습 환경을 구성합니다.
#
# 사용법:
#   bash setup.sh          # 기본 설치 (venv 자동 생성)
#   bash setup.sh --no-venv  # 시스템 Python에 설치

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$PROJECT_DIR/venv"
USE_VENV=true

# ── 인수 파싱 ─────────────────────────────────────────────────────────────────
for arg in "$@"; do
    case "$arg" in
        --no-venv) USE_VENV=false ;;
    esac
done

# ── Python 탐색 ───────────────────────────────────────────────────────────────
if [ "$USE_VENV" = true ] && [ -x "$VENV_DIR/bin/python" ]; then
    PYTHON_BIN="$VENV_DIR/bin/python"
    PIP_BIN="$VENV_DIR/bin/pip"
    echo "[setup] 기존 venv 사용: $VENV_DIR"
elif [ "$USE_VENV" = true ]; then
    echo "[setup] venv 생성 중: $VENV_DIR"
    python3 -m venv "$VENV_DIR"
    PYTHON_BIN="$VENV_DIR/bin/python"
    PIP_BIN="$VENV_DIR/bin/pip"
else
    PYTHON_BIN="${PYTHON_BIN:-python3}"
    PIP_BIN="$PYTHON_BIN -m pip"
fi

echo "[setup] Python: $PYTHON_BIN"
"$PYTHON_BIN" --version

# ── pip 업그레이드 ────────────────────────────────────────────────────────────
"$PYTHON_BIN" -m pip install --upgrade pip --quiet

# ── 핵심 의존성 설치 ──────────────────────────────────────────────────────────
echo ""
echo "[setup] 핵심 패키지 설치 중..."
"$PYTHON_BIN" -m pip install \
    "openwakeword>=0.6.0" \
    "numpy>=1.21" \
    "scipy>=1.7" \
    "soundfile>=0.12" \
    "librosa>=0.10" \
    "tqdm>=4.64" \
    "onnx>=1.14" \
    "onnxruntime>=1.15" \
    "torch>=2.0" \
    "torchvision" \
    "torchaudio" \
    --quiet

# ── TTS 엔진 설치 ─────────────────────────────────────────────────────────────
echo ""
echo "[setup] TTS 패키지 설치 중..."
"$PYTHON_BIN" -m pip install \
    "gTTS>=2.3" \
    "pydub>=0.25" \
    "requests>=2.28" \
    --quiet

# piper-tts (오프라인 TTS)
echo "[setup] piper-tts 설치 시도..."
"$PYTHON_BIN" -m pip install "piper-tts>=1.2.0" --quiet 2>/dev/null || \
    echo "[setup] piper-tts 설치 실패 (선택 사항) - gTTS만 사용합니다."

# ── 녹음 의존성 ───────────────────────────────────────────────────────────────
echo ""
echo "[setup] 오디오 입출력 패키지 설치 중..."
"$PYTHON_BIN" -m pip install \
    "sounddevice>=0.4" \
    "pyaudio>=0.2.13" \
    --quiet 2>/dev/null || \
    echo "[setup] pyaudio 설치 실패 (portaudio 없음) - sounddevice만 사용합니다."

# ── openWakeWord 기본 모델 다운로드 ───────────────────────────────────────────
echo ""
echo "[setup] openWakeWord 기본 모델 다운로드..."
"$PYTHON_BIN" -c "
import sys
try:
    from openwakeword.utils import download_models
    download_models()
    print('[setup] 기본 모델 다운로드 완료')
except Exception as e:
    print(f'[setup] 기본 모델 다운로드 건너뜀: {e}', file=sys.stderr)
" 2>/dev/null || true

# ── 디렉토리 생성 ─────────────────────────────────────────────────────────────
echo ""
echo "[setup] 작업 디렉토리 생성..."
mkdir -p "$SCRIPT_DIR/data/positive"
mkdir -p "$SCRIPT_DIR/data/negative"
mkdir -p "$SCRIPT_DIR/data/augmented"
mkdir -p "$SCRIPT_DIR/data/recorded"
mkdir -p "$SCRIPT_DIR/models"
mkdir -p "$SCRIPT_DIR/logs"

# ── 완료 ──────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " WakeOnWord 환경 설정 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " 다음 단계:"
echo "   1. 합성 샘플 생성:   $PYTHON_BIN WakeOnWord/generate_samples.py"
echo "   2. (선택) 직접 녹음:  $PYTHON_BIN WakeOnWord/record_samples.py"
echo "   3. 모델 학습:         $PYTHON_BIN WakeOnWord/train.py"
echo "   4. 실시간 테스트:     $PYTHON_BIN WakeOnWord/test_wake_word.py"
echo ""
echo " 기존 시스템 통합:"
echo "   REBLOOM_OPENWAKEWORD_MODELS=WakeOnWord/models/hi_blooming.onnx \\"
echo "     python LLM/wake_openwakeword.py --debug"
echo ""
