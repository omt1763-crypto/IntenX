-- Clear all "invited" statuses from job_applicants table
UPDATE public.job_applicants 
SET status = '' 
WHERE status = 'invited';
