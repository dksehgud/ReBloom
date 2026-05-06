-- 1. 신규 ENUM 타입 생성
CREATE TYPE user_status AS ENUM ('ACTIVE', 'WITHDRAW');

-- 2. users 테이블에 status 컬럼 추가
ALTER TABLE users ADD COLUMN status user_status NOT NULL;

-- 3. childrens 테이블에 주소 관련 컬럼 추가
ALTER TABLE childrens ADD COLUMN address VARCHAR NOT NULL;
ALTER TABLE childrens ADD COLUMN address_detail VARCHAR NOT NULL;