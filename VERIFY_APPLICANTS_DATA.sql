-- Verify job_applicants table data
-- Run this in Supabase SQL Editor to see what's in your database

SELECT 'Total applicants in table:' as metric, COUNT(*) as value FROM public.job_applicants;

SELECT 'Applicants by status:' as metric;
SELECT status, COUNT(*) as count FROM public.job_applicants GROUP BY status;

SELECT 'Applicants with interviews:' as metric;
SELECT COUNT(*) FROM public.job_applicants WHERE interview_id IS NOT NULL;

SELECT 'All applicants:' as metric;
SELECT id, name, email, job_id, interview_id, status, created_at FROM public.job_applicants ORDER BY created_at DESC LIMIT 20;

SELECT 'Jobs and their applicant counts:' as metric;
SELECT j.id, j.title, COUNT(a.id) as applicant_count 
FROM public.jobs j 
LEFT JOIN public.job_applicants a ON j.id = a.job_id 
GROUP BY j.id, j.title
ORDER BY j.created_at DESC;
