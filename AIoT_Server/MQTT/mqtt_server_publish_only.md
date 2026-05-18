# MQTT 서버 Publish 전용 정리

이 문서는 현재 프로젝트에서 사용하는 MQTT 역할을 서버 기준으로만 정리한다.
현재 구조에서는 서버는 명령 전달만 담당한다.

## 역할 정리

- Spring 메인서버: `device_id`를 조회한 뒤 Python AI 서버에 HTTP 요청
- 서버: `publish`만 수행
- 라즈베리파이: `subscribe`만 수행

즉 구조는 아래와 같다.

```text
Spring Main Server --HTTP--> Python AI Server --publish--> devices/{device_id}/conversation/start
라즈베리파이 --subscribe--> devices/{device_id}/conversation/start
```

현재는 Kafka를 사용하지 않는다.

## 사용 토픽

서버가 publish 하는 토픽:

```text
devices/{device_id}/conversation/start
```

예시:

```text
devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start
```

## 서버 `.env` 값

```env
MQTT_HOST=localhost
MQTT_PORT=7000
MQTT_USERNAME=backend-api
MQTT_PASSWORD=change-me
MQTT_CLIENT_ID=rebloom-llm-server
MQTT_KEEPALIVE=60
MQTT_QOS=1
MQTT_RETAIN=False
MQTT_TOPIC_CONVERSATION_START=devices/{device_id}/conversation/start
```

## HTTP 요청 body

FastAPI 예제 API `POST /api/v1/mqtt/conversation/start` 에 보내는 body는 아래다.
여기서 `device_id`는 Python 서버가 생성하는 값이 아니라 Spring 메인서버가 조회해서 넘겨주는 값이다.

```json
{
  "device_id": "0000fe10-0000-1000-8000-00805f9b34fb",
  "greeting": "안녕! 무슨 일이 있니?",
  "request_id": "test-request-001"
}
```

설명:

- `device_id`: Spring 메인서버가 조회해서 전달하는 라즈베리파이 ID
- `greeting`: 라즈베리파이에서 첫 번째로 재생할 문장
- `request_id`: 선택값. 없으면 서버가 UUID를 자동 생성

## device_id 전달 방식

권장 흐름은 아래와 같다.

1. Spring 메인서버가 사용자 요청이나 세션 정보로 대상 기기를 조회한다.
2. Spring 메인서버가 Python AI 서버에 HTTP 요청을 보낼 때 `device_id`를 body에 넣는다.
3. Python AI 서버는 받은 `device_id`로 MQTT topic 을 만들어 publish 한다.

예시:

```text
Spring이 찾은 device_id
-> 0000fe10-0000-1000-8000-00805f9b34fb

Python 서버가 만드는 topic
-> devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start
```

## 실제 MQTT payload

위 HTTP 요청을 받으면 서버는 아래 형태의 payload를 MQTT로 publish 한다.

```json
{
  "type": "conversation_start",
  "device_id": "0000fe10-0000-1000-8000-00805f9b34fb",
  "greeting": "안녕! 무슨 일이 있니?",
  "request_id": "test-request-001",
  "created_at": "2026-05-10T14:00:00+09:00"
}
```

즉 구분은 이렇다.

- HTTP 요청 body: 서버 API에 보내는 데이터
- MQTT payload: 서버가 broker로 publish 하는 데이터

## Python 서버에서 바로 publish 하는 예시

현재 프로젝트에는 `app/services/mqtt_client.py` 가 이미 추가되어 있다.

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

## Python 서버에서 직접 작성하는 예시

```python
import json
import os
from datetime import datetime
from uuid import uuid4

from dotenv import load_dotenv
from paho.mqtt.publish import single

load_dotenv()

device_id = "0000fe10-0000-1000-8000-00805f9b34fb"
request_id = str(uuid4())

topic = os.getenv("MQTT_TOPIC_CONVERSATION_START").format(device_id=device_id)

payload = {
    "type": "conversation_start",
    "device_id": device_id,
    "greeting": "안녕! 무슨 일이 있니?",
    "request_id": request_id,
    "created_at": datetime.now().astimezone().isoformat(),
}

single(
    topic=topic,
    payload=json.dumps(payload, ensure_ascii=False),
    hostname=os.getenv("MQTT_HOST"),
    port=int(os.getenv("MQTT_PORT")),
    auth={
        "username": os.getenv("MQTT_USERNAME"),
        "password": os.getenv("MQTT_PASSWORD"),
    },
    client_id=os.getenv("MQTT_CLIENT_ID"),
    keepalive=int(os.getenv("MQTT_KEEPALIVE")),
    qos=int(os.getenv("MQTT_QOS")),
    retain=os.getenv("MQTT_RETAIN", "False").lower() == "true",
)

print("published topic:", topic)
print("published payload:", payload)
```

## FastAPI API 호출 예시

FastAPI 서버 포트는 MQTT broker 포트 `7000`과 별개다.
예를 들어 FastAPI가 `8000`에서 돌고 있다면 아래처럼 호출하면 된다.

```bash
curl -X POST http://localhost:8000/api/v1/mqtt/conversation/start \
  -H 'Content-Type: application/json' \
  -d '{
    "device_id": "0000fe10-0000-1000-8000-00805f9b34fb",
    "greeting": "안녕! 무슨 일이 있니?"
  }'
```

Spring 메인서버도 결국 Python AI 서버에 위와 같은 body를 보내면 된다.
즉 Python 서버 입장에서는 `device_id`가 이미 포함된 HTTP 요청을 받는 구조다.

## 라즈베리파이 subscribe 예시

라즈베리파이는 자기 토픽만 subscribe 하면 된다.

```bash
mosquitto_sub \
  -h your-server-host \
  -p 7000 \
  -u 0000fe10-0000-1000-8000-00805f9b34fb \
  -P 0000fe10-0000-1000-8000-00805f9b34fb \
  -t 'devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start' \
  -q 1
```

## 주의사항

- `MQTT_PORT=7000` 은 Docker 외부 포트 기준이다.
- Mosquitto 컨테이너 내부 listener 는 `1883` 이다.
- Python 서버가 Docker 바깥에서 실행되면 `MQTT_HOST=localhost`, `MQTT_PORT=7000` 을 쓸 수 있다.
- Python 서버도 같은 Docker 네트워크 안에 있다면 보통 `MQTT_HOST=mosquitto`, `MQTT_PORT=1883` 으로 바꿔야 한다.
- QoS 는 `1`, retain 은 `false` 를 사용한다.
