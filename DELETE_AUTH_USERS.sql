-- DELETE ALL USERS FROM SUPABASE AUTH
-- WARNING: This will delete all authentication users!
-- You MUST have appropriate permissions to run this

-- Option 1: Delete all auth users (if you have super_admin role)
DELETE FROM auth.users;

-- Verify auth users are deleted
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- Also verify database users are empty
SELECT COUNT(*) as database_users_count FROM public.users;
