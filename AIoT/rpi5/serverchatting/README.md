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
AUDIO_DEVICE=auto
STT_RETRY_SECONDS=5
MIC_BUSY_RETRY_SECONDS=10
START_SOUND=on
START_SOUND_PLAYER=auto
START_SOUND_DEVICE=
WHISPER_BIN=/home/ssafy/whisper.cpp/build/bin/whisper-cli
WHISPER_MODEL=/home/ssafy/whisper.cpp/models/ggml-base.bin

TTS_ENGINE=auto
MP3_PLAYER=mpg123
APLAY_BIN=aplay

SESSION_EVENTS_URL=
SESSION_WINDOW_SECONDS=300
SESSION_SEND_TIMEOUT=5
```

## 실행 방법

```bash
source .venv/bin/activate
python -m rpi_client.main
```

## Mock STT/TTS 테스트 방법

`USE_MOCK_STT=true`, `USE_MOCK_TTS=true` 상태로 실행하면 콘솔 입력과 콘솔 출력만으로 테스트할 수 있습니다.

- `사용자>` 프롬프트에 문장을 입력하면 LLM 서버로 전송됩니다.
- 서버에서 `sentence` 메시지를 보내면 `[TTS] 문장` 형태로 출력됩니다.
- `exit`, `quit`, `종료`를 입력하면 앱이 종료됩니다.

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

로컬 STT는 `arecord`로 음성을 녹음하고 `whisper.cpp`로 텍스트를 추출합니다. 로컬 TTS는 `edge`, `piper`, `espeak`, `auto` 모드를 지원합니다.

실제 STT/TTS를 사용하려면 `.env`에서 아래 값을 변경합니다.

```env
USE_MOCK_STT=false
USE_MOCK_TTS=false
```

주요 STT 설정:

```env
LISTEN_MODE=vad
AUDIO_DEVICE=auto
WHISPER_BIN=/home/ssafy/whisper.cpp/build/bin/whisper-cli
WHISPER_MODEL=/home/ssafy/whisper.cpp/models/ggml-base.bin
WHISPER_THREADS=4
STT_RETRY_SECONDS=5
MIC_BUSY_RETRY_SECONDS=10
START_SOUND=on
START_SOUND_PLAYER=auto
START_SOUND_DEVICE=
```

주요 TTS 설정:

```env
TTS_ENGINE=auto
EDGE_VOICE=ko-KR-SunHiNeural
MP3_PLAYER=mpg123
PIPER_MODEL=
APLAY_BIN=aplay
```

`TTS_ENGINE=auto`는 Edge TTS, Piper, espeak-ng 순서로 사용 가능한 엔진을 찾습니다.

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
- whisper.cpp 실행 파일과 모델 파일 경로가 실제로 존재해야 합니다.
- 장시간 실행 서비스로 만들 경우 systemd 서비스에서 `.env` 경로와 작업 디렉터리를 명확히 지정합니다.
