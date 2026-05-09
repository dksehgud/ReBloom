-- sleeps 테이블 구조 변경 (최종본 코드에 맞춤)
-- 기존 PK(user_id, date) 제거
ALTER TABLE sleeps DROP CONSTRAINT sleeps_pkey;

-- 사용하지 않는 date 컬럼 삭제
ALTER TABLE sleeps DROP COLUMN date;

-- 새로운 컬럼 추가 및 제약 조건 강화
ALTER TABLE sleeps ADD COLUMN is_main_sleep BOOLEAN;
ALTER TABLE sleeps ALTER COLUMN asleep SET NOT NULL;
ALTER TABLE sleeps ALTER COLUMN wakeup SET NOT NULL;

-- 새로운 PK(user_id, wakeup) 설정
ALTER TABLE sleeps ADD PRIMARY KEY (user_id, wakeup);
