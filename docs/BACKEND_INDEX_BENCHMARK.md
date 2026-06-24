# Backend Index Benchmark

## Goal

`report-service`의 날짜 범위 조회가 데이터 증가 시 Full Scan으로 느려질 수 있는지 확인하고, 조회 패턴에 맞춘 복합 인덱스 추가 전후를 비교한다.

## Why

부모/상담사 화면은 아이별 관찰 기록과 감정 분석 데이터를 날짜 범위로 반복 조회한다. 기존 스키마에는 `children_id + report_date`, `user_id + target_date`, `user_id + started_at` 같은 조회 조건을 직접 커버하는 인덱스가 없어 데이터가 누적될수록 `Seq Scan`과 불필요한 row scan이 발생할 수 있다.

## Candidate Improvement

아래 인덱스는 벤치마크로 병목이 확인된 뒤 Flyway migration으로 적용할 후보이다. 아직 실제 서비스 마이그레이션에는 반영하지 않는다.

Candidate SQL:

`BE/scripts/benchmark/report-query-indexes-candidate.sql`

After verification, create the real Flyway migration with:

```powershell
BE\scripts\benchmark\create-report-index-migration-after-verification.ps1
```

후보 인덱스:

- `children_reports(children_id, report_date)`
- `diary_analysis(user_id, target_date)`
- `conversation_analysis(user_id, started_at)`
- `recent_trend(user_id, report_date DESC)`
- `counselor_comments(parent_report_id)`

## Docker Benchmark

Run from repository root:

```powershell
BE\scripts\benchmark\run-report-index-benchmark.ps1
```

The script starts `postgres:16-alpine`, inserts dummy data, runs the same query before and after the index, and saves timestamped results without deleting previous outputs:

`docs/portfolio-captures/report-index-benchmark/raw/report-index-benchmark-output-YYYYMMDD-HHmmss.txt`

It also copies the newest run to:

`docs/portfolio-captures/report-index-benchmark/raw/report-index-benchmark-output-latest.txt`

Dummy dataset:

- `1,000` children
- `365` reports per child
- `365,000` rows in `children_reports`

## Portfolio Captures

Capture these sections from the output file:

1. `Before: no query-pattern index`
   - Expected plan: `Seq Scan`
   - Useful fields: `Rows Removed by Filter`, `Execution Time`, `Buffers`
2. `After: add query-pattern index`
   - Expected plan: `Index Scan`
   - Useful fields: `Index Cond`, `Execution Time`, `Buffers`
3. `Improvement summary`
   - `before_avg_ms`
   - `after_avg_ms`
   - `avg_reduction_pct`
   - `before_p95_ms`
   - `after_p95_ms`
   - `p95_reduction_pct`

## Verified Result

Docker PostgreSQL 벤치마크 결과, 병목이 실제로 재현되었다.

| Metric | Before | After | Improvement |
| --- | ---: | ---: | ---: |
| Execution Time | 22.412 ms | 0.140 ms | 99.4% 감소 |
| Avg timing | 35.188 ms | 0.137 ms | 99.6% 감소 |
| p95 timing | 41.292 ms | 0.309 ms | 99.3% 감소 |
| Execution plan | Parallel Seq Scan | Bitmap Index Scan | 인덱스 기반 조회 |

검증 후 실제 Flyway migration을 생성했다.

`BE/services/report-service/src/main/resources/db/migration/V9__add_report_query_indexes.sql`

V1부터 V9까지 빈 PostgreSQL DB에 순서대로 적용해 migration 충돌이 없고 인덱스 5개가 정상 생성되는 것도 확인했다.

## Resume Sentence

날짜 범위 기반 조회가 반복되는 `report-service`에서 데이터 증가 시 Full Scan으로 응답 시간이 악화될 수 있다고 판단해, 실제 조회 조건에 맞춘 복합 인덱스를 추가했습니다. Docker PostgreSQL 환경에 36.5만 건의 더미 데이터를 적재하고 `EXPLAIN ANALYZE`로 실행계획을 비교한 결과, p95 조회 시간을 41.292ms에서 0.309ms로 약 99.3% 줄였습니다.
