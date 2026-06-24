# 03. Config Change

## Application

DB 사용 서비스의 `application.yaml`에 HikariCP 설정을 명시했다.

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

## Kubernetes

EKS deployment에 풀 설정 환경변수를 추가했다.

```yaml
env:
  - name: DB_POOL_MAX_SIZE
    value: "8"
  - name: DB_POOL_MIN_IDLE
    value: "1"
  - name: DB_POOL_CONNECTION_TIMEOUT_MS
    value: "3000"
  - name: DB_POOL_VALIDATION_TIMEOUT_MS
    value: "1000"
```

## Formula

운영 환경에서는 아래 기준으로 `DB_POOL_MAX_SIZE`를 조정한다.

```text
pool_per_pod <= floor((db_max_connections - reserved_connections - admin_headroom) / max_concurrent_db_pods)
```

이 값은 코드에 고정하지 않고 환경변수로 분리해, RDS 스펙이나 HPA 최대 파드 수가 바뀌어도 재산정할 수 있게 했다.
