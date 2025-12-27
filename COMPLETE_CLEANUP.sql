-- COMPLETE Database + Auth Cleanup
-- WARNING: This will DELETE ALL DATA including auth users!

-- Step 1: Disable foreign key checks
SET session_replication_role = replica;

-- Step 2: Clear all database tables
DELETE FROM payments;
DELETE FROM subscriptions;
DELETE FROM interviews;
DELETE FROM job_applicants;
DELETE FROM jobs;
DELETE FROM users;

-- Step 3: Re-enable foreign key checks
SET session_replication_role = default;

-- Step 4: Verify tables are empty
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL
SELECT 'job_applicants', COUNT(*) FROM job_applicants
UNION ALL
SELECT 'interviews', COUNT(*) FROM interviews
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
ORDER BY table_name;

-- Output message
SELECT 'Database cleared! Now delete auth users in Supabase console:
1. Go to Authentication → Users
2. Select all users
3. Delete them manually
OR run the next query if you have access to auth schema' as message;
