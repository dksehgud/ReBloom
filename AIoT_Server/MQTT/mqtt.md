# MQTT Broker 구축 요구서

## 목적

Raspberry Pi IoT 기기의 IP가 자주 변경되므로, 백엔드가 기기에 직접 HTTP 요청을 보내는 구조 대신 MQTT broker를 통해 기기 제어 명령을 전달할 수 있도록 한다.

이 요구서는 MQTT broker 구축 범위만 다룬다. 실제 대화 내용, LLM WebSocket, STT/TTS 로직은 MQTT로 처리하지 않는다.

## 구축 대상

서버 인프라에 MQTT broker를 1개 구축한다.

권장 broker:

- Mosquitto

대안:

- EMQX
- HiveMQ

우선순위는 Mosquitto로 한다.

## 목표 구조

```text
Backend Server
  └─ MQTT broker에 publish

MQTT Broker
  └─ Raspberry Pi 기기가 subscribe

Raspberry Pi
  └─ broker에 outbound 연결 유지
```

Raspberry Pi의 IP는 고정되어 있지 않아도 된다. Raspberry Pi가 MQTT broker 주소로 먼저 연결하는 구조를 사용한다.

## 배포 방식

Docker Compose 기반 배포를 권장한다.

예시:

```yaml
services:
  mosquitto:
    image: eclipse-mosquitto:2
    container_name: mosquitto
    restart: unless-stopped
    ports:
      - "7000:1883"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log
```

## 포트

컨테이너 내부 listener:

```text
1883/tcp
```

호스트 외부 공개 포트:

```text
7000/tcp
```

운영 환경에서 TLS를 적용할 경우:

```text
8883/tcp
```

현재 Docker Compose 기준으로 외부에서는 `7000` 포트로 접속하고, 컨테이너 내부 Mosquitto listener는 `1883`을 사용한다.
외부 네트워크에 공개되는 경우 username/password 인증은 반드시 적용한다.

## Mosquitto 설정

`mosquitto/config/mosquitto.conf` 예시:

```conf
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwordfile
persistence true
persistence_location /mosquitto/data/
log_dest stdout
```

필수 설정:

- `allow_anonymous false`
- `password_file` 설정
- persistence 활성화

## 인증

익명 접속은 허용하지 않는다. 기기의 경우 비밀번호 관리를 생략하고 기기 시리얼 번호를 ID와 비밀번호로 동일하게 사용한다.

최소 계정:

```text
backend-api
0000fe10-0000-1000-8000-00805f9b34fb
```

비밀번호 파일 생성 예시:

```bash
docker run --rm -it \
  -v $(pwd)/mosquitto/config:/mosquitto/config \
  eclipse-mosquitto:2 \
  mosquitto_passwd -c /mosquitto/config/passwordfile backend-api
```

기기 계정 추가 예시 (ID와 PW를 동일하게 시리얼 번호로 사용):

```bash
docker run --rm -it \
  -v $(pwd)/mosquitto/config:/mosquitto/config \
  eclipse-mosquitto:2 \
  mosquitto_passwd -b /mosquitto/config/passwordfile 0000fe10-0000-1000-8000-00805f9b34fb 0000fe10-0000-1000-8000-00805f9b34fb
```

## 토픽 규칙

MQTT는 대화 전체를 전달하는 용도가 아니다.

MQTT는 Raspberry Pi에게 “대화를 시작하라”는 명령과 첫 TTS 문장만 전달한다.

기기별 대화 시작 토픽:

```text
devices/{deviceId}/conversation/start
```

예시:

```text
devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start
```

향후 확장을 위한 상태 토픽:

```text
devices/{deviceId}/status
```

예시:

```text
devices/0000fe10-0000-1000-8000-00805f9b34fb/status
```

## Publish 메시지 포맷

백엔드가 대화 시작 명령을 보낼 때 payload는 JSON 문자열로 publish한다.

```json
{
  "type": "conversation_start",
  "device_id": "0000fe10-0000-1000-8000-00805f9b34fb",
  "greeting": "안녕! 무슨 일이 있니?",
  "request_id": "uuid-or-trace-id",
  "created_at": "2026-05-08T13:00:00+09:00"
}
```

필수 필드:

- `type`
- `device_id`
- `greeting`
- `request_id`
- `created_at`

## QoS 정책

대화 시작 명령:

```text
QoS: 1
Retain: false
```

이유:

- QoS 1은 최소 1회 전달을 보장한다.
- Retain false는 Raspberry Pi가 나중에 재접속했을 때 오래된 대화 시작 명령이 실행되는 것을 방지한다.

## ACL 권장사항

초기 개발 단계에서는 username/password만 적용해도 된다.

운영 환경에서는 ACL 설정을 권장한다.

권장 권한:

```text
backend-api
  publish: devices/+/conversation/start
  subscribe: 필요 시에만 허용

0000fe10-0000-1000-8000-00805f9b34fb
  subscribe: devices/0000fe10-0000-1000-8000-00805f9b34fb/#
  publish: devices/0000fe10-0000-1000-8000-00805f9b34fb/status
```

기기별 계정을 분리하면 특정 기기가 다른 기기의 토픽을 구독하는 문제를 줄일 수 있다.

## 환경변수 전달값

백엔드와 Raspberry Pi에서 사용할 수 있도록 아래 값을 정리해 전달한다.

```env
MQTT_HOST=your-domain-or-ip
MQTT_PORT=7000
MQTT_USERNAME=...
MQTT_PASSWORD=...
MQTT_TOPIC_CONVERSATION_START=devices/{deviceId}/conversation/start
```

Raspberry Pi 예시:

```env
MQTT_HOST=jukang.duckdns.org
MQTT_PORT=7000
MQTT_USERNAME=0000fe10-0000-1000-8000-00805f9b34fb
MQTT_PASSWORD=0000fe10-0000-1000-8000-00805f9b34fb
MQTT_CONVERSATION_START_TOPIC=devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start
```

백엔드 예시:

```env
MQTT_HOST=jukang.duckdns.org
MQTT_PORT=7000
MQTT_USERNAME=backend-api
MQTT_PASSWORD=...
MQTT_CLIENT_ID=rebloom-llm-server
MQTT_KEEPALIVE=60
MQTT_QOS=1
MQTT_RETAIN=False
MQTT_TOPIC_CONVERSATION_START=devices/{device_id}/conversation/start
```

## 사용 가이드

실제 Docker 실행, `mosquitto_pub` / `mosquitto_sub` 테스트, 백엔드 `.env`, FastAPI 호출 예시는 `MQTT/mqtt_use_guide.md`에 정리한다.

## 완료 조건

- MQTT broker가 서버에서 실행 중이다.
- 외부 Raspberry Pi가 broker에 접속할 수 있다.
- 익명 접속이 차단되어 있다.
- username/password 인증이 적용되어 있다.
- `devices/0000fe10-0000-1000-8000-00805f9b34fb/conversation/start` 토픽으로 publish/subscribe 테스트가 성공한다.
- publish 시 QoS 1, retain false 정책을 사용할 수 있다.
- 백엔드용 계정과 Raspberry Pi용 계정 정보가 정리되어 있다.
