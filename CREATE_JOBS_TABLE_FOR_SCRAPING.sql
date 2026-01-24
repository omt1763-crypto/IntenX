-- Create jobs table for storing scraped job data
CREATE TABLE IF NOT EXISTS public.scraped_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  skills JSONB, -- Array of required skills
  salary_min NUMERIC,
  salary_max NUMERIC,
  currency VARCHAR(10),
  job_type VARCHAR(50), -- Full-time, Part-time, Contract, etc.
  location VARCHAR(255),
  is_remote BOOLEAN DEFAULT FALSE,
  country VARCHAR(100),
  job_url VARCHAR(500) UNIQUE,
  source VARCHAR(100), -- 'linkedin', 'indeed', 'glassdoor', 'custom_site', etc.
  posted_date TIMESTAMP,
  scraped_at TIMESTAMP DEFAULT NOW(),
  expiration_date TIMESTAMP,
  company_logo_url VARCHAR(500),
  company_description TEXT,
  benefits JSONB,
  experience_level VARCHAR(50), -- Entry, Mid, Senior, Executive
  match_score NUMERIC, -- Will be calculated when matching with resumes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes for better query performance
  CONSTRAINT valid_salary CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_min <= salary_max)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_job_title ON public.scraped_jobs(job_title);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_company ON public.scraped_jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_location ON public.scraped_jobs(location);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_source ON public.scraped_jobs(source);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_skills ON public.scraped_jobs USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_job_type ON public.scraped_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_is_remote ON public.scraped_jobs(is_remote);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_is_active ON public.scraped_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_posted_date ON public.scraped_jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_jobs_experience_level ON public.scraped_jobs(experience_level);

-- Create a view for active, non-expired jobs
CREATE OR REPLACE VIEW public.active_jobs AS
SELECT *
FROM public.scraped_jobs
WHERE is_active = TRUE
  AND (expiration_date IS NULL OR expiration_date > NOW());

-- Create table to track job scraping sessions
CREATE TABLE IF NOT EXISTS public.job_scraping_sessions (
  id BIGSERIAL PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_jobs_found BIGINT,
  jobs_added BIGINT,
  jobs_updated BIGINT,
  errors TEXT,
  status VARCHAR(50), -- 'in_progress', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create table for resume-to-job matches
CREATE TABLE IF NOT EXISTS public.resume_job_matches (
  id BIGSERIAL PRIMARY KEY,
  resume_id VARCHAR(255),
  job_id BIGINT REFERENCES public.scraped_jobs(id),
  match_score NUMERIC(5,2), -- 0-100
  skills_matched JSONB,
  skills_gap JSONB,
  why_match TEXT,
  next_steps JSONB,
  apply_readiness_score NUMERIC(5,2), -- 0-100
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (job_id) REFERENCES public.scraped_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resume_job_matches_resume ON public.resume_job_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_job_matches_job ON public.resume_job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_resume_job_matches_score ON public.resume_job_matches(match_score DESC);

-- Add comments for documentation
COMMENT ON TABLE public.scraped_jobs IS 'Stores job postings scraped from various job boards and LinkedIn';
COMMENT ON COLUMN public.scraped_jobs.skills IS 'JSONB array of required skills, e.g., ["Python", "React", "AWS"]';
COMMENT ON COLUMN public.scraped_jobs.benefits IS 'JSONB array of benefits, e.g., ["Health Insurance", "Remote", "401k"]';
COMMENT ON COLUMN public.scraped_jobs.match_score IS 'Stores the match score when compared with a resume (0-100)';
COMMENT ON TABLE public.resume_job_matches IS 'Stores matching results between resumes and job postings';
COMMENT ON TABLE public.job_scraping_sessions IS 'Tracks job scraping sessions and their results';
