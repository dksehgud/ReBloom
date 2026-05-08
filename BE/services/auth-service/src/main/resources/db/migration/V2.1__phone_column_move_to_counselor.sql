-- counselors 테이블에 phone 컬럼 추가 (NULL 허용으로 먼저 생성)
ALTER TABLE auth_schema.counselors ADD COLUMN phone VARCHAR;

-- users 테이블에서 phone 데이터를 counselors 테이블로 복사
UPDATE auth_schema.counselors c
SET phone = u.phone
    FROM auth_schema.users u
WHERE c.id = u.id;

-- 만약 phone 데이터가 없는 기존 상담사가 있을 경우를 대비한 기본값 처리
UPDATE auth_schema.counselors SET phone = '010-0000-0000' WHERE phone IS NULL;

-- counselors 테이블의 phone 컬럼에 NOT NULL 제약 조건 추가
ALTER TABLE auth_schema.counselors ALTER COLUMN phone SET NOT NULL;

-- users 테이블에서 더 이상 필요 없는 phone 컬럼 삭제
ALTER TABLE auth_schema.users DROP COLUMN phone;