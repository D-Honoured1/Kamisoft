-- COMPLETE FIX: Give you full unrestricted access to all content
-- This disables RLS completely so you can freely create/edit/delete

-- Disable RLS on ALL content and management tables
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
ALTER TABLE faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE leadership_team DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects DISABLE ROW LEVEL SECURITY;

-- Verify all tables have RLS disabled
SELECT
    tablename,
    CASE WHEN rowsecurity THEN '❌ STILL ENABLED' ELSE '✅ DISABLED' END as rls_status
FROM pg_tables
LEFT JOIN pg_class ON tablename = relname
WHERE schemaname = 'public'
AND tablename IN (
    'blog_posts',
    'testimonials',
    'faqs',
    'team_members',
    'case_studies',
    'products',
    'leadership_team',
    'portfolio_projects'
)
ORDER BY tablename;
