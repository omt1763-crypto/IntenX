-- ============================================
-- COMPLETE SUPABASE SCHEMA FOR INTERVIEWX
-- ============================================
-- Run this in Supabase SQL Editor to create all tables

-- 1. USERS TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50), -- 'recruiter', 'business', 'candidate'
  company_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  company VARCHAR(255),
  location VARCHAR(255),
  salary_min INTEGER,
  salary_max INTEGER,
  job_type VARCHAR(50), -- 'full-time', 'part-time', 'contract'
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'filled'
  required_skills JSONB,
  experience_level VARCHAR(50), -- 'junior', 'mid', 'senior'
  applications_count INTEGER DEFAULT 0,
  interviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'applied', -- 'applied', 'interview_scheduled', 'interview_completed', 'rejected', 'hired'
  resume_url TEXT,
  cover_letter TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. INTERVIEWS TABLE (from realtime interviews)
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  title VARCHAR(255),
  position VARCHAR(255),
  company VARCHAR(255),
  client VARCHAR(255),
  duration INTEGER, -- in seconds
  status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'in-progress', 'failed'
  skills JSONB, -- array of {name, reason, importance}
  conversation JSONB, -- array of {role, content, timestamp}
  notes TEXT,
  rating INTEGER, -- 1-5 star rating
  feedback TEXT,
  timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. INTERVIEW SCORES TABLE
CREATE TABLE IF NOT EXISTS interview_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  technical_score INTEGER, -- 0-100
  communication_score INTEGER, -- 0-100
  problem_solving_score INTEGER, -- 0-100
  overall_score INTEGER, -- 0-100
  strengths JSONB, -- array of strings
  weaknesses JSONB, -- array of strings
  recommendation VARCHAR(50), -- 'hire', 'maybe', 'reject'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CANDIDATE PROFILE TABLE
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  headline VARCHAR(255),
  location VARCHAR(255),
  experience_years INTEGER,
  skills JSONB, -- array of {name, level}
  education JSONB, -- array of {school, degree, field, year}
  portfolio_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  total_interviews INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. RECRUITER STATS TABLE (denormalized for performance)
CREATE TABLE IF NOT EXISTS recruiter_stats (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_jobs_created INTEGER DEFAULT 0,
  total_applications INTEGER DEFAULT 0,
  total_interviews_scheduled INTEGER DEFAULT 0,
  total_interviews_completed INTEGER DEFAULT 0,
  total_hired INTEGER DEFAULT 0,
  avg_interview_duration INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_stats ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY POLICIES - USERS
-- ============================================

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES - JOBS
-- ============================================

CREATE POLICY "Recruiters can create jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can view own jobs" ON jobs
  FOR SELECT USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = recruiter_id);

CREATE POLICY "Candidates can view open jobs" ON jobs
  FOR SELECT USING (status = 'open');

-- ============================================
-- ROW LEVEL SECURITY POLICIES - APPLICATIONS
-- ============================================

CREATE POLICY "Candidates can create applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates can view own applications" ON applications
  FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can view applications for their jobs" ON applications
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM jobs WHERE recruiter_id = auth.uid()
    )
  );

-- ============================================
-- ROW LEVEL SECURITY POLICIES - INTERVIEWS
-- ============================================

CREATE POLICY "Users can view own interviews" ON interviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews" ON interviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews" ON interviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews" ON interviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can view interviews for their jobs" ON interviews
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM jobs WHERE recruiter_id = auth.uid()
    )
  );

-- ============================================
-- ROW LEVEL SECURITY POLICIES - INTERVIEW SCORES
-- ============================================

CREATE POLICY "Users can view scores for own interviews" ON interview_scores
  FOR SELECT USING (
    interview_id IN (
      SELECT id FROM interviews WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view scores for their job interviews" ON interview_scores
  FOR SELECT USING (
    interview_id IN (
      SELECT interviews.id FROM interviews
      JOIN jobs ON interviews.job_id = jobs.id
      WHERE jobs.recruiter_id = auth.uid()
    )
  );

-- ============================================
-- ROW LEVEL SECURITY POLICIES - CANDIDATE PROFILES
-- ============================================

CREATE POLICY "Candidates can view own profile" ON candidate_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Candidates can update own profile" ON candidate_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Candidates can insert own profile" ON candidate_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Recruiters can view candidate profiles" ON candidate_profiles
  FOR SELECT USING (true);

-- ============================================
-- ROW LEVEL SECURITY POLICIES - RECRUITER STATS
-- ============================================

CREATE POLICY "Recruiters can view own stats" ON recruiter_stats
  FOR SELECT USING (auth.uid() = id);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interview_scores_interview_id ON interview_scores(interview_id);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_experience_years ON candidate_profiles(experience_years);
