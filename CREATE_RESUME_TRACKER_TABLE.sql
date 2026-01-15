-- Drop table if exists (for fresh setup)
DROP TABLE IF EXISTS resumes CASCADE;

-- Create resumes table for tracking (Simple version - works immediately)
CREATE TABLE resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  job_description TEXT,
  analysis JSONB NOT NULL,
  status TEXT DEFAULT 'applied',
  job_title TEXT,
  company_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add constraints
ALTER TABLE resumes ADD CONSTRAINT valid_status 
  CHECK (status IN ('applied', 'under_review', 'shortlisted', 'interview', 'offer', 'rejected'));

-- Create indexes for faster queries
CREATE INDEX idx_resumes_phone ON resumes(phone_number);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resumes_created ON resumes(created_at DESC);

-- Enable row-level security (optional - can be added later with auth)
-- ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Grant access (public table for now - secure in app layer)
ALTER TABLE resumes REPLICA IDENTITY FULL;
