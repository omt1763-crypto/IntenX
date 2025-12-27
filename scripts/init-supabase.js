// Script to initialize Supabase database with users table
// Run this once to set up the database schema

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://efiurfmrgyisldruqbad.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXVyZm1yZ3lpc2xkcnVxYmFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MjAzOSwiZXhwIjoyMDgwNDM4MDM9fQ.71d8Q-17yrosS9WuI9Cj3OPFWkf1JToA8Ox12zuCLCE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...')

  try {
    // Create users table with SQL
    const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Drop table if exists (for fresh setup)
        DROP TABLE IF EXISTS users CASCADE;

        -- Create users table
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

        -- Create index for fast email lookups
        CREATE INDEX idx_users_email ON users(email);

        -- Create function to update updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create trigger for updated_at
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `
    })

    if (sqlError) {
      console.error('❌ SQL Error:', sqlError)
    } else {
      console.log('✅ Users table created successfully!')
    }

    // Try direct approach if RPC fails
    console.log('\n📝 Trying direct SQL approach...')
    
    // Check if table exists
    const { data: tables, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      console.log('⚠️ Table does not exist. Please create it manually using Supabase SQL Editor:')
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
      `)
    } else if (!tableError) {
      console.log('✅ Users table already exists!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run initialization
initializeDatabase()
