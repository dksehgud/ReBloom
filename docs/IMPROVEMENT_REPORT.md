# ReBloom Improvement Report

## Summary

이번 개선은 "운영 가능한 MSA와 데이터 증가에 강한 조회 경로 만들기"에 초점을 맞췄다.

- `report-service`의 아이별 날짜 범위 조회 병목을 Docker PostgreSQL 더미데이터로 재현하고 복합 인덱스를 추가했다.
- EKS 파드 증가 시 DB 커넥션풀이 누적되는 병목을 Docker PostgreSQL로 재현하고 HikariCP 풀 상한을 명시했다.
- DB/Kafka/Redis/Firebase 같은 외부 인프라 없이도 백엔드 컨텍스트 테스트가 통과하도록 테스트 설정을 분리했다.
- EKS Deployment 14개에 readiness/liveness probe, resource request/limit, rolling update 설정을 추가했다.
- GitLab CI에 BE/FE 테스트 게이트를 추가해 테스트 없이 배포 이미지가 만들어지는 흐름을 차단했다.
- Git 저장소 용량 정리는 서비스 성능 개선이 아니므로 별도 협업 환경 개선 항목으로 분리한다.

## Before / After Metrics

| Area | Before | After | Improvement |
| --- | ---: | ---: | --- |
| report-service date range query plan | Parallel Seq Scan | Bitmap Index Scan | Index-backed lookup |
| report-service query execution time | 22.412 ms | 0.140 ms | 99.4% faster |
| report-service avg timing | 35.188 ms | 0.137 ms | 99.6% faster |
| report-service p95 timing | 41.292 ms | 0.309 ms | 99.3% faster |
| DB connection attempts under 3 pods | 60 | 24 | 60.0% lower |
| DB connection failures under constrained DB slots | 23 / 60 | 0 / 24 | Failure rate 38.3% -> 0% |
| Max observed active DB connections | 37 | 24 | 35.1% lower |
| DB-backed services with explicit HikariCP pool config | 0 / 4 | 4 / 4 | 100% coverage |
| K8s deployments with readinessProbe | 0 / 14 | 14 / 14 | 100% coverage |
| K8s deployments with livenessProbe | 0 / 14 | 14 / 14 | 100% coverage |
| K8s deployments with resource requests/limits | 0 / 14 | 14 / 14 | 100% coverage |
| K8s deployments with maxUnavailable 0 rolling update | 0 / 14 | 14 / 14 | 100% coverage |
| FE automated tests in CI | build only | `npm run test` before build | FE test gate added |
| BE automated tests in CI | `bootJar -x test` | `backend-tests` stage + `bootJar` without `-x test` | BE test gate added |
| Local BE context tests | failed before completion | `BUILD SUCCESSFUL` | full backend test task passes |
| Kafka broker dependency during tests | listeners attempted `localhost:9092~9094` | listener startup disabled in tests | external Kafka not required for context tests |

## Verification

- FE tests: `12 passed` test files, `61 passed` tests.
- FE build: production build completed successfully.
- DB benchmark: Docker PostgreSQL `postgres:16-alpine`, `365,000` dummy `children_reports` rows, p95 `41.292 ms -> 0.309 ms`.
- DB migration check: report-service `V1`~`V9` SQL applied successfully; 5 query-pattern indexes created.
- DB connection pool benchmark: Docker PostgreSQL `postgres:16-alpine`, `max_connections=40`, 3 pods * pool 20 scenario failed `23 / 60` connections; 3 pods * pool 8 scenario failed `0 / 24`.
- K8s deployment structure check: 14 deployment files checked, 0 missing required operational fields.
- Git whitespace check: `git diff --cached --check` passed.
- BE local test: JDK 21.0.11, `.\gradlew.bat test --no-daemon`, `BUILD SUCCESSFUL`, 28 actionable tasks.
- Kafka listener test isolation: custom `rebloomKafkaListenerContainerFactory` now respects `spring.kafka.listener.auto-startup=false`, so context tests do not require a running Kafka broker.

## Resume Narrative

프로젝트 후반부에 기능 구현보다 운영 안정성과 데이터 증가 시 조회 성능이 병목이 될 수 있다고 판단했다. 부모와 상담사가 아이별 관찰 기록을 날짜 범위로 조회하는 `report-service` 경로는 `children_id + report_date` 조건을 반복 사용하지만, 기존 스키마에는 해당 패턴을 직접 커버하는 인덱스가 없었다.

이를 확인하기 위해 Docker PostgreSQL 환경에서 `children_reports` 더미데이터 365,000건을 적재하고 `EXPLAIN ANALYZE`로 실행계획을 비교했다. 인덱스 적용 전에는 `Parallel Seq Scan`으로 전체 테이블을 스캔하며 p95가 41.292ms였고, 복합 인덱스 적용 후에는 `Bitmap Index Scan`으로 전환되어 p95가 0.309ms로 약 99.3% 감소했다.

또한 EKS 환경에서는 파드 수가 증가하거나 rolling update 중 `maxSurge` 파드가 추가될 때, 각 파드의 HikariCP 커넥션풀이 누적되어 DB 최대 연결 수를 초과할 수 있다고 판단했다. Docker PostgreSQL에서 `max_connections=40` 조건을 만들고, 파드 3개가 각각 20개 풀을 갖는 상황을 재현한 결과 60개 연결 시도 중 23개가 실패했다. 이후 DB 사용 서비스 4개에 HikariCP 풀 상한을 환경변수로 명시하고, 파드당 풀 크기를 8로 산정했을 때 동일 조건에서 실패율이 38.3%에서 0%로 감소했다.

운영 안정성 측면에서는 기존 EKS 배포 파일의 14개 Deployment 모두 readiness/liveness probe와 resource request/limit가 없어 장애 감지, 롤링 배포, 리소스 예측이 어려웠고, CI는 Spring Boot 빌드 시 `-x test`로 테스트를 건너뛰고 있었다.

이를 개선하기 위해 14개 Deployment 전체에 Actuator/FastAPI health check 기반 readiness/liveness probe, resource request/limit, `maxUnavailable: 0` rolling update 전략을 적용했다. 또한 GitLab CI에 BE test stage와 FE test step을 추가해 테스트 통과 전 이미지 빌드와 배포가 진행되지 않도록 바꿨다.

로컬 검증 단계에서는 JDK 21 환경에서 백엔드 전체 테스트를 실행했을 때, 일부 서비스의 `@SpringBootTest`가 실제 DB, Redis, Firebase, Kafka 같은 외부 인프라를 요구해 컨텍스트 로딩이 실패했다. 테스트 목적이 외부 인프라 연동이 아니라 Bean wiring 검증이라는 점을 기준으로 Repository, Firebase, Redis, Transaction 관련 의존성을 테스트 Mock으로 분리했고, 커스텀 Kafka listener factory가 `spring.kafka.listener.auto-startup=false`를 따르도록 수정했다. 그 결과 외부 브로커 없이도 `.\gradlew.bat test --no-daemon` 기준 백엔드 전체 테스트가 `BUILD SUCCESSFUL`로 통과했다.

부가적으로 Android build 산출물과 AI 연구용 CSV가 저장소에 포함되어 clone/CI 비용을 키우는 문제도 발견했다. 이 내용은 서비스 기능 개선보다는 협업 환경 개선 항목으로 분리해 설명하는 것이 적절하다.

## One-Line Version

EKS 기반 MSA 프로젝트에서 14개 Deployment의 배포 안정성을 보강하고 CI 테스트 게이트를 추가해 테스트 없이 이미지가 배포되는 흐름을 차단했다.
또한 `report-service` 날짜 범위 조회 병목을 Docker PostgreSQL 더미데이터 36.5만 건으로 재현하고 복합 인덱스를 추가해 p95 조회 시간을 41.292ms에서 0.309ms로 약 99.3% 줄였다.
EKS 파드 증가 시 DB 커넥션풀이 누적되는 문제를 Docker PostgreSQL로 재현해 60개 연결 시도 중 23개 실패를 확인했고, HikariCP 풀 상한을 명시해 동일 조건의 실패율을 38.3%에서 0%로 낮췄다.
외부 인프라에 의존하던 백엔드 컨텍스트 테스트를 Mock과 Kafka listener 설정으로 분리해 JDK 21 로컬 환경에서 전체 `gradlew test`가 통과하도록 안정화했다.
