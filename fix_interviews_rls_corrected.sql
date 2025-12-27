-- Fix RLS policies with proper type casting

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can select their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can insert their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can update their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can delete their own interviews" ON interviews;

-- Create policies with correct type casting (UUID to TEXT)
CREATE POLICY "Users can select their own interviews"
ON interviews
FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own interviews"
ON interviews
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own interviews"
ON interviews
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own interviews"
ON interviews
FOR DELETE
USING (auth.uid()::text = user_id);
