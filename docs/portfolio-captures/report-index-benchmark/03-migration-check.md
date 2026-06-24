# Migration Check: report-service V1~V9 적용 검증

## 목적

성능 개선용 인덱스 migration이 기존 `report-service` Flyway SQL들과 충돌 없이 적용되는지 확인했다.

## 실행 환경

- Docker container: `rebloom-report-index-bench`
- PostgreSQL image: `postgres:16-alpine`
- Check database: `rebloom_migration_check`

## 실행 순서

`BE/services/report-service/src/main/resources/db/migration` 아래 SQL을 이름순으로 적용했다.

```text
V1__init_report_schema.sql
V2__add_counselor_comment_flag.sql
V3__drop_conversation_analysis_emotion_icon.sql
V4__add_status_card.sql
V5__change_analysis_prediction_to_double.sql
V6__change_analysis_prediction_to_double.sql
V7__normalize_analysis_prediction_scores.sql
V8__create_shedlock_table.sql
V9__add_report_query_indexes.sql
```

## 결과

모든 migration이 성공적으로 적용되었고, V9에서 아래 인덱스 5개가 생성됐다.

```text
children_reports      | idx_children_reports_children_report_date
conversation_analysis | idx_conversation_analysis_user_started_at
counselor_comments    | idx_counselor_comments_parent_report_id
diary_analysis        | idx_diary_analysis_user_target_date
recent_trend          | idx_recent_trend_user_report_date
```

## 결론

조회 성능 개선 인덱스 migration은 기존 `report-service` 스키마에 정상 적용된다.
