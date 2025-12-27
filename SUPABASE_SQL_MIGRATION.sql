-- ============================================
-- Supabase SQL Migration for InterviewX
-- ============================================
-- This script creates the required tables for storing interview data
-- Run this in your Supabase SQL Editor

-- 1. Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  company VARCHAR(255),
  client VARCHAR(255),
  duration INTEGER, -- Duration in seconds
  status VARCHAR(50) DEFAULT 'completed', -- 'completed' or 'in-progress'
  skills JSONB, -- Array of {name, reason, importance}
  conversation JSONB, -- Array of {role, content, timestamp}
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT interview_duration_positive CHECK (duration >= 0)
);

-- 3. Create interview_feedback table (optional, for ratings/feedback)
CREATE TABLE IF NOT EXISTS interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for users table
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. Create RLS Policies for interviews table
-- Users can only see their own interviews
CREATE POLICY "Users can view own interviews"
  ON interviews FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own interviews
CREATE POLICY "Users can insert own interviews"
  ON interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own interviews
CREATE POLICY "Users can update own interviews"
  ON interviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own interviews
CREATE POLICY "Users can delete own interviews"
  ON interviews FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create RLS Policies for interview_feedback table
-- Users can only see feedback for their own interviews
CREATE POLICY "Users can view feedback for own interviews"
  ON interview_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert feedback for their own interviews
CREATE POLICY "Users can insert feedback for own interviews"
  ON interview_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_user_id ON interview_feedback(user_id);

-- 9. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for updated_at
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER interviews_updated_at
BEFORE UPDATE ON interviews
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER interview_feedback_updated_at
BEFORE UPDATE ON interview_feedback
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Migration complete!
-- Next steps:
-- 1. Copy all SQL above
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Create new query
-- 4. Paste the SQL
-- 5. Click "RUN"
