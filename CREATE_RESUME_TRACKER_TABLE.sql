-- Create resumes table for tracking
CREATE TABLE IF NOT EXISTS resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_resumes_phone ON resumes(phone_number);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
CREATE INDEX IF NOT EXISTS idx_resumes_created ON resumes(created_at DESC);

-- Enable RLS if needed
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Users can view their own resumes" ON resumes
  FOR SELECT USING (phone_number = current_user_phone());

CREATE POLICY "Users can insert their own resumes" ON resumes
  FOR INSERT WITH CHECK (phone_number = current_user_phone());

CREATE POLICY "Users can update their own resumes" ON resumes
  FOR UPDATE USING (phone_number = current_user_phone());
