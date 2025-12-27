-- Check if interviews table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'interviews';

-- Show table structure
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'interviews';

-- Count total interviews
SELECT COUNT(*) as total_interviews FROM interviews;

-- Show all interviews with user info
SELECT 
  i.id,
  i.user_id,
  i.title,
  i.status,
  i.duration,
  i.created_at,
  u.email as user_email
FROM interviews i
LEFT JOIN users u ON i.user_id = u.id
ORDER BY i.created_at DESC
LIMIT 20;

-- Count interviews by user
SELECT 
  user_id,
  COUNT(*) as interview_count
FROM interviews
GROUP BY user_id
ORDER BY interview_count DESC;

-- Show current user count
SELECT COUNT(*) as total_users FROM users;

-- Show current users
SELECT id, email, role FROM users LIMIT 10;
