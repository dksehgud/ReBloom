# Benchmark Result: report-service 날짜 범위 조회

## 실행 환경

- Date: 2026-06-24
- Runtime: Docker Desktop + `postgres:16-alpine`
- Dataset: `children_reports` 365,000 rows
- Query target: 특정 아이 1명의 2025-06-01 ~ 2025-06-30 관찰 기록
- Result file: `docs/portfolio-captures/report-index-benchmark/raw/report-index-benchmark-output-20260624-202009.txt`

## Before

인덱스 없이 동일 조회를 실행했다.

```text
Plan: Parallel Seq Scan on children_reports
Rows returned: 30
Rows Removed by Filter: 121657 (loops=3)
Execution Time: 22.412 ms
Timing avg: 35.188 ms
Timing p95: 41.292 ms
```

해석:

- 필요한 데이터는 30건이지만 전체 365,000건 테이블을 병렬 순차 스캔했다.
- `children_id + report_date` 조회 조건을 바로 타는 인덱스가 없어 불필요한 row 필터링이 발생했다.

## After

아래 인덱스를 추가한 뒤 동일 조회를 실행했다.

```sql
CREATE INDEX idx_children_reports_children_report_date
    ON children_reports (children_id, report_date);
```

```text
Plan: Bitmap Index Scan on idx_children_reports_children_report_date
Rows returned: 30
Execution Time: 0.140 ms
Timing avg: 0.137 ms
Timing p95: 0.309 ms
```

해석:

- DB가 `children_id`와 `report_date` 범위 조건을 인덱스로 먼저 좁혔다.
- 전체 테이블 순차 스캔이 사라지고 필요한 날짜 범위만 조회했다.

## Improvement

| Metric | Before | After | Improvement |
| --- | ---: | ---: | ---: |
| Execution Time | 22.412 ms | 0.140 ms | 99.4% 감소 |
| Avg timing | 35.188 ms | 0.137 ms | 99.6% 감소 |
| p95 timing | 41.292 ms | 0.309 ms | 99.3% 감소 |
| Execution plan | Parallel Seq Scan | Bitmap Index Scan | 인덱스 기반 조회 |

## Applied Migration

검증 후 실제 Flyway migration을 생성했다.

```text
BE/services/report-service/src/main/resources/db/migration/V9__add_report_query_indexes.sql
```

적용 인덱스:

- `children_reports(children_id, report_date)`
- `diary_analysis(user_id, target_date)`
- `conversation_analysis(user_id, started_at)`
- `recent_trend(user_id, report_date DESC)`
- `counselor_comments(parent_report_id)`

## Resume Sentence

부모/상담사가 아이별 관찰 기록을 날짜 범위로 조회하는 `report-service` 경로에서 데이터 증가 시 `Parallel Seq Scan`으로 불필요한 row를 스캔하는 병목을 확인했습니다. Docker PostgreSQL에 36.5만 건의 더미 데이터를 적재해 `EXPLAIN ANALYZE`로 검증했고, 조회 조건에 맞춘 복합 인덱스를 추가해 p95 조회 시간을 41.292ms에서 0.309ms로 약 99.3% 줄였습니다.
