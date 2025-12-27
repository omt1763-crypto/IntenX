-- Check RLS policies on interviews table
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'interviews'
ORDER BY tablename, policyname;

-- If no policies exist, create them:

-- Enable RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own interviews
CREATE POLICY "Users can select their own interviews"
ON interviews
FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own interviews
CREATE POLICY "Users can insert their own interviews"
ON interviews
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own interviews
CREATE POLICY "Users can update their own interviews"
ON interviews
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own interviews
CREATE POLICY "Users can delete their own interviews"
ON interviews
FOR DELETE
USING (auth.uid()::text = user_id);

-- Alternative: Allow service role to bypass RLS (for API calls)
-- This allows the API to insert interviews on behalf of users
CREATE POLICY "Service role can do everything"
ON interviews
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
