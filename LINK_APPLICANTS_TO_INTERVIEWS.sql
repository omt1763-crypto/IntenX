-- Link interviews to applicants in job_applicants table

ALTER TABLE IF EXISTS public.job_applicants ADD COLUMN IF NOT EXISTS interview_id UUID;

-- Add foreign key reference to interviews table
ALTER TABLE IF EXISTS public.job_applicants 
  ADD CONSTRAINT fk_job_applicants_interview_id 
  FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_applicants_interview_id ON public.job_applicants(interview_id);
