-- Set your user as admin
-- Replace 'your-email@example.com' with your actual admin email

-- Option 1: If you know your email, set yourself as admin
INSERT INTO staff_profiles (id, first_name, last_name, is_admin, role)
SELECT
    id,
    'Admin' as first_name,
    'User' as last_name,
    TRUE as is_admin,
    'administrator' as role
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'  -- CHANGE THIS TO YOUR EMAIL
ON CONFLICT (id)
DO UPDATE SET is_admin = TRUE;

-- Option 2: If you want to set ALL users as admin (use carefully!)
-- Uncomment the lines below if you want this
-- INSERT INTO staff_profiles (id, is_admin)
-- SELECT id, TRUE FROM auth.users
-- ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;

-- Verify the change
SELECT
    au.id,
    au.email,
    sp.is_admin,
    'Admin set successfully ✓' as result
FROM auth.users au
JOIN staff_profiles sp ON au.id = sp.id
WHERE sp.is_admin = TRUE;
