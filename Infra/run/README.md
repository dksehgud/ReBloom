# Local Run Scripts

이 폴더의 `.bat` 파일은 어디서 실행해도 프로젝트 루트로 이동한 뒤 실행됩니다.

`_root.bat`은 공통 초기화 파일입니다. 직접 실행하지 말고 번호가 붙은 파일만 실행하세요.

## 처음 실행

전체 백엔드를 한 번에 올립니다.

```bash
99-start-all.bat
```

## 이후 필요한 것만 실행

코드를 수정한 서비스만 다시 빌드하고 Docker로 재실행하면 됩니다.

| 파일                            | 실행 내용                                   |
|-------------------------------|-----------------------------------------|
| `00-start-kafka.bat`          | Kafka broker/topic만 실행                  |
| `01-auth-service.bat`         | auth-service 빌드 + 실행                    |
| `02-gateway-service.bat`      | gateway-service 빌드 + 실행                 |
| `03-intake-service.bat`       | Kafka 실행 + intake-service 빌드 + 실행       |
| `04-biometric-service.bat`    | Kafka 실행 + biometric-service 빌드 + 실행    |
| `05-report-service.bat`       | report-service 빌드 + 실행                  |
| `06-notification-service.bat` | Kafka 실행 + notification-service 빌드 + 실행 |
| `99-start-all.bat`            | 전체 빌드 + 전체 실행                           |

## 자주 쓰는 조합

로그인, 회원가입, OAuth, 상담사 아이 목록:

```bash
01-auth-service.bat
02-gateway-service.bat
```

Kafka 생체/수면 흐름:

```bash
03-intake-service.bat
04-biometric-service.bat
```

알림 흐름:

```bash
00-start-kafka.bat
01-auth-service.bat
06-notification-service.bat
02-gateway-service.bat
```

전체가 꼬였거나 처음 세팅할 때:

```bash
99-start-all.bat
```

## 주의

- Kafka가 필요한 서비스는 `kafka-1`, `kafka-2`, `kafka-3`가 떠 있어야 합니다.
- notification-service는 Kafka, Redis, Postgres, auth-service가 필요합니다.
- gateway-service는 실제 호출 대상 서비스가 떠 있어야 정상 라우팅됩니다.
