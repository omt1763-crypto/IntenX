-- Fix Supabase RLS Security Issues
-- Enable RLS on 3 critical public tables
-- These tables are exposed via PostgREST but don't have RLS enabled

-- 1. Enable RLS on activity_logs table
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Verify all 3 tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('activity_logs', 'subscriptions', 'payments') 
AND schemaname = 'public'
ORDER BY tablename;

-- Expected result: All three rows should show rowsecurity = true

-- IMPORTANT: After enabling RLS, you MUST add policies to these tables
-- otherwise ALL access will be blocked. See APPLY_RLS_POLICIES.sql for recommended policies.
