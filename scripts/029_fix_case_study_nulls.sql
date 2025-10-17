-- Fix case_studies table - make service_category nullable
-- And fix other NOT NULL constraints that are blocking creation

ALTER TABLE case_studies ALTER COLUMN service_category DROP NOT NULL;
ALTER TABLE case_studies ALTER COLUMN challenge DROP NOT NULL;
ALTER TABLE case_studies ALTER COLUMN solution DROP NOT NULL;
ALTER TABLE case_studies ALTER COLUMN results DROP NOT NULL;
ALTER TABLE case_studies ALTER COLUMN technologies DROP NOT NULL;

-- Verify changes
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'case_studies'
AND column_name IN ('service_category', 'challenge', 'solution', 'results', 'technologies')
ORDER BY column_name;

SELECT '✅ All NOT NULL constraints removed from case_studies!' as status;
