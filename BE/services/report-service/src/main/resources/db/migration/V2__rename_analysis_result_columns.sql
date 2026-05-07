ALTER TABLE conversation_analysis
    RENAME COLUMN sentiment_label TO emotion_icon;

ALTER TABLE conversation_analysis
    RENAME COLUMN summary TO embedding_text;

ALTER TABLE conversation_analysis
    RENAME COLUMN depression_score TO prediction;

ALTER TABLE conversation_analysis
    ALTER COLUMN prediction TYPE VARCHAR USING prediction::VARCHAR;

ALTER TABLE diary_analysis
    RENAME COLUMN sentiment_label TO emotion_icon;

ALTER TABLE diary_analysis
    RENAME COLUMN summary TO embedding_text;

ALTER TABLE diary_analysis
    RENAME COLUMN depression_score TO prediction;

ALTER TABLE diary_analysis
    ALTER COLUMN prediction TYPE VARCHAR USING prediction::VARCHAR;
