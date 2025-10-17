-- Check if your user is properly set as admin
-- Run this to see your current admin status

-- 1. Check all users and their admin status
SELECT
    au.id,
    au.email,
    COALESCE(sp.is_admin, false) as is_admin,
    CASE
        WHEN sp.id IS NULL THEN 'Missing in staff_profiles'
        WHEN sp.is_admin = false THEN 'Not an admin'
        ELSE 'Admin ✓'
    END as status
FROM auth.users au
LEFT JOIN staff_profiles sp ON au.id = sp.id
ORDER BY au.created_at DESC;

-- 2. Check if tables exist and have RLS enabled
SELECT
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled ✓' ELSE 'Disabled' END as rls_status
FROM pg_tables
LEFT JOIN pg_class ON tablename = relname
WHERE schemaname = 'public'
AND tablename IN ('blog_posts', 'testimonials', 'faqs', 'team_members', 'case_studies')
ORDER BY tablename;

-- 3. Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('blog_posts', 'testimonials', 'faqs', 'team_members', 'case_studies')
ORDER BY tablename, policyname;
