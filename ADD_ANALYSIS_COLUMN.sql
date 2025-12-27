-- Add analysis column to interviews table to store AI assessment
ALTER TABLE IF EXISTS public.interviews ADD COLUMN IF NOT EXISTS analysis JSONB DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_interviews_analysis ON public.interviews USING GIN (analysis);
