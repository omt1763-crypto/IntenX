-- Sync Supabase Auth users to users table
-- This finds users in auth.users but missing from public.users table and creates them

INSERT INTO users (id, email, first_name, last_name, role, password_hash, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'first_name', SPLIT_PART(email, '@', 1)) as first_name,
  COALESCE(raw_user_meta_data->>'last_name', 'User') as last_name,
  COALESCE(raw_user_meta_data->>'role', 'candidate') as role,
  'MANAGED_BY_SUPABASE_AUTH' as password_hash,
  created_at,
  CURRENT_TIMESTAMP as updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
  AND email_confirmed_at IS NOT NULL;

-- Check results
SELECT 'Created ' || ROW_COUNT() || ' user records from auth.users' as result;

-- Show all users now
SELECT id, email, first_name, last_name, role, created_at FROM public.users ORDER BY created_at DESC;
