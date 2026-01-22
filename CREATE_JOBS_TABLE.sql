-- Drop existing tables if they exist (to start clean)
DROP TABLE IF EXISTS job_scrape_logs CASCADE;
DROP TABLE IF EXISTS job_matches_history CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- Create Jobs Table for storing job postings from various sources
CREATE TABLE jobs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Basic Job Info
  job_title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_description TEXT,
  job_url VARCHAR(500),
  source VARCHAR(50),
  source_job_id VARCHAR(255),
  
  -- Job Details
  job_type VARCHAR(50),
  experience_level VARCHAR(50),
  salary_min DECIMAL(10, 2),
  salary_max DECIMAL(10, 2),
  salary_currency VARCHAR(10) DEFAULT 'USD',
  salary_period VARCHAR(20),
  
  -- Location Info
  location VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  is_remote BOOLEAN DEFAULT FALSE,
  work_arrangement VARCHAR(50),
  
  -- Skills & Requirements
  required_skills TEXT[],
  nice_to_have_skills TEXT[],
  
  -- Company Info
  company_size VARCHAR(50),
  industry VARCHAR(100),
  company_url VARCHAR(500),
  company_logo_url VARCHAR(500),
  
  -- Additional Metadata
  posted_date TIMESTAMP,
  application_deadline TIMESTAMP,
  total_applicants INTEGER,
  views_count INTEGER,
  search_vector tsvector,
  
  -- System Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  UNIQUE(source, source_job_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_jobs_job_title ON jobs(job_title);
CREATE INDEX idx_jobs_company ON jobs(company_name);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_experience ON jobs(experience_level);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_is_remote ON jobs(is_remote);
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_created ON jobs(created_at);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_required_skills ON jobs USING GIN(required_skills);
CREATE INDEX idx_jobs_search ON jobs USING GIN(search_vector);

-- =====================================================
-- Job Matches History Table (for tracking which jobs were shown to which users)
-- =====================================================
CREATE TABLE job_matches_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  resume_id BIGINT,
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
  match_percentage INTEGER,
  apply_readiness_score INTEGER,
  user_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(resume_id, job_id)
);

CREATE INDEX idx_job_matches_resume ON job_matches_history(resume_id);
CREATE INDEX idx_job_matches_job ON job_matches_history(job_id);
CREATE INDEX idx_job_matches_created ON job_matches_history(created_at);

-- =====================================================
-- Job Scrape Log Table (for tracking scraping status and errors)
-- =====================================================
CREATE TABLE job_scrape_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  source VARCHAR(50),
  status VARCHAR(50),
  total_jobs_scraped INTEGER,
  jobs_saved INTEGER,
  jobs_updated INTEGER,
  jobs_failed INTEGER,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scrape_logs_source ON job_scrape_logs(source);
CREATE INDEX idx_scrape_logs_created ON job_scrape_logs(created_at);
CREATE INDEX idx_scrape_logs_status ON job_scrape_logs(status);

-- Database setup complete
SELECT 'All tables created successfully!' as status;
