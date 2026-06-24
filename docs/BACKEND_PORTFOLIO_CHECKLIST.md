# Backend Portfolio Checklist

## Main Story

백엔드 직무용 메인 개선 경험은 아래 3개로 정리한다.

1. 조회 성능 병목 재현 및 인덱스 개선
2. EKS 파드 증가 상황의 DB 커넥션풀 고갈 위험 개선
3. 외부 인프라 의존성을 분리한 백엔드 테스트 안정화

Git 저장소 용량 정리는 서비스 성능 개선이 아니므로 메인 경험에서 제외하고, 필요할 때 협업 환경 정리 항목으로만 언급한다.

## Evidence

| Topic | Before | After | Metric |
| --- | --- | --- | --- |
| Report query | Parallel Seq Scan | Bitmap Index Scan | p95 `41.292 ms -> 0.309 ms`, 99.3% faster |
| DB connection pool | 60 attempts, 23 failures | 24 attempts, 0 failures | failure rate `38.3% -> 0%` |
| DB pool config coverage | 0 / 4 DB services | 4 / 4 DB services | 100% coverage |
| Backend tests | context tests failed before completion | `BUILD SUCCESSFUL` | `gradlew test --no-daemon`, 28 tasks |
| Kafka in tests | attempted localhost brokers | listener auto-startup disabled | no running Kafka needed |

## Portfolio Assets

- `docs/BACKEND_INDEX_BENCHMARK.md`
- `docs/BACKEND_CONNECTION_POOL_BENCHMARK.md`
- `docs/IMPROVEMENT_REPORT.md`
- `docs/portfolio-captures/report-index-benchmark/`
- `docs/portfolio-captures/db-connection-pool/`

## Resume Phrasing

Docker PostgreSQL에 36.5만 건의 더미 데이터를 적재해 실제 조회 병목을 재현하고, `EXPLAIN ANALYZE`로 실행계획을 비교했습니다. 기존 `Parallel Seq Scan` 기반 조회는 p95 41.292ms였고, 조회 패턴에 맞춘 복합 인덱스를 추가한 뒤 `Bitmap Index Scan`으로 전환되어 p95가 0.309ms로 약 99.3% 감소했습니다.

EKS 환경에서 파드 수 증가와 rolling update 시 각 파드의 HikariCP 커넥션풀이 누적되어 DB 연결 슬롯을 초과할 수 있다고 판단했습니다. Docker PostgreSQL에서 `max_connections=40` 조건을 만들고 3개 파드가 각각 20개 풀을 갖는 상황을 재현한 결과 60개 연결 시도 중 23개가 실패했습니다. 이후 DB 사용 서비스 4개에 풀 상한을 명시하고 파드당 풀 크기를 8로 산정해 동일 조건의 실패율을 38.3%에서 0%로 낮췄습니다.

백엔드 테스트는 실제 DB, Redis, Firebase, Kafka가 없어도 컨텍스트 검증이 가능해야 한다고 판단했습니다. 테스트 대상이 외부 인프라 연동이 아니라 Bean wiring 검증인 경우 Mock으로 의존성을 분리했고, 커스텀 Kafka listener factory가 `spring.kafka.listener.auto-startup=false`를 따르도록 수정해 로컬 JDK 21 환경에서 전체 `gradlew test`를 통과시켰습니다.

## Suggested Commit Groups

1. `perf(report): add verified report query indexes`
2. `ops(db): bound service HikariCP pools for EKS`
3. `test(backend): isolate context tests from external infrastructure`
4. `docs(portfolio): add backend benchmark reports and captures`
5. `chore(repo): remove generated artifacts from tracking`

