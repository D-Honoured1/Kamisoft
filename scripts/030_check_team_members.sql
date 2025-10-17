-- Check all team members and their visibility settings

SELECT
    full_name,
    position,
    team_type,
    is_public,
    employment_status,
    display_order,
    CASE
        WHEN is_public = true AND employment_status = 'active' THEN '✅ VISIBLE'
        WHEN is_public = false THEN '❌ NOT PUBLIC'
        WHEN employment_status != 'active' THEN '❌ NOT ACTIVE'
        ELSE '❌ HIDDEN'
    END as visibility_status
FROM team_members
ORDER BY display_order;

-- Count
SELECT
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE is_public = true AND employment_status = 'active') as visible_members
FROM team_members;

-- If no members exist
SELECT CASE
    WHEN COUNT(*) = 0 THEN '⚠️ NO TEAM MEMBERS EXIST - Create some in /admin/team'
    ELSE '✅ Team members exist'
END as status
FROM team_members;
