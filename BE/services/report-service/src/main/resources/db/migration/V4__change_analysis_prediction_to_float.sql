ALTER TABLE diary_analysis
    ALTER COLUMN prediction TYPE DOUBLE PRECISION
    USING CASE LOWER(prediction)
        WHEN 'minimal' THEN 0.0
        WHEN 'mild' THEN 1.0
        WHEN 'moderate' THEN 2.0
        WHEN 'severe' THEN 3.0
        ELSE prediction::DOUBLE PRECISION
    END;

ALTER TABLE conversation_analysis
    ALTER COLUMN prediction TYPE DOUBLE PRECISION
    USING CASE LOWER(prediction)
        WHEN 'minimal' THEN 0.0
        WHEN 'mild' THEN 1.0
        WHEN 'moderate' THEN 2.0
        WHEN 'severe' THEN 3.0
        ELSE prediction::DOUBLE PRECISION
    END;
