CREATE TYPE notification_type AS ENUM (
    'RISK_ALERT',
    'DIARY_REPORT',
    'PARENT_REPORT_NEW',
    'PARENT_REPORT_REPLY'
);

CREATE TYPE delivery_status AS ENUM (
    'PENDING',
    'SENT',
    'FAILED'
);

CREATE TYPE schedule_day AS ENUM (
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
);

CREATE TABLE notification_settings (
    id BIGINT PRIMARY KEY,
    user_id UUID NOT NULL,
    fcm_token VARCHAR NOT NULL,
    is_enabled BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP NOT NULL
);

CREATE TABLE notification_schedules (
    id BIGINT PRIMARY KEY,
    notification_type notification_type NOT NULL,
    day schedule_day NOT NULL,
    time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP NOT NULL,
    notification_setting_id BIGINT NOT NULL,
    CONSTRAINT fk_notification_schedules_setting
        FOREIGN KEY (notification_setting_id) REFERENCES notification_settings(id)
);

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY,
    user_id UUID NOT NULL,
    notification_type notification_type NOT NULL,
    title VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    delivery_status delivery_status NOT NULL,
    external_reference_id VARCHAR,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP NOT NULL
);
