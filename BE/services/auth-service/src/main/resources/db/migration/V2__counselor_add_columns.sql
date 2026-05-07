ALTER TABLE auth_schema.counselors ADD COLUMN code VARCHAR;
ALTER TABLE auth_schema.counselors ADD COLUMN hospital_address_detail VARCHAR;


UPDATE auth_schema.counselors SET code = '6EK13B59' WHERE code IS NULL;
UPDATE auth_schema.counselors SET hospital_address_detail = '기본 주소 상세' WHERE hospital_address_detail IS NULL;

ALTER TABLE auth_schema.counselors ALTER COLUMN code SET NOT NULL;
ALTER TABLE auth_schema.counselors ALTER COLUMN hospital_address_detail SET NOT NULL;