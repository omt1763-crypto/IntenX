-- Add interview_type column to interviews table
-- This column tracks whether an interview is practice/testing or a real job interview

ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS interview_type VARCHAR(20) DEFAULT 'real';

-- Add comment to explain the column
COMMENT ON COLUMN public.interviews.interview_type IS 
'Interview type: "practice" for practice/testing interviews (2-minute limit), "real" for actual job interviews (no time limit)';

-- Optional: Add an index on interview_type for filtering performance
CREATE INDEX IF NOT EXISTS interviews_interview_type_idx ON public.interviews(interview_type);

-- Verify the migration
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'interviews' AND column_name = 'interview_type';
