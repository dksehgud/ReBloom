CREATE INDEX IF NOT EXISTS idx_children_reports_children_report_date
    ON children_reports (children_id, report_date);

CREATE INDEX IF NOT EXISTS idx_diary_analysis_user_target_date
    ON diary_analysis (user_id, target_date);

CREATE INDEX IF NOT EXISTS idx_conversation_analysis_user_started_at
    ON conversation_analysis (user_id, started_at);

CREATE INDEX IF NOT EXISTS idx_recent_trend_user_report_date
    ON recent_trend (user_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_counselor_comments_parent_report_id
    ON counselor_comments (parent_report_id);
