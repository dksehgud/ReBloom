-- minutely_health_logs 테이블: PK 순서 변경
-- 기존 PK 제약 조건을 삭제하고 새로운 순서로 재생성합니다.
ALTER TABLE minutely_health_logs DROP CONSTRAINT minutely_health_logs_pkey;
ALTER TABLE minutely_health_logs ADD PRIMARY KEY (user_id, measured_at);

-- daily_rhythm_stats 테이블: 복합 PK 정리 및 UNIQUE 제약 조건 추가
-- (참고: V1.1 스키마에서 id 단일 PK와 복합 PK가 충돌하는 문제를 해결하고, id 단일 PK로 명확히 합니다)
ALTER TABLE daily_rhythm_stats DROP CONSTRAINT daily_rhythm_stats_pkey;
ALTER TABLE daily_rhythm_stats ADD PRIMARY KEY (id);
ALTER TABLE daily_rhythm_stats ADD CONSTRAINT uk_daily_rhythm_stats_user_date UNIQUE (user_id, target_date);

-- status_cards 테이블: user_id 추가, title 타입 변경(BOOLEAN -> VARCHAR), UNIQUE 제약 조건 추가
ALTER TABLE status_cards ADD COLUMN user_id UUID NOT NULL;

-- PostgreSQL에서 BOOLEAN을 VARCHAR로 변경할 때는 USING 절을 활용해 기존 데이터의 명시적 형변환 방식을 지정해주어야 합니다.
ALTER TABLE status_cards ALTER COLUMN title TYPE VARCHAR USING (
    CASE 
        WHEN title = TRUE THEN 'true' 
        ELSE 'false' 
    END
);

ALTER TABLE status_cards ADD CONSTRAINT uk_status_cards_user_date UNIQUE (user_id, target_date);