CREATE TABLE minutely_health_logs (
    measured_at TIMESTAMP NOT NULL,
    user_id UUID NOT NULL,
    current_hr INT NOT NULL,
    current_hrv FLOAT NOT NULL,
    current_acc_mag FLOAT NOT NULL,
    hr_acc_ratio FLOAT NOT NULL,
    hrv_drop_rate_5m FLOAT,
    lethargy_duration INT NOT NULL,
    acc_variance_5m FLOAT,
    PRIMARY KEY (measured_at, user_id)
);

CREATE TABLE stress_score (
    id BIGINT NOT NULL,
    user_id UUID NOT NULL,
    target_date DATE NOT NULL,
    stress_min FLOAT,
    stress_max FLOAT,
    stress_avg FLOAT,
    PRIMARY KEY (id, user_id)
);

CREATE TABLE daily_rhythm_stats (
    id BIGINT NOT NULL,
    user_id UUID NOT NULL,
    target_date DATE NOT NULL,
    sleep_start_time TIMESTAMP NOT NULL,
    sleep_end_time TIMESTAMP NOT NULL,
    sleep_midpoint TIMESTAMP NOT NULL,
    sleep_timing_variability FLOAT NOT NULL,
    crco_phase FLOAT NOT NULL,
    crpo_phase FLOAT NOT NULL,
    crco_sleep_misalignment FLOAT NOT NULL,
    crpo_sleep_misalignment FLOAT NOT NULL,
    internal_misalignment FLOAT NOT NULL,
    predicted_mood_score FLOAT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id, user_id)
);

CREATE TABLE status_cards (
    status_card_id UUID PRIMARY KEY,
    target_date DATE NOT NULL,
    status_label VARCHAR NOT NULL,
    title BOOLEAN NOT NULL,
    description VARCHAR NOT NULL,
    suggest_description VARCHAR NOT NULL,
    sugget_comment VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP NOT NULL
);
