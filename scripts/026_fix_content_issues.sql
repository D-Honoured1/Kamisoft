-- Fix 1: Add missing 'content' column to case_studies (for rich text editor)
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS description TEXT;

-- Fix 2: Add 'description' column to case_studies if missing
-- (Already added above)

-- Fix 3: Disable RLS on products table
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Fix 4: Add verification fields to testimonials if missing
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS verified_by_admin_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL;

-- Verify changes
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('case_studies', 'testimonials', 'products')
AND column_name IN ('content', 'description', 'is_verified', 'verified_at', 'verified_by_admin_id')
ORDER BY table_name, column_name;
