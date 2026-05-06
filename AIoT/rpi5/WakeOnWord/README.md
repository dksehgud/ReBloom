# WakeOnWord — "hi blooming" 커스텀 웨이크워드 학습 가이드

`openWakeWord` 프레임워크를 사용해 **"hi blooming"** 웨이크워드를 인식하는 커스텀 모델을 학습하고 Raspberry Pi 5에서 실행하는 전체 가이드입니다.

---

## 디렉토리 구조

```
WakeOnWord/
├── setup.sh              # 의존성 설치
├── generate_samples.py   # TTS 합성 학습 샘플 생성
├── record_samples.py     # 실제 발화 녹음 도구
├── train.py              # 모델 학습 → models/hi_blooming.onnx
├── test_wake_word.py     # RPi5 실시간 마이크 테스트
│
├── data/
│   ├── positive/         # "hi blooming" 합성 샘플
│   ├── augmented/        # 노이즈/피치 증강 샘플
│   ├── negative/         # 비-웨이크워드 샘플
│   └── recorded/         # 실제 녹음 샘플
│
└── models/
    ├── hi_blooming.onnx  # 학습된 모델 (추론용)
    └── hi_blooming_meta.json
```

---

## 1단계: 환경 설정

> **권장**: 학습(1~3단계)은 **PC/서버**에서, 테스트(4단계)만 **Raspberry Pi 5**에서 실행.

```bash
# 프로젝트 루트에서 실행
cd /path/to/rpi5

bash WakeOnWord/setup.sh
```

GPU가 있으면 자동으로 CUDA를 활용합니다.

---

## 2단계: 학습 샘플 생성

TTS 엔진으로 **"hi blooming"** 합성 오디오 샘플을 대량 생성합니다.

```bash
# 기본 (piper-tts + gTTS, 목표 2000개)
python WakeOnWord/generate_samples.py

# 샘플 수 늘리기 (권장: 3000~5000개)
python WakeOnWord/generate_samples.py --count 3000

# 인터넷 없는 경우 (piper-tts만)
python WakeOnWord/generate_samples.py --tts piper

# 빠른 테스트 (gTTS만, 적은 수)
python WakeOnWord/generate_samples.py --tts gtts --count 200
```

생성 결과:
- `data/positive/` — TTS 합성 샘플
- `data/augmented/` — 노이즈/피치 증강 버전
- `data/negative/` — 비-웨이크워드 노이즈 샘플

### 선택: 직접 녹음 추가 (정확도 향상)

실제 발화 샘플을 추가하면 모델 정확도가 크게 향상됩니다.

```bash
# 마이크 장치 확인
python WakeOnWord/record_samples.py --list-devices

# 30회 녹음 (다양한 억양으로)
python WakeOnWord/record_samples.py --count 30

# 특정 마이크 지정
python WakeOnWord/record_samples.py --count 50 --device 1
```

**녹음 팁:**
- 보통 속도, 빠른 속도, 느린 속도로 변화
- 마이크 가까이(20cm), 보통(50cm), 멀리(1m)에서 녹음
- 조용한 환경, 약간 소음 있는 환경에서 녹음

---

## 3단계: 모델 학습

```bash
# 기본 학습 (50 에폭)
python WakeOnWord/train.py

# 에폭 수 늘리기 (더 긴 학습)
python WakeOnWord/train.py --epochs 100

# 빠른 테스트용 학습
python WakeOnWord/train.py --epochs 10 --batch-size 64

# 학습 완료 후 평가만
python WakeOnWord/train.py --eval-only
```

출력:
- `models/hi_blooming.onnx` — 추론 모델
- `models/hi_blooming_meta.json` — 모델 메타데이터
- `logs/training.log` — 학습 로그

---

## 4단계: Raspberry Pi 5에서 테스트

`models/hi_blooming.onnx`를 RPi5로 복사 후:

```bash
# RPi5에서 의존성 설치
pip install openwakeword onnxruntime numpy soundfile scipy

# 마이크 확인
python WakeOnWord/test_wake_word.py --list-devices

# 실시간 감지 테스트
python WakeOnWord/test_wake_word.py

# 감도 조정 (낮을수록 민감)
python WakeOnWord/test_wake_word.py --threshold 0.4

# 점수 디버그 출력
python WakeOnWord/test_wake_word.py --debug

# WAV 파일로 테스트
python WakeOnWord/test_wake_word.py --test-file my_audio.wav
```

---

## 5단계: 기존 시스템 통합

학습된 모델을 기존 `LLM/wake_openwakeword.py`에 연결합니다.

### 환경 변수로 설정

```bash
# .env 파일 또는 실행 시 지정
export REBLOOM_OPENWAKEWORD_MODELS=/path/to/rpi5/WakeOnWord/models/hi_blooming.onnx
export REBLOOM_WAKE_ENGINE=openwakeword
```

### 직접 실행

```bash
REBLOOM_OPENWAKEWORD_MODELS=WakeOnWord/models/hi_blooming.onnx \
  python LLM/wake_openwakeword.py --debug
```

### run_voice_chat.sh와 통합

```bash
REBLOOM_WAKE_ENGINE=openwakeword \
REBLOOM_OPENWAKEWORD_MODELS=WakeOnWord/models/hi_blooming.onnx \
  bash LLM/run_voice_chat.sh
```

---

## 학습 파라미터 가이드

| 항목 | 권장값 | 설명 |
|------|--------|------|
| positive 샘플 수 | 2,000~5,000개 | 많을수록 좋음 |
| negative 샘플 수 | positive × 2배 | 과학습 방지 |
| 실제 녹음 | 30~100회 | 정확도 대폭 향상 |
| 에폭 | 50~100 | 과학습 주의 |
| 임계값 | 0.5 (기본) | 낮추면 민감, 높이면 보수적 |

---

## 문제 해결

### 오감지(False Positive)가 많을 때
```bash
# 임계값 높이기
python test_wake_word.py --threshold 0.7

# negative 샘플 추가 후 재학습
python generate_samples.py --negative-count 6000
python train.py
```

### 미감지(False Negative)가 많을 때
```bash
# 임계값 낮추기
python test_wake_word.py --threshold 0.35

# positive 샘플 추가 (특히 실제 녹음)
python record_samples.py --count 50
python train.py
```

### piper-tts 설치 실패
```bash
# gTTS만 사용
python generate_samples.py --tts gtts
```

### ffmpeg 없어서 gTTS 실패
```bash
sudo apt install ffmpeg
# 또는
pip install pydub
```

---

## 참고 자료

- [openWakeWord GitHub](https://github.com/dscripka/openWakeWord)
- [openWakeWord 학습 노트북](https://github.com/dscripka/openWakeWord/tree/main/notebooks)
- [piper-tts 음성 모델](https://huggingface.co/rhasspy/piper-voices)
