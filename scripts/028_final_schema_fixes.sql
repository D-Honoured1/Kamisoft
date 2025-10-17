-- Final schema fixes for all missing columns

-- 1. Add display_order to case_studies
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. Add any other missing columns
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS project_duration VARCHAR(100);
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 3. Verify all columns exist
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'case_studies'
AND column_name IN ('display_order', 'description', 'content', 'industry', 'project_duration', 'tags')
ORDER BY column_name;

-- 4. Make sure team_members has correct structure
ALTER TABLE team_members ALTER COLUMN team_type SET DEFAULT 'staff';
ALTER TABLE team_members ALTER COLUMN is_public SET DEFAULT TRUE;
ALTER TABLE team_members ALTER COLUMN employment_status SET DEFAULT 'active';

-- Verify fix
SELECT '✅ Schema fixed!' as status;
