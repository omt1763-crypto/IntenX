-- ============================================
-- SUPABASE TABLE CREATION - RUN THIS FIRST!!!
-- ============================================

-- 1. Create users table with role support
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'candidate', -- 'candidate', 'recruiter', 'business', 'admin'
  company_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  description TEXT,
  required_skills JSONB, -- Array of skill names
  salary_range VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'filled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'applied', -- 'applied', 'in-progress', 'completed', 'rejected', 'hired'
  resume_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create interviews table  
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  title VARCHAR(255),
  position VARCHAR(255),
  company VARCHAR(255),
  duration INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  score NUMERIC(5,2),
  skills JSONB,
  conversation JSONB,
  notes TEXT,
  timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Create RLS Policies for interviews table
CREATE POLICY "Users can view own interviews"
  ON interviews FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews"
  ON interviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews"
  ON interviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews"
  ON interviews FOR DELETE USING (auth.uid() = user_id);

-- 8. Create RLS Policies for companies table
CREATE POLICY "Recruiters can view own company"
  ON companies FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Recruiters can create companies"
  ON companies FOR INSERT WITH CHECK (owner_id = auth.uid());

-- 9. Create RLS Policies for jobs table
CREATE POLICY "Users can view jobs"
  ON jobs FOR SELECT USING (true);

CREATE POLICY "Recruiters can create jobs"
  ON jobs FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'recruiter');

CREATE POLICY "Recruiters can update own jobs"
  ON jobs FOR UPDATE USING (created_by = auth.uid());

-- 10. Create RLS Policies for candidates table
CREATE POLICY "Users can view own candidate profile"
  ON candidates FOR SELECT USING (user_id = auth.uid() OR (SELECT created_by FROM jobs WHERE id = job_id) = auth.uid());

CREATE POLICY "Candidates can apply for jobs"
  ON candidates FOR INSERT WITH CHECK (user_id = auth.uid());

-- 11. Create indexes
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
