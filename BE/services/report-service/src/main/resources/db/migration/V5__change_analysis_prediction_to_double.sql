DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'diary_analysis'
          AND column_name = 'prediction'
          AND data_type <> 'double precision'
    ) THEN
        ALTER TABLE diary_analysis
            ALTER COLUMN prediction TYPE DOUBLE PRECISION
            USING CASE LOWER(prediction::TEXT)
                WHEN 'minimal' THEN 0.0
                WHEN 'uncertain' THEN 0.0
                WHEN 'mild' THEN 1.0
                WHEN 'moderate' THEN 2.0
                WHEN 'severe' THEN 3.0
                ELSE prediction::DOUBLE PRECISION
            END;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'conversation_analysis'
          AND column_name = 'prediction'
          AND data_type <> 'double precision'
    ) THEN
        ALTER TABLE conversation_analysis
            ALTER COLUMN prediction TYPE DOUBLE PRECISION
            USING CASE LOWER(prediction::TEXT)
                WHEN 'minimal' THEN 0.0
                WHEN 'uncertain' THEN 0.0
                WHEN 'mild' THEN 1.0
                WHEN 'moderate' THEN 2.0
                WHEN 'severe' THEN 3.0
                ELSE prediction::DOUBLE PRECISION
            END;
    END IF;
END $$;
