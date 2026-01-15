-- ============================================
-- SUPABASE AUTH-ENABLED VERSION
-- Drop existing table if it exists, then create fresh
-- ============================================

-- Drop existing table first
DROP TABLE IF EXISTS resumes CASCADE;

-- Create resumes table for tracking
CREATE TABLE resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT,
  resume_text TEXT NOT NULL,
  job_description TEXT,
  analysis JSONB NOT NULL,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'under_review', 'shortlisted', 'interview', 'offer', 'rejected')),
  job_title TEXT,
  company_name TEXT,
  application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resumes_created ON resumes(created_at DESC);
CREATE INDEX idx_resumes_phone ON resumes(phone_number);

-- Enable RLS
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own resumes
CREATE POLICY "Users can view their own resumes" ON resumes
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own resumes
CREATE POLICY "Users can insert their own resumes" ON resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own resumes
CREATE POLICY "Users can update their own resumes" ON resumes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own resumes
CREATE POLICY "Users can delete their own resumes" ON resumes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- USAGE
-- ============================================
-- When inserting, include the user_id from auth.users
-- Example:
-- INSERT INTO resumes (user_id, phone_number, resume_text, analysis, status)
-- VALUES (auth.uid(), '8103668703', 'resume text...', '{"analysis": "data"}', 'applied')
