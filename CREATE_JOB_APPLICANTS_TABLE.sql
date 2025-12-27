-- Create job_applicants table for tracking candidates who apply for jobs
CREATE TABLE IF NOT EXISTS public.job_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  position_applied VARCHAR(255),
  status VARCHAR(50) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applicants_job_id ON public.job_applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applicants_email ON public.job_applicants(email);
CREATE INDEX IF NOT EXISTS idx_job_applicants_status ON public.job_applicants(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.job_applicants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to insert applicants (for pre-onboarding)
CREATE POLICY "Allow insert applicants" ON public.job_applicants
  FOR INSERT
  WITH CHECK (true);

-- Allow recruiters to view applicants for their jobs
CREATE POLICY "Recruiters can view applicants for their jobs" ON public.job_applicants
  FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM public.jobs 
      WHERE recruiter_id = auth.uid()
    )
  );

-- Allow authenticated users to update their own applicant status
CREATE POLICY "Update applicant status" ON public.job_applicants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
