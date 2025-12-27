-- Clear All Data - Run this in Supabase SQL Editor
-- WARNING: This will DELETE ALL DATA from all tables. There's no undo!

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Clear tables in dependency order (reverse of creation)
DELETE FROM payments;
DELETE FROM subscriptions;
DELETE FROM interviews;
DELETE FROM job_applicants;
DELETE FROM jobs;
DELETE FROM users;

-- Re-enable foreign key checks
SET session_replication_role = default;

-- Verify tables are empty
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
