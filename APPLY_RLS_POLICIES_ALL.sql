-- Recommended RLS Policies for Protected Tables
-- Apply these policies AFTER enabling RLS on the tables
-- These ensure only authenticated users can access data

-- ============================================
-- ACTIVITY_LOGS - Only allow authenticated read/write
-- ============================================

-- Policy: Allow authenticated users to read their own activity logs
CREATE POLICY "Allow authenticated read" ON public.activity_logs
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert activity logs
CREATE POLICY "Allow authenticated insert" ON public.activity_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update their activity logs
CREATE POLICY "Allow authenticated update" ON public.activity_logs
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete activity logs
CREATE POLICY "Allow authenticated delete" ON public.activity_logs
FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- SUBSCRIPTIONS - Only allow authenticated users
-- ============================================

-- Policy: Allow authenticated users to read subscriptions
CREATE POLICY "Allow authenticated read" ON public.subscriptions
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert subscriptions
CREATE POLICY "Allow authenticated insert" ON public.subscriptions
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update subscriptions
CREATE POLICY "Allow authenticated update" ON public.subscriptions
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete subscriptions
CREATE POLICY "Allow authenticated delete" ON public.subscriptions
FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- PAYMENTS - Only allow authenticated users
-- ============================================

-- Policy: Allow authenticated users to read payments
CREATE POLICY "Allow authenticated read" ON public.payments
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert payments
CREATE POLICY "Allow authenticated insert" ON public.payments
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update payments
CREATE POLICY "Allow authenticated update" ON public.payments
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete payments
CREATE POLICY "Allow authenticated delete" ON public.payments
FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- VERIFY POLICIES
-- ============================================

SELECT tablename, policyname, permissive, qual, with_check
FROM pg_policies
WHERE tablename IN ('activity_logs', 'subscriptions', 'payments')
ORDER BY tablename, policyname;

-- Note: This will show all policies for the three tables
-- Each table should have 4 policies (SELECT, INSERT, UPDATE, DELETE)
