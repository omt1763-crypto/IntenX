-- Fix job_applicants RLS policies for recruiter access

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert applicants" ON public.job_applicants;
DROP POLICY IF EXISTS "Recruiters can view applicants for their jobs" ON public.job_applicants;
DROP POLICY IF EXISTS "Update applicant status" ON public.job_applicants;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.job_applicants;

-- Create new policies
-- Allow anyone to insert applicants (for pre-onboarding)
CREATE POLICY "Allow anyone to insert applicants" ON public.job_applicants
  FOR INSERT
  WITH CHECK (true);

-- Allow recruiters to view applicants for their jobs
CREATE POLICY "Recruiters can view their job applicants" ON public.job_applicants
  FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM public.jobs 
      WHERE recruiter_id = auth.uid()
    )
  );

-- Allow update of applicant status
CREATE POLICY "Allow update applicant status" ON public.job_applicants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
