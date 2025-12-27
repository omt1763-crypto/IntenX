-- Add missing columns to interviews table if they don't exist
ALTER TABLE IF EXISTS public.interviews ADD COLUMN IF NOT EXISTS applicant_id UUID;
ALTER TABLE IF EXISTS public.interviews ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.interviews ADD COLUMN IF NOT EXISTS conversation JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.interviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create/Update interviews table with proper schema (for fresh installations)
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  applicant_id UUID,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  title VARCHAR(255),
  position VARCHAR(255),
  company VARCHAR(255),
  client VARCHAR(255),
  duration INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'completed',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  skills JSONB DEFAULT '[]'::jsonb,
  conversation JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON public.interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON public.interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_applicant_id ON public.interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON public.interviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own interviews" ON public.interviews;
DROP POLICY IF EXISTS "Users can insert own interviews" ON public.interviews;
DROP POLICY IF EXISTS "Recruiters can update their job interviews" ON public.interviews;
DROP POLICY IF EXISTS "Allow anonymous interviews" ON public.interviews;

-- RLS Policies
-- Allow anyone to insert interviews (for anonymous candidates and authenticated users)
CREATE POLICY "Allow anonymous interviews" ON public.interviews
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own interviews or interviews from their jobs
CREATE POLICY "Users can view own interviews" ON public.interviews
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = auth.uid())
    OR true  -- Allow anonymous access to view interviews
  );

-- Recruiters can update interviews for their jobs
CREATE POLICY "Recruiters can update their job interviews" ON public.interviews
  FOR UPDATE
  USING (job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()))
  WITH CHECK (job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()));
