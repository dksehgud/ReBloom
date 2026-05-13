-- notification_settings 테이블 변경
ALTER TABLE notification_settings ALTER COLUMN id DROP IDENTITY IF EXISTS;
ALTER TABLE notification_settings RENAME COLUMN modified_at TO modified_at;

-- notification_schedules 테이블 변경
ALTER TABLE notification_schedules ALTER COLUMN id DROP IDENTITY IF EXISTS;
ALTER TABLE notification_schedules ALTER COLUMN time TYPE TIMESTAMP USING (CURRENT_DATE + time);

-- notifications 테이블 변경
ALTER TABLE notifications ALTER COLUMN id DROP IDENTITY IF EXISTS;