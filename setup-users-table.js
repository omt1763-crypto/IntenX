#!/usr/bin/env node

/**
 * AUTO-SETUP: Create Supabase users table
 * This connects to Supabase and creates the users table automatically
 * Run: node setup-users-table.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://efiurfmrgyisldruqbad.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXVyZm1yZ3lpc2xkcnVxYmFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MjAzOSwiZXhwIjoyMDgwNDM4MDM5fQ.71d8Q-17yrosS9WuI9Cj3OPFWkf1JToA8Ox12zuCLCE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTable() {
  console.log('🚀 Setting up Supabase users table...\n')

  try {
    // Check if table already exists
    console.log('📋 Checking if users table exists...')
    const { data, error } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact' })
      .limit(1)

    if (!error) {
      console.log('✅ Users table already exists!\n')
      console.log('Ready to test. Go to: http://localhost:3002/auth/signup\n')
      return
    }

    // Table doesn't exist, create it
    if (error && error.code === 'PGRST116') {
      console.log('⚠️  Table does not exist. Attempting to create...\n')

      // Create table using SQL
      const { data: createData, error: createError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'company')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = CURRENT_TIMESTAMP;
              RETURN NEW;
          END;
          $$ language 'plpgsql';

          CREATE TRIGGER IF NOT EXISTS update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        `
      })

      if (createError) {
        console.log('⚠️  Auto-creation failed. Please create manually.\n')
        console.log('Steps:')
        console.log('1. Go to: https://app.supabase.com')
        console.log('2. Select: efiurfmrgyisldruqbad')
        console.log('3. SQL Editor → New Query')
        console.log('4. Copy-paste from: SQL_CREATE_USERS_TABLE.sql')
        console.log('5. Run ⚡\n')
        return
      }

      console.log('✅ Users table created successfully!\n')
    }

    console.log('✅ Database is ready!\n')
    console.log('Ready to test. Go to: http://localhost:3002/auth/signup\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\nManual setup:')
    console.log('1. Go to: https://app.supabase.com')
    console.log('2. SQL Editor → New Query')
    console.log('3. Copy-paste from: SQL_CREATE_USERS_TABLE.sql')
    console.log('4. Click Run ⚡\n')
  }
}

setupTable()
