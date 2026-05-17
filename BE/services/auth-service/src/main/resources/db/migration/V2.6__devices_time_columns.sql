ALTER TABLE auth_schema.devices
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS modified_at TIMESTAMP;

UPDATE auth_schema.devices
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    modified_at = COALESCE(modified_at, CURRENT_TIMESTAMP);

ALTER TABLE auth_schema.devices
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN modified_at SET NOT NULL;
