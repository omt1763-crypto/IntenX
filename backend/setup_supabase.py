#!/usr/bin/env python3
"""
Create Supabase tables for InterviewX
Run this to initialize the database
"""

import os
from supabase import create_client

# Supabase credentials
SUPABASE_URL = "https://efiurfmrgyisldruqbad.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXVyZm1yZ3lpc2xkcnVxYmFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MjAzOSwiZXhwIjoyMDgwNDM4MDM5fQ.71d8Q-17yrosS9WuI9Cj3OPFWkf1JToA8Ox12zuCLCE"

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# SQL to create tables
CREATE_TABLES_SQL = """
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  company VARCHAR(255),
  client VARCHAR(255),
  duration INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  skills JSONB,
  conversation JSONB,
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS Policies for interviews
CREATE POLICY "Users can view own interviews" ON interviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews" ON interviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews" ON interviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews" ON interviews
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at DESC);
"""

def create_tables():
    """Create all required tables"""
    try:
        # First, try to query to see if tables exist
        print("Checking if tables exist...")
        result = supabase.table('interviews').select('*').limit(1).execute()
        print("✅ Tables already exist!")
        return True
    except Exception as e:
        print(f"⚠️ Tables don't exist yet: {e}")
        print("\n❌ You must run the SQL migration manually in Supabase!")
        print("\nSteps:")
        print("1. Go to https://app.supabase.com")
        print("2. Select project 'efiurfmrgyisldruqbad'")
        print("3. Go to SQL Editor")
        print("4. Create new query")
        print("5. Copy SQL from SUPABASE_SQL_MIGRATION.sql file")
        print("6. Click RUN")
        return False

if __name__ == "__main__":
    create_tables()
