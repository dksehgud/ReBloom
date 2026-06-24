# 02. Benchmark Result

## Environment

- Runtime: Docker Desktop
- PostgreSQL image: `postgres:16-alpine`
- PostgreSQL `max_connections`: `40`
- Estimated normal application slots: `37`
- Workload: concurrent `psql` sessions running `SELECT pg_sleep(6)`

## Result

| Metric | Before | After |
| --- | ---: | ---: |
| Pods | 3 | 3 |
| Pool size per pod | 20 | 8 |
| Attempted DB connections | 60 | 24 |
| Successful DB connections | 37 | 24 |
| Failed DB connections | 23 | 0 |
| Failure rate | 38.3% | 0% |
| Max observed active DB connections | 37 | 24 |

## Interpretation

Before 상태에서는 DB의 일반 애플리케이션 연결 슬롯을 모두 사용해 23개 연결이 실패했다. After 상태에서는 파드당 풀 크기를 8로 제한해 총 연결 시도를 24개로 낮췄고, 동일 DB 조건에서 실패가 발생하지 않았다.
