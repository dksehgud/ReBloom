\set ON_ERROR_STOP on

-- QA smoke-test seed data.
-- Login account:
--   email: qa-child@test.com
--   password: Test1234!
--
-- Data shape:
--   cycle_start: first day of the current month
--   biometrics: 5-minute samples from day 1 14:00 to day 16 00:00
--     mostly normal daily variation with chart-friendly hr_acc_ratio/rmssd weekly medians
--   sleeps: wake-date-based sleep samples from day 2 sleep through day 15 sleep
--     e.g. day 15 sleep means asleep on day 14 and wakeup on day 15
--   anomalies: intentionally left empty; anomaly rows should be created by the detection flow
--   phq_results: intentionally left empty; PHQ rows should be created by the inference flow

\connect rebloom_auth

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    target_schema TEXT;
    child_id UUID := '11111111-1111-1111-1111-111111111111';
    has_user_phone BOOLEAN;
    has_child_location BOOLEAN;
BEGIN
    SELECT table_schema
    INTO target_schema
    FROM information_schema.tables
    WHERE table_name = 'users'
      AND table_schema IN ('auth_schema', 'public')
    ORDER BY CASE table_schema WHEN 'auth_schema' THEN 0 ELSE 1 END
    LIMIT 1;

    IF target_schema IS NULL THEN
        RAISE EXCEPTION 'users table was not found in auth_schema or public';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = target_schema
          AND table_name = 'users'
          AND column_name = 'phone'
    )
    INTO has_user_phone;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = target_schema
          AND table_name = 'childrens'
          AND column_name = 'latitude'
    )
    INTO has_child_location;

    EXECUTE format('DELETE FROM %I.devices WHERE children_id = $1', target_schema)
    USING child_id;

    EXECUTE format('DELETE FROM %I.childrens WHERE id = $1', target_schema)
    USING child_id;

    EXECUTE format('DELETE FROM %I.users WHERE id = $1', target_schema)
    USING child_id;

    IF has_user_phone THEN
        EXECUTE format(
            'INSERT INTO %I.users (id, email, password, name, phone, role, status, created_at, modified_at)
             VALUES ($1, $2, crypt($3, gen_salt(''bf'', 10)), $4, $5, $6::%I.user_role, $7::%I.user_status, now(), now())',
            target_schema,
            target_schema,
            target_schema
        )
        USING child_id, 'qa-child@test.com', 'Test1234!', 'QA Child', '010-0000-0000', 'CHILDREN', 'ACTIVE';
    ELSE
        EXECUTE format(
            'INSERT INTO %I.users (id, email, password, name, role, status, created_at, modified_at)
             VALUES ($1, $2, crypt($3, gen_salt(''bf'', 10)), $4, $5::%I.user_role, $6::%I.user_status, now(), now())',
            target_schema,
            target_schema,
            target_schema
        )
        USING child_id, 'qa-child@test.com', 'Test1234!', 'QA Child', 'CHILDREN', 'ACTIVE';
    END IF;

    IF has_child_location THEN
        EXECUTE format(
            'INSERT INTO %I.childrens (id, birth, gender, address, address_detail, latitude, longitude)
             VALUES ($1, $2, $3::%I.gender, $4, $5, $6, $7)',
            target_schema,
            target_schema
        )
        USING child_id, '2012-05-15', 'FEMALE', 'Seoul', 'QA smoke test address', 37.5665000, 126.9780000;
    ELSE
        EXECUTE format(
            'INSERT INTO %I.childrens (id, birth, gender, address, address_detail)
             VALUES ($1, $2, $3::%I.gender, $4, $5)',
            target_schema,
            target_schema
        )
        USING child_id, '2012-05-15', 'FEMALE', 'Seoul', 'QA smoke test address';
    END IF;

    EXECUTE format(
        'INSERT INTO %I.devices (serial_number, device_type, children_id)
         VALUES ($1, $2, $3)',
        target_schema
    )
    USING 'QA-WATCH-0001', 'WATCH', child_id;
END $$;

\connect rebloom_biometric

DO $$
DECLARE
    target_schema TEXT;
    child_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    SELECT table_schema
    INTO target_schema
    FROM information_schema.tables
    WHERE table_name = 'biometrics'
      AND table_schema IN ('biometric_schema', 'public')
    ORDER BY CASE table_schema WHEN 'biometric_schema' THEN 0 ELSE 1 END
    LIMIT 1;

    IF target_schema IS NULL THEN
        RAISE EXCEPTION 'biometrics table was not found in biometric_schema or public';
    END IF;

    EXECUTE format('DELETE FROM %I.anomalies WHERE user_id = $1', target_schema)
    USING child_id;

    EXECUTE format('DELETE FROM %I.phq_results WHERE user_id = $1', target_schema)
    USING child_id;

    EXECUTE format('DELETE FROM %I.sleeps WHERE user_id = $1', target_schema)
    USING child_id;

    EXECUTE format('DELETE FROM %I.biometrics WHERE user_id = $1', target_schema)
    USING child_id;

    EXECUTE format(
        'INSERT INTO %I.biometrics (
             user_id, ts_start, ts_end, hr, ibi, rmssd, pnn50, lf_hf,
             acc_x_avg, acc_y_avg, acc_z_avg, acc_mag, hr_acc_ratio, missingness_score
         )
         WITH samples AS (
             SELECT
                 ts,
                (ARRAY[58, 64, 38, 50, 62, 72, 68])[extract(isodow from ts)::int] AS hr_acc_ratio_value,
                (ARRAY[44, 50, 28, 39, 47, 58, 54])[extract(isodow from ts)::int] AS rmssd_value
             FROM generate_series(
                 date_trunc(''month'', current_date)::date + interval ''14 hours'',
                 date_trunc(''month'', current_date)::date + interval ''15 days'' - interval ''5 minutes'',
                 interval ''5 minutes''
             ) AS ts
         )
         SELECT
             $1,
             ts,
             ts + interval ''5 minutes'',
             68 + (extract(hour from ts)::int %% 8)
                + CASE WHEN extract(hour from ts)::int BETWEEN 9 AND 20 THEN 6 ELSE 0 END,
             850 - (extract(hour from ts)::int %% 8) * 7
                - CASE WHEN extract(hour from ts)::int BETWEEN 9 AND 20 THEN 35 ELSE 0 END,
             rmssd_value,
             18 + (extract(hour from ts)::int %% 4),
             1.3 + (extract(isodow from ts)::int * 0.08),
             0.01,
             0.02,
             0.98,
             CASE WHEN extract(hour from ts)::int BETWEEN 9 AND 20 THEN 1.15 ELSE 0.38 END,
             hr_acc_ratio_value,
             0.0
         FROM samples',
        target_schema
    )
    USING child_id;

    EXECUTE format(
        'INSERT INTO %I.sleeps (
             user_id, asleep, wakeup, sleep_duration, waso,
             sleep_score, sleep_efficiency, is_main_sleep
         )
         SELECT
             $1,
             d::date - interval ''1 day'' + time ''23:10'',
             d::date + time ''07:00'',
             (ARRAY[450, 500, 390, 430, 460, 490, 470])[extract(isodow from d)::int],
             (ARRAY[36, 24, 52, 34, 28, 22, 30])[extract(isodow from d)::int],
             (ARRAY[68, 82, 55, 72, 78, 86, 80])[extract(isodow from d)::int],
             (ARRAY[82, 88, 70, 80, 84, 90, 86])[extract(isodow from d)::int],
             true
         FROM generate_series(
             date_trunc(''month'', current_date)::date + interval ''1 day'',
             date_trunc(''month'', current_date)::date + interval ''14 days'',
             interval ''1 day''
         ) AS d',
        target_schema
    )
    USING child_id;

END $$;
