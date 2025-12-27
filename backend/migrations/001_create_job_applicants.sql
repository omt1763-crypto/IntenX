-- Create job_applicants table
-- This table stores applicants who click on the job interview link

CREATE TABLE IF NOT EXISTS job_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  position_applied VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'invited', -- invited, in_progress, completed, rejected, hired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  rating INTEGER, -- 1-5 rating from recruiter
  
  UNIQUE(job_id, email) -- Prevent duplicate applications
);

-- Create index for faster lookups
CREATE INDEX idx_job_applicants_job_id ON job_applicants(job_id);
CREATE INDEX idx_job_applicants_email ON job_applicants(email);
CREATE INDEX idx_job_applicants_status ON job_applicants(status);
CREATE INDEX idx_job_applicants_created_at ON job_applicants(created_at DESC);

-- Add RLS (Row Level Security) policy
ALTER TABLE job_applicants ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own applications
CREATE POLICY "Allow applicants to insert their own data"
  ON job_applicants FOR INSERT
  WITH CHECK (true);

-- Allow recruiters to view and update applicants for their jobs
CREATE POLICY "Allow recruiters to view their job applicants"
  ON job_applicants FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Allow recruiters to update applicants for their jobs"
  ON job_applicants FOR UPDATE
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE recruiter_id = auth.uid()
    )
  );

-- Allow applicants to view their own data
CREATE POLICY "Allow applicants to view their own data"
  ON job_applicants FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()));
