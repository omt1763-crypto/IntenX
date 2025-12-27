-- Add score and analysis columns to interviews table if they don't exist

ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS analysis JSONB;

-- Add comments to explain the columns
COMMENT ON COLUMN public.interviews.score IS 'Interview score (0-100) calculated from AI analysis';
COMMENT ON COLUMN public.interviews.analysis IS 'Detailed AI analysis of the interview in JSON format';

-- Create index on score for faster queries
CREATE INDEX IF NOT EXISTS interviews_score_idx ON public.interviews(score);

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'interviews' AND column_name IN ('score', 'analysis')
ORDER BY ordinal_position;
