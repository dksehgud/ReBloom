# MQTT 사용 가이드

이 문서는 `AIoT_Server`에서 Mosquitto broker로 MQTT publish 하는 방법을 정리한다.
현재 구성은 Kafka 없이 MQTT만 사용한다.

## 포트 기준

- Docker 외부 공개 포트: `7000`
- Mosquitto 컨테이너 내부 포트: `1883`
- 따라서 백엔드나 Raspberry Pi가 서버 밖에서 접속할 때는 `7000`으로 붙는다.
- FastAPI 서버 포트는 별개다. MQTT broker 포트와 혼동하면 안 된다.

## Docker 실행

프로젝트 루트에서 broker를 올린다.

```bash
cd /path/to/AIoT_Server
docker compose -f MQTT/docker-compose.yml up -d
docker ps | grep mosquitto
```

`docker-compose.yml`은 현재 아래처럼 외부 `7000 -> 내부 1883`으로 연결되어 있다.

```yaml
services:
  mosquitto:
    image: eclipse-mosquitto:2
    container_name: mosquitto
    restart: unless-stopped
    ports:
      - "7000:1883"
```

## 백엔드 `.env` 예시

프로젝트 루트의 `.env`에는 아래 값을 넣으면 된다.

```env
MQTT_HOST=jukang.duckdns.org
MQTT_PORT=7000
MQTT_USERNAME=backend-api
MQTT_PASSWORD=your-password
MQTT_CLIENT_ID=rebloom-llm-server
MQTT_KEEPALIVE=60
MQTT_QOS=1
MQTT_RETAIN=False
MQTT_TOPIC_CONVERSATION_START=devices/{device_id}/conversation/start
```

## Raspberry Pi `.env` 예시

```env
MQTT_HOST=jukang.duckdns.org
MQTT_PORT=7000
MQTT_USERNAME=0000fe10-0000-1000-8000-00805f9b34fb
MQTT_PASSWORD=0000fe10-0000-1000-8000-00805f9b34fb
MQTT_CONVERSATION_START_TOPIC=devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start
```

## 기본 테스트

Raspberry Pi 또는 다른 터미널에서 먼저 subscribe 한다.

```bash
mosquitto_sub \
  -h jukang.duckdns.org \
  -p 7000 \
  -u 0000fe10-0000-1000-8000-00805f9b34fb \
  -P 0000fe10-0000-1000-8000-00805f9b34fb \
  -t 'devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start' \
  -q 1
```

다른 터미널에서 publish 테스트를 한다.

```bash
mosquitto_pub \
  -h jukang.duckdns.org \
  -p 7000 \
  -u backend-api \
  -P 'your-password' \
  -t 'devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start' \
  -m '{"type":"conversation_start","device_id":"0000fe10-0000-1000-8000-00805f9b34fb","greeting":"안녕! 무슨 일이 있니?","request_id":"test-request-001","created_at":"2026-05-10T10:00:00+09:00"}' \
  -q 1
```

## 프로젝트 내부 Python 호출 예시

현재 프로젝트에는 `app/services/mqtt_client.py` 에 publish 유틸이 추가되어 있다.

필요 패키지가 아직 없다면 먼저 설치한다.

```bash
cd /path/to/AIoT_Server
pip install -r requirements.txt
```

프로젝트 내부에서 직접 publish 하려면 아래처럼 쓸 수 있다.

```python
from dotenv import load_dotenv

from app.services.mqtt_client import publish_conversation_start

load_dotenv()

topic, request_id, payload = publish_conversation_start(
    device_id="0000fe10-0000-1000-8000-00805f9b34fb",
    greeting="안녕! 무슨 일이 있니?",
)

print(topic)
print(request_id)
print(payload)
```

## FastAPI API 호출 예시

현재 프로젝트에는 `app/routers/mqtt.py` 기준으로 `POST /api/v1/mqtt/conversation/start` 예제 API가 추가되어 있다.

여기서 `AI_SERVICE_PORT`는 FastAPI 서버 포트다.
이 값은 MQTT broker 포트 `7000`과 다른 값일 수 있다.

```bash
AI_SERVICE_PORT=8000

curl -X POST "http://localhost:${AI_SERVICE_PORT}/api/v1/mqtt/conversation/start" \
  -H 'Content-Type: application/json' \
  -d '{
    "device_id": "0000fe10-0000-1000-8000-00805f9b34fb",
    "greeting": "안녕! 오늘 어땠어?"
  }'
```

응답 예시:

```json
{
  "status": "published",
  "topic": "devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start",
  "request_id": "7cf5d65b-7a5f-4a1b-9d86-4b6b4659ef93",
  "payload": {
    "type": "conversation_start",
    "device_id": "0000fe10-0000-1000-8000-00805f9b34fb",
    "greeting": "안녕! 오늘 어땠어?",
    "request_id": "7cf5d65b-7a5f-4a1b-9d86-4b6b4659ef93",
    "created_at": "2026-05-10T11:00:00+09:00"
  }
}
```

## 확인 포인트

- broker 접속 포트는 `7000`이다.
- Mosquitto listener 자체는 컨테이너 안에서 `1883`이다.
- Kafka는 사용하지 않는다.
- 대화 시작 명령은 `devices/{device_id}/conversation/start` 토픽으로 publish 한다.
- QoS는 `1`, retain은 `false`를 사용한다.
