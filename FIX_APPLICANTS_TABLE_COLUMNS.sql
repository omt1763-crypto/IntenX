-- Fix job_applicants table by adding missing columns
-- This script adds phone and resume_url columns if they don't exist

-- Add phone column if it doesn't exist
ALTER TABLE public.job_applicants 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add resume_url column if it doesn't exist
ALTER TABLE public.job_applicants 
ADD COLUMN IF NOT EXISTS resume_url VARCHAR(500);

-- Update status default if needed
ALTER TABLE public.job_applicants 
ALTER COLUMN status SET DEFAULT 'pending';

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'job_applicants' AND table_schema = 'public'
ORDER BY ordinal_position;
