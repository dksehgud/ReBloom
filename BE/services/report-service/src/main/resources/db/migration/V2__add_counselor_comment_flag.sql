ALTER TABLE children_reports
    ADD COLUMN has_counselor_comment BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE counselor_comments
    ADD CONSTRAINT uk_counselor_comments_parent_report UNIQUE (parent_report_id);
