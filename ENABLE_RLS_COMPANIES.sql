-- Fix for Supabase RLS Issue
-- Issue: public.companies table has RLS policies but RLS is not enabled
-- This enables RLS on the companies table so policies will actually be enforced

-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'companies' AND schemaname = 'public';

-- Note: After enabling RLS, all policies defined below will now be active:
-- - Allow all authenticated deletes
-- - Allow all authenticated inserts
-- - Allow all authenticated reads
-- - Allow all authenticated updates
-- 
-- These policies will now properly restrict/allow operations based on their conditions
