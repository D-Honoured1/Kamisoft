-- Temporarily disable RLS on content tables to allow inserts
-- This is a quick fix - you should set proper admin permissions later

-- Disable RLS on all content tables
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
ALTER TABLE faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled ✓' END as rls_status
FROM pg_tables
LEFT JOIN pg_class ON tablename = relname
WHERE schemaname = 'public'
AND tablename IN ('blog_posts', 'testimonials', 'faqs', 'team_members', 'case_studies')
ORDER BY tablename;
