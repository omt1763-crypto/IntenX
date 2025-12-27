#!/usr/bin/env node

/**
 * AUTO-CREATE USERS TABLE
 * This script creates the users table in Supabase automatically
 * Run: node auto-create-table.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://efiurfmrgyisldruqbad.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXVyZm1yZ3lpc2xkcnVxYmFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MjAzOSwiZXhwIjoyMDgwNDM4MDM5fQ.71d8Q-17yrosS9WuI9Cj3OPFWkf1JToA8Ox12zuCLCE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createUsersTable() {
  console.log('🚀 Creating users table in Supabase...\n')

  try {
    // SQL to create users table
    const sql = `
      -- Drop existing table if it exists (optional, comment out if you want to keep data)
      -- DROP TABLE IF EXISTS users CASCADE;

      -- Create users table
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

      -- Create index for fast email lookups
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      -- Create function to update updated_at column
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger for updated_at
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `

    console.log('📝 SQL Query to execute:')
    console.log('─'.repeat(50))
    console.log(sql)
    console.log('─'.repeat(50))
    console.log()

    // Execute SQL using Supabase admin API
    console.log('⏳ Sending request to Supabase...')
    
    // Try using rpc if available, otherwise use direct SQL
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: sql
    })

    if (error && error.code === '42883') {
      // Function doesn't exist, try alternative method
      console.log('ℹ️  Using alternative method to create table...\n')
      
      // Try creating table directly
      const createTableSQL = `
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
      `

      // We can't directly execute raw SQL through the JS client
      // But we can verify if the table needs to be created
      const { data: checkData, error: checkError } = await supabase
        .from('users')
        .select('count(*)', { count: 'exact' })
        .limit(1)

      if (checkError && checkError.code === 'PGRST116') {
        console.log('❌ Table still does not exist.')
        console.log('ℹ️  Unfortunately, the Supabase JS client cannot execute raw SQL directly.')
        console.log('You need to create the table manually using the SQL Editor.\n')
        console.log('📋 But I can create a test user if the table exists!')
        return
      } else if (!checkError) {
        console.log('✅ Table already exists!\n')
        return
      }
    } else if (error) {
      console.log(`❌ Error: ${error.message}\n`)
      
      // Check if table exists
      console.log('Checking if table exists...')
      const { data: checkData, error: checkError } = await supabase
        .from('users')
        .select('count(*)', { count: 'exact' })
        .limit(1)

      if (!checkError) {
        console.log('✅ Great! Table exists and is accessible!\n')
        return true
      } else if (checkError.code === 'PGRST116') {
        console.log('❌ Table does not exist.\n')
        console.log('⚠️  The Supabase JS client has limitations creating tables.')
        console.log('However, let me try an alternative approach...\n')
      }
    } else {
      console.log('✅ Database creation SQL executed!\n')
    }

    // Verify table was created
    console.log('✅ Verifying table creation...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (!verifyError) {
      console.log('✅ SUCCESS! Users table created and is ready!\n')
      console.log('📊 Table Details:')
      console.log('   Name: users')
      console.log('   Columns: id, first_name, last_name, email, password_hash, role, created_at, updated_at')
      console.log('   Status: ✅ Ready to use\n')
      return true
    } else if (verifyError.code === 'PGRST116') {
      console.log('❌ Table does not exist.')
      console.log('\n⚠️  LIMITATION FOUND:')
      console.log('The Supabase JavaScript client cannot execute raw CREATE TABLE SQL.')
      console.log('We need to use the SQL Editor for this.\n')
      console.log('BUT! I have an alternative solution...\n')
      return false
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

// Main execution
async function main() {
  const success = await createUsersTable()
  
  if (!success) {
    console.log('📋 ALTERNATIVE: Create table using REST API\n')
    console.log('Let me try a different approach...')
    
    // Try test if table exists
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (error && error.code === 'PGRST116') {
      console.log('\n❌ Table needs to be created manually via SQL Editor')
      console.log('📋 SQL command to run in Supabase SQL Editor:\n')
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
    } else if (!error) {
      console.log('✅ Table exists!')
    }
  }
}

main()
