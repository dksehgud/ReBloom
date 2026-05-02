CREATE TABLE analysis_keywords (
    keyword_id INTEGER PRIMARY KEY,
    keyword VARCHAR NOT NULL
);

CREATE TABLE emotion_icons (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL
);

CREATE TABLE emotion_icon (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL
);

CREATE TABLE recent_trend (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    report_date DATE NOT NULL,
    summary VARCHAR NOT NULL,
    PRIMARY KEY (id, user_id)
);

CREATE TABLE children_reports (
    id UUID PRIMARY KEY,
    children_id UUID NOT NULL,
    parent_id UUID NOT NULL,
    emotion_tag VARCHAR NOT NULL,
    context VARCHAR NOT NULL,
    report_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP NOT NULL
);

CREATE TABLE conversation_analysis (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NOT NULL,
    sentiment_label VARCHAR NOT NULL,
    summary VARCHAR NOT NULL,
    depression_score FLOAT NOT NULL,
    PRIMARY KEY (id, user_id)
);

CREATE TABLE diary_analysis (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    target_date DATE NOT NULL,
    sentiment_label VARCHAR NOT NULL,
    summary VARCHAR NOT NULL,
    depression_score FLOAT NOT NULL,
    PRIMARY KEY (id, user_id)
);

CREATE TABLE conversation_keywords (
    keyword_id INTEGER NOT NULL,
    analysis_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (keyword_id, analysis_id, user_id),
    CONSTRAINT fk_conversation_keywords_keyword
        FOREIGN KEY (keyword_id) REFERENCES analysis_keywords(keyword_id),
    CONSTRAINT fk_conversation_keywords_analysis
        FOREIGN KEY (analysis_id, user_id)
        REFERENCES conversation_analysis(id, user_id)
);

CREATE TABLE diary_keywords (
    keyword_id INTEGER NOT NULL,
    analysis_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (keyword_id, analysis_id, user_id),
    CONSTRAINT fk_diary_keywords_keyword
        FOREIGN KEY (keyword_id) REFERENCES analysis_keywords(keyword_id),
    CONSTRAINT fk_diary_keywords_analysis
        FOREIGN KEY (analysis_id, user_id)
        REFERENCES diary_analysis(id, user_id)
);

CREATE TABLE diaries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    diary_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP NOT NULL,
    emotion_icon_id INTEGER NOT NULL,
    CONSTRAINT fk_diaries_emotion_icon
        FOREIGN KEY (emotion_icon_id) REFERENCES emotion_icon(id)
);

CREATE TABLE diary_emotions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    diary_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP NOT NULL,
    emotion_icon_id INTEGER NOT NULL,
    CONSTRAINT fk_diary_emotions_emotion_icon
        FOREIGN KEY (emotion_icon_id) REFERENCES emotion_icon(id)
);

CREATE TABLE counselor_comments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    context TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP NOT NULL,
    parent_report_id UUID NOT NULL,
    CONSTRAINT fk_counselor_comments_children_reports
        FOREIGN KEY (parent_report_id) REFERENCES children_reports(id)
);
