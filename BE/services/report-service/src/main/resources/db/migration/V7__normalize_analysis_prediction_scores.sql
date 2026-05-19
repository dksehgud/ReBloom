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
                WHEN 'minimal' THEN 3.5
                WHEN 'uncertain' THEN 3.5
                WHEN 'mild' THEN 10.5
                WHEN 'moderate' THEN 14.0
                WHEN 'severe' THEN 17.5
                ELSE prediction::DOUBLE PRECISION
            END;
    ELSE
        UPDATE diary_analysis
        SET prediction = CASE prediction
            WHEN 0.0 THEN 3.5
            WHEN 1.0 THEN 10.5
            WHEN 2.0 THEN 14.0
            WHEN 3.0 THEN 17.5
            ELSE prediction
        END
        WHERE prediction IN (0.0, 1.0, 2.0, 3.0);
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
                WHEN 'minimal' THEN 3.5
                WHEN 'uncertain' THEN 3.5
                WHEN 'mild' THEN 10.5
                WHEN 'moderate' THEN 14.0
                WHEN 'severe' THEN 17.5
                ELSE prediction::DOUBLE PRECISION
            END;
    ELSE
        UPDATE conversation_analysis
        SET prediction = CASE prediction
            WHEN 0.0 THEN 3.5
            WHEN 1.0 THEN 10.5
            WHEN 2.0 THEN 14.0
            WHEN 3.0 THEN 17.5
            ELSE prediction
        END
        WHERE prediction IN (0.0, 1.0, 2.0, 3.0);
    END IF;
END $$;
