# ReBloom Architecture

이 문서는 ReBloom의 시스템 구성과 데이터 구조를 정리한 문서입니다.

## System Flow

```mermaid
sequenceDiagram
    participant Child as Child App
    participant Watch as Galaxy Watch
    participant Speaker as Smart Speaker
    participant AIoT as AIoT Server
    participant MQTT as MQTT Broker
    participant Gateway as Gateway Service
    participant Bio as Biometric Service
    participant Intake as Intake Service
    participant Kafka as Kafka
    participant Report as Report Service
    participant AI as AI/ML Service
    participant Noti as Notification Service
    participant Parent as Parent/Counselor

    Watch->>Child: 생체 데이터 수집
    Child->>Gateway: 감정 일기 / 생체 데이터 전송
    Speaker->>AIoT: 음성 대화 요청
    AIoT->>MQTT: 대화 시작 신호 publish/subscribe
    MQTT-->>Speaker: 대화 시작 트리거 전달
    AIoT->>AI: LLM 응답 요청
    AI-->>AIoT: 대화 응답 반환
    AIoT-->>Speaker: SSE/WebSocket 기반 응답 스트리밍
    Speaker->>Intake: 대화 결과 데이터 전송
    Gateway->>Bio: 생체 데이터 저장 및 분석 요청
    Gateway->>Intake: 일기/대화 데이터 저장
    Bio->>Kafka: 상태 변화 이벤트 발행
    Intake->>Kafka: 분석 대상 이벤트 발행
    Kafka->>Report: 상태 카드/리포트 생성 이벤트 소비
    Report->>AI: 감정/대화 분석 요청
    AI-->>Report: 분석 결과 반환
    Report->>Kafka: 리포트/위험 신호 이벤트 발행
    Kafka->>Noti: 알림 이벤트 소비
    Noti-->>Parent: 보호자/상담사 알림
    Noti-->>Speaker: MQTT 기반 스피커 동작 요청
```

## Service Responsibility

| Service | Responsibility |
| --- | --- |
| `gateway-service` | 외부 요청 진입점, 서비스 라우팅 |
| `auth-service` | 회원, 인증/인가, 보호자-자녀-상담사 관계 관리 |
| `intake-service` | 감정 일기, 대화 데이터 등 입력 데이터 수집 |
| `biometric-service` | 워치 기반 생체 데이터 저장 및 이상 징후 분석 |
| `report-service` | 상태 카드, 감정 분석 결과, 보호자 리포트, 상담사 코멘트 관리 |
| `notification-service` | 위험 신호 알림, FCM/SSE/MQTT 연동 관리 |
| `AIoT_Server` | 스마트 스피커 대화 API, SSE 응답 스트리밍, MQTT publish 유틸리티 |
| `bio-ml-service` | 생체 데이터 기반 분석 모델 서빙 |

## Data Flow 기준

- 워치 생체 데이터는 5분 단위 수집 주기에 따라 `biometric-service`에 전달됩니다.
- 감정 일기와 대화 데이터는 분석 대상 이벤트로 분리되어 리포트 생성 파이프라인에 연결됩니다.
- Kafka 이벤트에는 `correlationId`를 포함해 비동기 처리 구간에서도 로그 추적이 가능하도록 구성했습니다.
- 스케줄러 기반 리포트 생성은 EKS 다중 Pod 환경에서 중복 실행될 수 있어 ShedLock으로 실행 기준을 맞췄습니다.
- Redis는 인증 코드, Refresh Token처럼 만료 시간이 중요한 데이터에 사용하고, MySQL은 회원, 관계, 리포트 같은 기준 데이터에 사용했습니다.

## Database ERD

![ReBloom DB ERD](rebloom-db-erd.png)

ERD는 사용자/관계, 알림, 생체 데이터, 감정 일기, 분석 결과, 보호자 리포트, 상담사 코멘트 중심으로 구성되어 있습니다.
