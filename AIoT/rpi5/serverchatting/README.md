# Raspberry Pi LLM WebSocket Client

Raspberry Pi 5 기반 AIoT 스마트 스피커에서 LLM 서버와 WebSocket streaming 방식으로 통신하는 Python 클라이언트입니다.

## 기능

- STT 결과 텍스트를 LLM 서버로 전송
- LLM 서버의 문장 단위 streaming 응답 수신
- 수신한 문장을 TTS queue에 넣어 순서대로 출력
- MVP 테스트용 mock STT, mock TTS 제공
- `LLM/voice_chat.py`의 로컬 STT/TTS 런타임 재사용
- 대화 내역을 서버로 주기 전송
- WebSocket 연결 실패 시 재시도
- 평상시 wake word 대기, `hi blooming`/`하이 블루밍` 호출 시 대화 시작
- GET `/api/v1/analyses/conversations` 수신 시 먼저 인사 TTS 후 대화 시작

## 프로젝트 구조

```text
rpi_client/
  main.py
  core/
    config.py
  schemas/
    message.py
  services/
    websocket_client.py
    conversation_manager.py
    session_event_sender.py
    stt_service.py
    tts_service.py
  utils/
    logger.py
requirements.txt
.env.example
README.md
```

## 설치 방법

```bash
cd /home/ssafy/project/S14P31B109/AIoT/rpi5/serverchatting
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

시스템의 기본 Python이 3.11 이상이면 `python3`를 사용해도 됩니다.

MeloTTS를 사용할 때 `fugashi` 설치 중 MeCab 오류가 나면 먼저 시스템 패키지를 설치합니다.

```bash
sudo apt-get update
sudo apt-get install -y mecab libmecab-dev mecab-ipadic-utf8
```

## 환경변수 설정

```bash
cp .env.example .env
```

`.env` 예시:

```env
DEVICE_ID=rpi-001
LLM_SERVER_WS_URL=ws://localhost:8000/api/v1/chat/ws
USE_MOCK_STT=true
USE_MOCK_TTS=true
TTS_SENTENCE_DELAY=0.8
RECONNECT_MAX_RETRIES=3
RECONNECT_INTERVAL_SECONDS=2
LOG_LEVEL=WARNING

LISTEN_MODE=vad
AUDIO_DEVICE=plughw:CARD=Device,DEV=0
STT_RETRY_SECONDS=5
MIC_BUSY_RETRY_SECONDS=10
START_SOUND=on
START_SOUND_FILE=/home/ssafy/project/S14P31B109/AIoT/rpi5/serverchatting/music/feedback.mp3
START_SOUND_PLAYER=pw-play
START_SOUND_DEVICE=
WHISPER_BIN=/home/ssafy/whisper.cpp/build/bin/whisper-cli
WHISPER_MODEL=/home/ssafy/whisper.cpp/models/ggml-base.bin

TTS_ENGINE=auto
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_STABILITY=0.45
ELEVENLABS_SIMILARITY_BOOST=0.80
ELEVENLABS_STYLE=0.25
ELEVENLABS_USE_SPEAKER_BOOST=true
ELEVENLABS_SPEED=0.95
MP3_PLAYER=pw-play
MP3_PLAYER_ARGS=
APLAY_BIN=aplay
HF_TTS_MODEL=myshell-ai/MeloTTS-Korean
HF_TTS_DEVICE=cpu
HF_TTS_TORCH_DTYPE=auto
MELOTTS_LANGUAGE=KR
MELOTTS_SPEAKER=KR
MELOTTS_SPEED=1.0

SESSION_EVENTS_URL=
SESSION_WINDOW_SECONDS=300
SESSION_SEND_TIMEOUT=5

WAKE_WORDS=hi blooming,하이 블루밍
WAKE_WORD_ENGINE=openwakeword
OPENWAKEWORD_MODEL_PATHS=/home/ssafy/project/S14P31B109/AIoT/rpi5/serverchatting/Wake_Model/hi_blooming.onnx
OPENWAKEWORD_THRESHOLD=0.5
OPENWAKEWORD_DEBUG=false
TRIGGER_API_HOST=0.0.0.0
TRIGGER_API_PORT=8085
TRIGGER_API_PATH=/api/v1/analyses/conversations
TRIGGER_GREETING=안녕! 무슨 일이 있니?
```

실행하자마자 MQTT나 wake word 없이 바로 대화만 하려면:

```env
START_CONVERSATION_ON_BOOT=true
WAKE_WORD_ENABLED=false
MQTT_ENABLED=false
```

## 실행 방법

```bash
source .venv/bin/activate
python -m rpi_client.main
```

## Mock STT/TTS 테스트 방법

`USE_MOCK_STT=true`, `USE_MOCK_TTS=true` 상태로 실행하면 콘솔 입력과 콘솔 출력만으로 테스트할 수 있습니다.

- 평상시에는 `사용자>` 프롬프트에 `hi blooming` 또는 `하이 블루밍`을 입력하면 대화 모드로 들어갑니다.
- `hi blooming 오늘 기분이 좋아`처럼 wake word 뒤에 문장을 붙이면 그 문장을 바로 LLM 서버로 전송합니다.
- 대화 모드에서 `사용자>` 프롬프트에 문장을 입력하면 LLM 서버로 전송됩니다.
- 서버에서 `sentence` 메시지를 보내면 `[TTS] 문장` 형태로 출력됩니다.
- 대화 모드에서 `exit`, `quit`, `종료`를 입력하면 대화를 끝내고 대기 상태로 돌아갑니다.
- 대기 상태에서 `exit`, `quit`, `종료`를 입력하면 앱이 종료됩니다.

## 외부 GET 요청으로 대화 시작

앱 실행 시 라즈베리파이 내부에 트리거용 HTTP 서버가 같이 뜹니다.

```bash
curl http://라즈베리파이IP:8085/api/v1/analyses/conversations
```

이 GET 요청을 받으면 스피커가 먼저 `안녕! 무슨 일이 있니?`라고 말한 뒤 기존 대화 로직을 실행합니다. 이미 대화 중이면 `409 busy`를 반환합니다.

## MQTT 메시지로 대화 시작

MQTT는 대화 전체가 아니라 "대화 시작 신호와 첫 TTS 문장"만 받는 용도로 사용합니다. 실제 사용자 발화와 LLM 응답은 기존 WebSocket 대화 로직을 그대로 사용합니다.

MQTT로 대화를 깨울 때는 마이크를 wake-word 대기 루프와 대화 루프가 동시에 사용하지 않도록 아래 설정을 권장합니다.

```env
WAKE_WORD_ENABLED=false
```

```env
MQTT_ENABLED=true
MQTT_HOST=브로커주소
MQTT_PORT=1883
MQTT_USERNAME=0000fe10-0000-1000-8000-00805f9b34fb
MQTT_PASSWORD=0000fe10-0000-1000-8000-00805f9b34fb
MQTT_CLIENT_ID=0000fe10-0000-1000-8000-00805f9b34fb
MQTT_CONVERSATION_START_TOPIC=devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start
```

테스트 publish 예시:

```bash
mosquitto_pub \
  -h MQTT_HOST \
  -p 1883 \
  -u 0000fe10-0000-1000-8000-00805f9b34fb \
  -P 0000fe10-0000-1000-8000-00805f9b34fb \
  -t 'devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start' \
  -q 1 \
  -m '{"type":"conversation_start","device_id":"0000fe10-0000-1000-8000-00805f9b34fb","greeting":"안녕! 무슨 일이 있니?","request_id":"test-001","created_at":"2026-05-08T13:00:00+09:00"}'
```

## LLM 서버 실행 조건

클라이언트 실행 전에 LLM 서버가 아래 WebSocket endpoint를 제공해야 합니다.

```text
ws://localhost:8000/api/v1/chat/ws
```

Raspberry Pi와 서버가 다른 장비라면 `.env`의 `LLM_SERVER_WS_URL`을 서버 IP로 변경합니다.

## WebSocket 메시지 포맷

Raspberry Pi에서 서버로 보내는 요청:

```json
{
  "device_id": "rpi-001",
  "session_id": "session-abc",
  "text": "오늘 너무 피곤했어"
}
```

서버에서 Raspberry Pi로 보내는 문장 chunk:

```json
{
  "type": "sentence",
  "text": "많이 지쳤구나."
}
```

서버에서 Raspberry Pi로 보내는 단일 최종 답변:

```json
{
  "type": "reply",
  "text": "안녕하세요. 오늘은 어떤 하루를 보내고 계셨나요?"
}
```

서버 응답 종료:

```json
{
  "type": "done"
}
```

서버 오류:

```json
{
  "type": "error",
  "message": "오류 내용"
}
```

## 실제 STT/TTS로 교체하는 방법

현재 `LocalSTTService`는 기존 `/home/ssafy/project/S14P31B109/AIoT/rpi5/LLM/voice_chat.py`에서 쓰던 `LLM/etc/voice_runtime.py`를 재사용합니다.

로컬 STT는 `arecord`로 음성을 녹음하고 `whisper.cpp`로 텍스트를 추출합니다. 로컬 TTS는 `edge`, `elevenlabs`, `melotts`, `huggingface`, `piper`, `espeak`, `auto` 모드를 지원합니다.

실제 STT/TTS를 사용하려면 `.env`에서 아래 값을 변경합니다.

```env
USE_MOCK_STT=false
USE_MOCK_TTS=false
```

주요 STT 설정:

```env
LISTEN_MODE=vad
AUDIO_DEVICE=plughw:CARD=Device,DEV=0
START_TIMEOUT=8
WAKE_WORD_START_TIMEOUT=2
WHISPER_BIN=/home/ssafy/whisper.cpp/build/bin/whisper-cli
WHISPER_MODEL=/home/ssafy/whisper.cpp/models/ggml-base.bin
WHISPER_THREADS=4
STT_RETRY_SECONDS=5
MIC_BUSY_RETRY_SECONDS=10
START_SOUND=on
START_SOUND_FILE=/home/ssafy/project/S14P31B109/AIoT/rpi5/serverchatting/music/feedback.mp3
START_SOUND_PLAYER=pw-play
START_SOUND_DEVICE=
```

주요 TTS 설정:

```env
TTS_ENGINE=auto
EDGE_VOICE=ko-KR-SunHiNeural
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
ELEVENLABS_TIMEOUT_SECONDS=30
ELEVENLABS_STABILITY=0.45
ELEVENLABS_SIMILARITY_BOOST=0.80
ELEVENLABS_STYLE=0.25
ELEVENLABS_USE_SPEAKER_BOOST=true
ELEVENLABS_SPEED=0.95
MP3_PLAYER=pw-play
MP3_PLAYER_ARGS=
PIPER_MODEL=
APLAY_BIN=aplay
HF_TTS_MODEL=myshell-ai/MeloTTS-Korean
HF_TTS_DEVICE=cpu
HF_TTS_TORCH_DTYPE=auto
MELOTTS_LANGUAGE=KR
MELOTTS_SPEAKER=KR
MELOTTS_SPEED=1.0
```

`TTS_ENGINE=melotts`는 MeloTTS 공식 Python API인 `melo.api.TTS(language="KR")`로 한국어 음성을 생성합니다.
PyPI `melotts` 패키지는 빌드 파일이 빠져 설치에 실패할 수 있으므로 `requirements.txt`는 공식 GitHub repo에서 설치하도록 지정합니다.
`fugashi` 빌드 중 `Have you installed MeCab?` 오류가 나면 `sudo apt-get install -y mecab libmecab-dev mecab-ipadic-utf8`를 먼저 실행하세요.
`TTS_ENGINE=huggingface`는 Hugging Face `text-to-speech` pipeline으로 `HF_TTS_MODEL`을 실행합니다. MeloTTS Korean은 `HF_TTS_MODEL=myshell-ai/MeloTTS-Korean`으로 사용할 수 있습니다.
`TTS_ENGINE=elevenlabs`를 사용하려면 `ELEVENLABS_API_KEY`에 API 키를 넣고, 필요하면 `ELEVENLABS_VOICE_ID`를 원하는 voice id로 바꾸세요.
`TTS_ENGINE=auto`는 Edge TTS, Piper, espeak-ng 순서로 사용 가능한 엔진을 찾습니다.

## 상시 대기 운영 모드

wake word와 MQTT 둘 다 대기하다가 먼저 들어온 트리거로 대화를 시작하려면:

```env
START_CONVERSATION_ON_BOOT=false
WAKE_WORD_ENABLED=true
MQTT_ENABLED=true
REPROMPT_ON_EMPTY=false
CONVERSATION_EMPTY_TURNS_TO_END=1
```

이 모드에서는 대화 중 사용자의 의미 있는 입력이 한 번 없으면 대화를 종료하고 다시 wake word/MQTT 대기 상태로 돌아갑니다.
`WAKE_WORD_START_TIMEOUT`은 wake word 대기 중 한 번에 음성 시작을 기다리는 시간이고, `START_TIMEOUT`은 실제 대화 중 사용자 입력을 기다리는 시간입니다.
`WAKE_WORD_ENGINE=openwakeword`이면 wake word는 Whisper STT가 아니라 openWakeWord 모델로 감지하고, 감지 후에만 STT를 시작합니다.

## 대화 내역 서버 전송

`SESSION_EVENTS_URL`이 비어 있으면 대화 내역을 보내지 않습니다. URL을 지정하면 사용자 발화와 봇 응답을 모아 일정 주기로 POST합니다.

```env
SESSION_EVENTS_URL=http://example.com/api/session-events
SESSION_WINDOW_SECONDS=300
SESSION_SEND_TIMEOUT=5
```

전송 payload 예시:

```json
{
  "session_id": "session-20260507-105200",
  "raspberrypi_id": "rpi-001",
  "started_at": "2026-05-07T10:52:00+09:00",
  "ended_at": "2026-05-07T10:57:00+09:00",
  "events": [
    {"child": "안녕 만나서 반가워"},
    {"bot": "나도 만나서 반가워."}
  ]
}
```

## Raspberry Pi 실행 주의사항

- Python 3.11 이상 환경에서 실행합니다.
- 서버 URL이 `localhost`이면 Raspberry Pi 내부에서 LLM 서버가 실행 중이어야 합니다.
- 외부 서버를 사용할 경우 방화벽, 포트, 같은 네트워크 여부를 확인합니다.
- 실제 TTS를 붙일 때는 ALSA/PulseAudio 출력 장치 권한을 확인합니다.
- 실제 STT를 붙일 때는 `arecord -l`로 마이크 장치를 확인합니다.
- `AUDIO_DEVICE=auto`가 실패하면 ALSA 기본 입력 장치로 fallback합니다.
- 기본 입력 장치를 강제로 쓰려면 `AUDIO_DEVICE=default`로 지정합니다.
- 특정 마이크를 고정하려면 `plughw:카드번호,장치번호` 형태로 직접 지정합니다.
- 카드 이름으로 마이크를 고정하려면 `AUDIO_DEVICE=plughw:CARD=Device,DEV=0`처럼 지정합니다.
- 블루투스/PipeWire 출력은 `MP3_PLAYER=pw-play`를 사용합니다.
- 특정 PipeWire 출력으로 고정하려면 `wpctl status`와 `wpctl inspect <sink-id>`로 `node.name`을 확인한 뒤 `MP3_PLAYER_ARGS=--target <node.name>`처럼 지정합니다.
- 알림음도 같은 출력으로 고정하려면 `START_SOUND_PLAYER=pw-play`, `START_SOUND_DEVICE=<node.name>`을 사용합니다.
- whisper.cpp 실행 파일과 모델 파일 경로가 실제로 존재해야 합니다.
- 장시간 실행 서비스로 만들 경우 systemd 서비스에서 `.env` 경로와 작업 디렉터리를 명확히 지정합니다.
