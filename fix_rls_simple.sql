-- Simpler RLS policy - allow authenticated users to see their own interviews

DROP POLICY IF EXISTS "Users can select their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can insert their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can update their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can delete their own interviews" ON interviews;

-- Single unified policy for authenticated users
CREATE POLICY "Authenticated users can manage their own interviews"
ON interviews
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Or if that doesn't work, disable RLS temporarily to test
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;

-- Then run this query to verify the interview is there:
SELECT id, user_id, title, created_at FROM interviews WHERE user_id = '1a149e52-de32-4299-b78f-ef990b3436f2';
