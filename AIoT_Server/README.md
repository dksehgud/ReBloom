# Re:Bloom LLM Server

청소년 정신건강 AIoT 스마트 스피커 프로젝트의 LLM 스트리밍 서버.

Raspberry Pi 5 기반 스마트 스피커로부터 STT 텍스트를 받아
LLM이 따뜻한 한국어 응답을 생성하고, 문장 단위로 스트리밍해 라즈베리파이의 TTS로 재생할 수 있도록 한다.

---

## 전체 시스템 흐름

```
[Raspberry Pi 5]
    STT(음성 → 텍스트)
        ↓ WebSocket / SSE / REST
[LLM Server (이 서버)]
    LLM 응답 생성 (vLLM 또는 mock)
        ↓ 문장 단위 streaming
[Raspberry Pi 5]
    TTS(텍스트 → 음성 재생)
```

---

## 프로젝트 구조

```
app/
├── main.py                  # FastAPI 앱 진입점
├── core/
│   ├── config.py            # 환경변수 기반 설정 (pydantic-settings)
│   └── prompts.py           # 시스템 프롬프트 및 위기 키워드 감지
├── schemas/
│   └── chat.py              # Pydantic 요청/응답 스키마
├── services/
│   ├── llm_client.py        # vLLM OpenAI-compatible 클라이언트 (+ mock 모드)
│   └── sentence_streamer.py # 토큰 스트림 → 문장 단위 청크 변환
├── routers/
│   ├── health.py            # GET /health
│   └── chat.py              # POST /api/v1/chat, WS /ws, POST /sse
└── utils/
    └── logger.py            # 로깅 초기화
requirements.txt
.env.example
```

---

## 환경 설정

### 1. 의존성 설치

```bash
cd /path/to/AIoT_Server
pip install -r requirements.txt
```

### 2. `.env` 파일 생성

```bash
cp .env.example .env
```

`.env` 주요 설정:

| 키 | 기본값 | 설명 |
|---|---|---|
| `APP_ENV` | `development` | 실행 환경 |
| `SERVER_PORT` | `8001` | 서버 포트 |
| `USE_MOCK_LLM` | `True` | Mock 모드 (vLLM 없이 테스트) |
| `OPENAI_BASE_URL` | `http://localhost:8000/v1` | vLLM 엔드포인트 |
| `OPENAI_API_KEY` | `EMPTY` | vLLM 로컬 서버는 임의값 가능 |
| `LLM_MODEL` | `qwen3-8b-instruct` | 모델 이름 |
| `MAX_NEW_TOKENS` | `150` | 최대 생성 토큰 |
| `TEMPERATURE` | `0.7` | 샘플링 온도 |
| `TOP_P` | `0.9` | Top-p 샘플링 |
| `LLM_TIMEOUT` | `30.0` | API 호출 타임아웃(초) |

---

## 서버 실행

### Mock 모드로 실행 (vLLM 없이 바로 테스트)

```bash
# .env에서 USE_MOCK_LLM=True 설정 후
cd /path/to/AIoT_Server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

또는 환경변수를 직접 지정:

```bash
USE_MOCK_LLM=True uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### vLLM 연동 모드로 실행

```bash
# .env에서 USE_MOCK_LLM=False, OPENAI_BASE_URL 설정 후
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

---

## vLLM 서버 실행 전제

이 LLM 서버는 vLLM의 OpenAI-compatible endpoint를 호출한다.
RTX 5070 12GB 서버에서 아래 명령어로 vLLM을 먼저 실행해야 한다.

```bash
# Qwen3-8B-Instruct AWQ(4bit) 모델 예시
python -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen3-8B-AWQ  \
    --served-model-name qwen3-8b-instruct \
    --host 0.0.0.0 \
    --port 8001 \
    --max-model-len 4096 \
    --gpu-memory-utilization 0.85
```

vLLM이 준비되면 `.env`에서 `USE_MOCK_LLM=False`로 설정하고 LLM 서버를 재시작한다.

### vLLM 모델 ID 오류 해결

`OSError: ... is not a local folder and is not a valid model identifier`가 발생하면
`--model`에 지정한 Hugging Face repo ID가 잘못되었거나 private repo일 가능성이 높다.

예를 들어 아래 ID는 공개 모델로 조회되지 않는다.

```bash
hugging-quants/LGAI-EXAONE-3.5-7.8B-Instruct-AWQ-INT4
```

Qwen AWQ를 사용할 경우 README 예시처럼 실행한다.

```bash
python -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen3-8B-AWQ \
    --served-model-name qwen3-8b-instruct \
    --host 0.0.0.0 \
    --port 8001 \
    --max-model-len 4096 \
    --gpu-memory-utilization 0.85
```

EXAONE AWQ를 사용할 경우 공개 repo ID는 다음 형식이다.

```bash
python -m vllm.entrypoints.openai.api_server \
    --model LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct-AWQ \
    --served-model-name exaone-3.5-7.8b-instruct-awq \
    --host 0.0.0.0 \
    --port 8001 \
    --max-model-len 4096 \
    --gpu-memory-utilization 0.85 \
    --trust-remote-code \
    --revision f2699f35d5b4ba511ab93826c22bd07370296b5c \
    --code-revision f2699f35d5b4ba511ab93826c22bd07370296b5c
```

이때 FastAPI의 `.env`에 있는 `LLM_MODEL` 값은 vLLM의
`--served-model-name`과 반드시 같아야 한다.

`RopeParameters` import 오류가 발생하면 EXAONE repo의 `main` 코드가
현재 설치된 vLLM의 `transformers<5` 제약과 맞지 않는 상태다. 위 명령어처럼
`--revision`과 `--code-revision`을 고정해서 실행한다.

---

## API 명세

### 1. Health Check

```
GET /health
```

응답:
```json
{"status": "ok", "service": "rebloom-llm-server"}
```

---

### 2. 일반 채팅 (non-streaming)

```
POST /api/v1/chat
Content-Type: application/json
```

요청:
```json
{
  "device_id": "rpi-001",
  "session_id": "session-abc",
  "text": "오늘 너무 피곤했어",
  "user_profile": {
    "age_group": "teenager"
  }
}
```

응답:
```json
{"reply": "많이 지쳤구나. 오늘은 어떤 일이 제일 힘들었어?"}
```

---

### 3. WebSocket 스트리밍

```
WS /api/v1/chat/ws
```

클라이언트 → 서버:
```json
{"device_id": "rpi-001", "session_id": "session-abc", "text": "오늘 너무 피곤했어"}
```

서버 → 클라이언트 (스트리밍):
```json
{"type": "sentence", "text": "많이 지쳤구나."}
{"type": "sentence", "text": "오늘은 어떤 일이 제일 힘들었어?"}
{"type": "done"}
```

오류 시:
```json
{"type": "error", "message": "오류 내용"}
```

---

### 4. SSE 스트리밍

```
POST /api/v1/chat/sse
Content-Type: application/json
```

요청 본문은 `/api/v1/chat`과 동일.

응답 (text/event-stream):
```
event: sentence
data: {"text": "많이 지쳤구나."}

event: sentence
data: {"text": "오늘은 어떤 일이 제일 힘들었어?"}

event: done
data: {}
```

---

## curl 테스트 방법

### Health Check

```bash
curl http://localhost:8001/health
```

### 일반 채팅

```bash
curl -X POST http://localhost:8001/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "rpi-001",
    "session_id": "session-abc",
    "text": "오늘 너무 피곤했어"
  }'
```

### SSE 스트리밍

```bash
curl -X POST http://localhost:8001/api/v1/chat/sse \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "device_id": "rpi-001",
    "session_id": "session-abc",
    "text": "오늘 너무 피곤했어"
  }' \
  --no-buffer
```

---

## WebSocket 테스트 방법

Python으로 WebSocket 테스트:

```python
import asyncio
import json
import websockets

async def test():
    uri = "ws://localhost:8001/api/v1/chat/ws"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            "device_id": "rpi-001",
            "session_id": "session-test",
            "text": "오늘 너무 피곤했어"
        }))
        while True:
            msg = await ws.recv()
            data = json.loads(msg)
            print(data)
            if data.get("type") in ("done", "error"):
                break

asyncio.run(test())
```

또는 `websocat` CLI 도구:

```bash
# websocat 설치: cargo install websocat 또는 apt install websocat
echo '{"device_id":"rpi-001","session_id":"s1","text":"오늘 힘들었어"}' \
  | websocat ws://localhost:8001/api/v1/chat/ws
```

---

## Mock 모드 테스트

`.env`에서 `USE_MOCK_LLM=True` 설정 시 vLLM 없이도 즉시 테스트 가능하다.
미리 정의된 5가지 응답이 순환 방식으로 반환된다.

```bash
# 환경변수 직접 지정으로 mock 모드 실행
USE_MOCK_LLM=True uvicorn app.main:app --port 8001 --reload

# 테스트
curl -X POST http://localhost:8001/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"device_id":"rpi-001","session_id":"s1","text":"안녕"}'
```

---

## Raspberry Pi 연동 예시 Payload

라즈베리파이에서 STT 결과를 받아 WebSocket으로 전송하는 예시:

```python
# rpi_client_example.py (라즈베리파이 측 참고 코드)
import asyncio
import json
import websockets

SERVER_URL = "ws://192.168.0.X:8001/api/v1/chat/ws"  # LLM 서버 IP

async def send_to_llm_and_tts(stt_text: str, device_id: str, session_id: str):
    async with websockets.connect(SERVER_URL) as ws:
        payload = {
            "device_id": device_id,
            "session_id": session_id,
            "text": stt_text,
        }
        await ws.send(json.dumps(payload))

        while True:
            msg = await ws.recv()
            data = json.loads(msg)

            if data["type"] == "sentence":
                # 문장 하나를 받을 때마다 TTS로 재생
                sentence = data["text"]
                print(f"[TTS 재생] {sentence}")
                # tts_play(sentence)  # 실제 TTS 함수 호출

            elif data["type"] == "done":
                print("[완료]")
                break

            elif data["type"] == "error":
                print(f"[오류] {data['message']}")
                break
```

---

## 안전 정책

- 자해, 자살, 극단적 표현이 감지되면 일반 대화 대신 **안전 응답 모드**로 전환됨
- 판단하지 않고, 혼자가 아님을 전하며, 신뢰할 수 있는 어른·상담사 연결을 권유함
- 긴급 상황 시 **112, 119, 자살예방상담전화 1393** 안내
- 이 서버는 의학적 진단/치료 서비스가 아님

---

## 개발 환경

- Python 3.11+
- FastAPI 0.116+
- uvicorn[standard]
- pydantic-settings
- httpx

## 라이선스

SSAFY 14기 공동 프로젝트 — 내부 사용 전용
