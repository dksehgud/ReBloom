# Backend Connection Pool Benchmark

## Goal

EKS에서 서비스 파드가 늘어날 때 각 파드의 HikariCP 커넥션풀이 누적되어 PostgreSQL의 최대 연결 수를 초과할 수 있는지 확인하고, 파드당 풀 상한을 명시해 DB 연결 슬롯 고갈 위험을 줄인다.

## Why

기존 DB 사용 서비스는 `spring.datasource.hikari.maximum-pool-size`를 명시하지 않아 Spring Boot/HikariCP 기본값 또는 운영 환경 설정에 의존했다. 이 상태에서는 파드 수가 늘거나 rolling update 중 `maxSurge` 파드가 추가될 때 전체 DB 연결 가능 수를 계산하기 어렵다.

예를 들어 파드 3개가 각각 20개의 커넥션풀을 가지면 애플리케이션은 최대 60개의 DB 연결을 만들 수 있다. DB가 애플리케이션 사용자에게 제공할 수 있는 연결 슬롯이 37개라면 일부 요청은 DB 연결 단계에서 실패한다.

## Improvement

DB를 직접 사용하는 서비스에 HikariCP 설정을 명시했다.

- `auth-service`
- `biometric-service`
- `report-service`
- `notification-service`

적용 설정:

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: ${DB_POOL_MAX_SIZE:8}
      minimum-idle: ${DB_POOL_MIN_IDLE:1}
      connection-timeout: ${DB_POOL_CONNECTION_TIMEOUT_MS:3000}
      validation-timeout: ${DB_POOL_VALIDATION_TIMEOUT_MS:1000}
      idle-timeout: ${DB_POOL_IDLE_TIMEOUT_MS:600000}
      max-lifetime: ${DB_POOL_MAX_LIFETIME_MS:1800000}
```

EKS deployment와 로컬 Docker Compose에도 `DB_POOL_MAX_SIZE=8`, `DB_POOL_MIN_IDLE=1`, `DB_POOL_CONNECTION_TIMEOUT_MS=3000`, `DB_POOL_VALIDATION_TIMEOUT_MS=1000`을 명시했다.

## Docker Benchmark

Run from repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\BE\scripts\benchmark\run-db-connection-pool-benchmark.ps1
```

The script starts `postgres:16-alpine` with `max_connections=40`, creates a non-superuser application role, and opens concurrent PostgreSQL sessions to simulate pods consuming connection pool slots.

Default scenario:

- Before: `3` pods * pool size `20` = `60` attempted DB connections
- After: `3` pods * pool size `8` = `24` attempted DB connections
- PostgreSQL estimated normal application slots: `37`
- Each successful connection holds the DB session for `6` seconds with `pg_sleep`

Raw outputs are saved locally:

`docs/portfolio-captures/db-connection-pool/raw/db-connection-pool-benchmark-output-YYYYMMDD-HHmmss.txt`

The newest run is copied to:

`docs/portfolio-captures/db-connection-pool/raw/db-connection-pool-benchmark-output-latest.txt`

## Verified Result

| Metric | Before | After | Improvement |
| --- | ---: | ---: | ---: |
| Attempted DB connections | 60 | 24 | 60.0% lower |
| Successful DB connections | 37 | 24 | Within DB slots |
| Failed DB connections | 23 | 0 | 100% eliminated |
| Failure rate | 38.3% | 0% | 38.3pp lower |
| Max observed active DB connections | 37 | 24 | 35.1% lower |

## Resume Sentence

EKS 환경에서 파드 수가 증가하면 각 파드의 HikariCP 커넥션풀이 누적되어 DB 최대 연결 수를 초과할 수 있다고 판단했습니다. Docker PostgreSQL에서 `max_connections=40` 조건을 만들고 파드 3개가 각각 20개 풀을 갖는 상황을 재현한 결과 60개 연결 시도 중 23개가 실패했습니다. 이후 서비스별 HikariCP 풀 상한을 환경변수로 명시하고 파드당 풀 크기를 8로 산정해 동일 조건에서 실패율을 38.3%에서 0%로 줄였습니다.
