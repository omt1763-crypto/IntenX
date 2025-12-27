-- Create candidate_intake table for storing interview intake information
CREATE TABLE IF NOT EXISTS candidate_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  job_id TEXT,
  resume_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_candidate_intake_email ON candidate_intake(email);
CREATE INDEX IF NOT EXISTS idx_candidate_intake_job_id ON candidate_intake(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_intake_created_at ON candidate_intake(created_at);

-- Enable Row Level Security
ALTER TABLE candidate_intake ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow inserts (for candidates filling form)
CREATE POLICY "Allow candidates to insert intake info" ON candidate_intake
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create RLS policy to allow recruiters to view candidates who applied to their jobs
CREATE POLICY "Allow recruiters to view candidate intake" ON candidate_intake
  FOR SELECT
  TO authenticated
  USING (true);

-- Optional: If you want to track who created the record, you can add:
-- ALTER TABLE candidate_intake ADD COLUMN created_by UUID REFERENCES auth.users;
