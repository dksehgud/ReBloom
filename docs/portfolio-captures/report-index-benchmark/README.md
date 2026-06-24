# Report Index Benchmark Captures

포트폴리오에 넣을 `report-service` 조회 성능 개선 전후 자료를 모아두는 폴더입니다.

## Suggested Files

- `01-before-record.md`: Docker 실행 전 코드/스키마 기준 Before 기록
- `02-benchmark-result.md`: Docker PostgreSQL 실행 후 Before/After 정량 결과
- `03-migration-check.md`: V1~V9 SQL migration 적용 검증
- `01-before-explain.png`: 인덱스 적용 전 `EXPLAIN ANALYZE`
- `02-after-explain.png`: 인덱스 적용 후 `EXPLAIN ANALYZE`
- `03-summary-table.png`: avg/p95 개선율 요약
- `04-migration-diff.png`: 검증 후 생성한 Flyway migration diff

## Raw Outputs

벤치마크 스크립트 실행 결과는 `raw/` 아래에 저장됩니다.

- `raw/report-index-benchmark-output-YYYYMMDD-HHmmss.txt`
- `raw/report-index-benchmark-output-latest.txt`

`raw/` 출력 파일은 로컬 증빙용이라 Git에는 올리지 않도록 `.gitignore`에 등록했습니다.
