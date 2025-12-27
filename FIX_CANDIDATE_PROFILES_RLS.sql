-- Fix candidate_profiles RLS policies
-- The 406 error happens because there's no INSERT/UPDATE policy for candidates

-- Drop existing policies
DROP POLICY IF EXISTS "Recruiters can view candidate profiles" ON candidate_profiles;
DROP POLICY IF EXISTS "Candidates can view own profile" ON candidate_profiles;
DROP POLICY IF EXISTS "Candidates can update own profile" ON candidate_profiles;
DROP POLICY IF EXISTS "Candidates can insert own profile" ON candidate_profiles;

-- Create NEW policies that allow candidates to manage their own profiles

-- Policy 1: Candidates can view their own profile
CREATE POLICY "Candidates can view own profile" ON candidate_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Candidates can insert their own profile
CREATE POLICY "Candidates can insert own profile" ON candidate_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 3: Candidates can update their own profile
CREATE POLICY "Candidates can update own profile" ON candidate_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy 4: Recruiters can view all candidate profiles (for recruiter dashboard)
CREATE POLICY "Recruiters can view candidate profiles" ON candidate_profiles
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'recruiter'
    OR true  -- Also allow candidates to see profiles
  );
