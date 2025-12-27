#!/usr/bin/env node

/**
 * Initialize Supabase Users Table
 * This script creates the users table if it doesn't exist
 * Run: node init-db.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://efiurfmrgyisldruqbad.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXVyZm1yZ3lpc2xkcnVxYmFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MjAzOSwiZXhwIjoyMDgwNDM4MDM9fQ.71d8Q-17yrosS9WuI9Cj3OPFWkf1JToA8Ox12zuCLCE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initializeDatabase() {
  console.log('🚀 Initializing Supabase Database...\n')

  try {
    // Test connection
    console.log('📋 Step 1: Testing Supabase connection...')
    const { data: pingData, error: pingError } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1)

    if (pingError && pingError.code === 'PGRST116') {
      // Table doesn't exist
      console.log('⚠️  Users table does not exist!\n')
      console.log('📝 Please create it manually using Supabase SQL Editor:\n')
      console.log('Steps:')
      console.log('1. Go to: https://app.supabase.com')
      console.log('2. Select project: efiurfmrgyisldruqbad')
      console.log('3. Click: SQL Editor → New Query')
      console.log('4. Copy-paste the SQL from: SQL_CREATE_USERS_TABLE.sql')
      console.log('5. Click: Run ⚡\n')
      console.log('SQL to run:')
      console.log(`
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'company')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
      `)
    } else if (pingError) {
      console.log('❌ Connection error:', pingError.message)
    } else {
      console.log('✅ Connection successful!')
      console.log('✅ Users table exists!\n')
      console.log('Ready to use. Try signing up at http://localhost:3002/auth/signup')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

initializeDatabase()
