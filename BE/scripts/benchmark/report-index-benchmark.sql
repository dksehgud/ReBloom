\pset pager off
\timing on

\echo 'ReBloom report-service index benchmark'
\echo 'Dataset: 1,000 children x 365 reports = 365,000 children_reports rows'

DROP TABLE IF EXISTS children_reports;

CREATE TABLE children_reports
(
    id                     UUID PRIMARY KEY,
    children_id            UUID      NOT NULL,
    parent_id              UUID      NOT NULL,
    emotion_tag            VARCHAR   NOT NULL,
    context                VARCHAR   NOT NULL,
    report_date            TIMESTAMP NOT NULL,
    has_counselor_comment  BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMP NOT NULL,
    modified_at            TIMESTAMP NOT NULL
);

INSERT INTO children_reports (
    id,
    children_id,
    parent_id,
    emotion_tag,
    context,
    report_date,
    has_counselor_comment,
    created_at,
    modified_at
)
SELECT
    format(
        '10000000-%s-4000-8000-%s',
        lpad((child_no % 10000)::text, 4, '0'),
        lpad(((child_no * 1000) + day_no)::text, 12, '0')
    )::uuid,
    format(
        '00000000-0000-4000-8000-%s',
        lpad(child_no::text, 12, '0')
    )::uuid,
    '20000000-0000-4000-8000-000000000001'::uuid,
    CASE WHEN day_no % 3 = 0 THEN 'POSITIVE'
         WHEN day_no % 3 = 1 THEN 'NEUTRAL'
         ELSE 'NEGATIVE'
    END,
    'dummy report context child=' || child_no || ', day=' || day_no,
    timestamp '2025-01-01 00:00:00' + (day_no || ' days')::interval,
    false,
    timestamp '2025-01-01 00:00:00' + (day_no || ' days')::interval,
    timestamp '2025-01-01 00:00:00' + (day_no || ' days')::interval
FROM generate_series(0, 999) AS child_no
CROSS JOIN generate_series(0, 364) AS day_no;

ANALYZE children_reports;

\echo ''
\echo 'Row count'
SELECT COUNT(*) AS total_rows FROM children_reports;

\echo ''
\echo 'Before: no query-pattern index'
DROP INDEX IF EXISTS idx_children_reports_children_report_date;
ANALYZE children_reports;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id,
       children_id,
       parent_id,
       emotion_tag,
       context,
       report_date,
       has_counselor_comment,
       created_at,
       modified_at
FROM children_reports
WHERE children_id = '00000000-0000-4000-8000-000000000123'::uuid
  AND report_date BETWEEN timestamp '2025-06-01 00:00:00'
                      AND timestamp '2025-06-30 23:59:59'
ORDER BY report_date ASC;

DROP TABLE IF EXISTS benchmark_timings;
CREATE TEMP TABLE benchmark_timings
(
    phase      VARCHAR NOT NULL,
    run_no     INTEGER NOT NULL,
    elapsed_ms NUMERIC NOT NULL,
    row_count  INTEGER NOT NULL
);

DO $$
DECLARE
    i INTEGER;
    started_at TIMESTAMP;
    rows_found INTEGER;
BEGIN
    FOR i IN 1..30 LOOP
        started_at := clock_timestamp();

        SELECT COUNT(*)
        INTO rows_found
        FROM (
            SELECT id,
                   children_id,
                   parent_id,
                   emotion_tag,
                   context,
                   report_date,
                   has_counselor_comment,
                   created_at,
                   modified_at
            FROM children_reports
            WHERE children_id = '00000000-0000-4000-8000-000000000123'::uuid
              AND report_date BETWEEN timestamp '2025-06-01 00:00:00'
                                  AND timestamp '2025-06-30 23:59:59'
            ORDER BY report_date ASC
        ) report_rows;

        INSERT INTO benchmark_timings (phase, run_no, elapsed_ms, row_count)
        VALUES (
            'before',
            i,
            EXTRACT(EPOCH FROM clock_timestamp() - started_at) * 1000,
            rows_found
        );
    END LOOP;
END $$;

\echo ''
\echo 'After: add query-pattern index'
CREATE INDEX idx_children_reports_children_report_date
    ON children_reports (children_id, report_date);
ANALYZE children_reports;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id,
       children_id,
       parent_id,
       emotion_tag,
       context,
       report_date,
       has_counselor_comment,
       created_at,
       modified_at
FROM children_reports
WHERE children_id = '00000000-0000-4000-8000-000000000123'::uuid
  AND report_date BETWEEN timestamp '2025-06-01 00:00:00'
                      AND timestamp '2025-06-30 23:59:59'
ORDER BY report_date ASC;

DO $$
DECLARE
    i INTEGER;
    started_at TIMESTAMP;
    rows_found INTEGER;
BEGIN
    FOR i IN 1..30 LOOP
        started_at := clock_timestamp();

        SELECT COUNT(*)
        INTO rows_found
        FROM (
            SELECT id,
                   children_id,
                   parent_id,
                   emotion_tag,
                   context,
                   report_date,
                   has_counselor_comment,
                   created_at,
                   modified_at
            FROM children_reports
            WHERE children_id = '00000000-0000-4000-8000-000000000123'::uuid
              AND report_date BETWEEN timestamp '2025-06-01 00:00:00'
                                  AND timestamp '2025-06-30 23:59:59'
            ORDER BY report_date ASC
        ) report_rows;

        INSERT INTO benchmark_timings (phase, run_no, elapsed_ms, row_count)
        VALUES (
            'after',
            i,
            EXTRACT(EPOCH FROM clock_timestamp() - started_at) * 1000,
            rows_found
        );
    END LOOP;
END $$;

\echo ''
\echo 'Timing summary'
WITH timing_summary AS (
    SELECT
        phase,
        MIN(row_count) AS row_count,
        ROUND(AVG(elapsed_ms), 3) AS avg_ms,
        ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY elapsed_ms)::numeric, 3) AS p95_ms,
        ROUND(MIN(elapsed_ms), 3) AS min_ms,
        ROUND(MAX(elapsed_ms), 3) AS max_ms
    FROM benchmark_timings
    GROUP BY phase
),
pivoted AS (
    SELECT
        MAX(avg_ms) FILTER (WHERE phase = 'before') AS before_avg_ms,
        MAX(avg_ms) FILTER (WHERE phase = 'after') AS after_avg_ms,
        MAX(p95_ms) FILTER (WHERE phase = 'before') AS before_p95_ms,
        MAX(p95_ms) FILTER (WHERE phase = 'after') AS after_p95_ms
    FROM timing_summary
)
SELECT * FROM timing_summary ORDER BY phase DESC;

\echo ''
\echo 'Improvement summary'
WITH timing_summary AS (
    SELECT
        phase,
        AVG(elapsed_ms) AS avg_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY elapsed_ms) AS p95_ms
    FROM benchmark_timings
    GROUP BY phase
),
pivoted AS (
    SELECT
        MAX(avg_ms) FILTER (WHERE phase = 'before') AS before_avg_ms,
        MAX(avg_ms) FILTER (WHERE phase = 'after') AS after_avg_ms,
        MAX(p95_ms) FILTER (WHERE phase = 'before') AS before_p95_ms,
        MAX(p95_ms) FILTER (WHERE phase = 'after') AS after_p95_ms
    FROM timing_summary
)
SELECT
    ROUND(before_avg_ms::numeric, 3) AS before_avg_ms,
    ROUND(after_avg_ms::numeric, 3) AS after_avg_ms,
    ROUND(((before_avg_ms - after_avg_ms) / before_avg_ms * 100)::numeric, 1) AS avg_reduction_pct,
    ROUND(before_p95_ms::numeric, 3) AS before_p95_ms,
    ROUND(after_p95_ms::numeric, 3) AS after_p95_ms,
    ROUND(((before_p95_ms - after_p95_ms) / before_p95_ms * 100)::numeric, 1) AS p95_reduction_pct
FROM pivoted;
