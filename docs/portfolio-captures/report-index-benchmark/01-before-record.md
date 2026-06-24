# Before Record: report-service 날짜 범위 조회

## 현재 상태

Docker/PostgreSQL 벤치마크 실행 전, 코드와 스키마 기준으로 확인 가능한 Before 상태를 기록한다.

- Docker 실행 전 상태: BIOS 가상화 비활성화로 Docker Postgres 미실행
- 실제 `EXPLAIN ANALYZE` Before 캡처: 재부팅 후 Docker 실행 가능해지면 수집 예정
- 실제 서비스 개선 마이그레이션: 아직 미적용
- 현재 할 수 있는 기록: 조회 경로, 쿼리 패턴, 인덱스 부재 확인

## 병목 후보 위치

부모/상담사 화면에서 아이별 관찰 기록과 감정 분석 데이터를 날짜 범위로 조회하는 `report-service` 조회 경로가 병목 후보이다.

주요 흐름:

```text
부모/상담사 화면 진입
→ 특정 아이 선택
→ 관찰 기록 날짜 범위 조회
→ 일기 감정 분석 날짜 범위 조회
→ 대화 감정 분석 날짜 범위 조회
→ 최근 트렌드 조회
```

## Before 쿼리 패턴

| Repository | Method | Query condition | Sort |
| --- | --- | --- | --- |
| `ChildrenReportRepository` | `findReportsByDateRange` | `children_id = ? AND report_date BETWEEN ? AND ?` | `report_date ASC` |
| `DiaryAnalysisRepository` | `findByPeriod` | `user_id = ? AND target_date BETWEEN ? AND ?` | `target_date ASC` |
| `ConversationAnalysisRepository` | `findByPeriod` | `user_id = ? AND started_at BETWEEN ? AND ?` | `started_at ASC` |
| `RecentTrendRepository` | `findLatestByUserIdAndReportDateBetween` | `user_id = ? AND report_date BETWEEN ? AND ?` | `report_date DESC LIMIT 1` |
| `CounselorCommentRepository` | `findByParentReportId` | `parent_report_id = ?` | none |

## Before 스키마 관찰

`BE/services/report-service/src/main/resources/db/migration` 기준으로 `CREATE INDEX` 또는 `idx_` 패턴이 검색되지 않았다.

즉, 현재 `report-service` 스키마에는 위 조회 조건을 직접 커버하는 명시적 인덱스가 없다.

## 예상 병목

데이터가 적을 때는 문제가 눈에 띄지 않을 수 있지만, 데이터가 증가하면 아래 문제가 발생할 수 있다.

```text
필요한 데이터: 특정 아이/사용자의 특정 기간 데이터
DB가 검사할 가능성이 있는 데이터: 테이블 전체 또는 넓은 범위의 row
예상 실행계획: Seq Scan
예상 증거: Rows Removed by Filter 증가, Execution Time 증가
```

예시:

```sql
SELECT id,
       children_id,
       parent_id,
       emotion_tag,
       context,
       report_date,
       has_counselor_comment,
       created_at,
       modified_at
FROM children_reports
WHERE children_id = '00000000-0000-4000-8000-000000000123'::uuid
  AND report_date BETWEEN timestamp '2025-06-01 00:00:00'
                      AND timestamp '2025-06-30 23:59:59'
ORDER BY report_date ASC;
```

## Before 캡처 예정 항목

Docker 실행 후 아래 항목만 먼저 캡처한다.

- `Before: no query-pattern index`
- `EXPLAIN (ANALYZE, BUFFERS)` 결과
- `Seq Scan` 여부
- `Rows Removed by Filter`
- `Execution Time`
- `Buffers`
- `Timing summary`의 `before` 행

## 아직 하지 않은 것

- 실제 인덱스 개선 마이그레이션 생성
- After 실행계획 캡처
- 개선율 계산
- 자소서 최종 수치 확정

이 항목들은 Docker PostgreSQL에서 Before가 실제로 느리다는 것을 확인한 뒤 진행한다.
