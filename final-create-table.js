#!/usr/bin/env node

/**
 * ALTERNATIVE: Create Users Table via Database Functions
 * Using Supabase's built-in functions where possible
 */

const { createClient } = require('@supabase/supabase-js')
const https = require('https')

const supabaseUrl = 'https://efiurfmrgyisldruqbad.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXVyZm1yZ3lpc2xkcnVxYmFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MjAzOSwiZXhwIjoyMDgwNDM4MDM5fQ.71d8Q-17yrosS9WuI9Cj3OPFWkf1JToA8Ox12zuCLCE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTableUsingPostgreSQL() {
  console.log('🔧 Attempting to create users table...\n')

  try {
    // Method 1: Try to insert a dummy record to test if table exists
    console.log('Step 1: Testing table existence...')
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('❌ Table does not exist (confirmed)\n')

        // Table doesn't exist - we need to use a different approach
        // Since the JS client can't execute raw SQL, we'll use curl/HTTP directly
        
        console.log('📡 Using direct HTTP method to create table...\n')

        return await createTableViaHTTP()
      } else {
        console.log('Error:', error.message)
        return false
      }
    } else {
      console.log('✅ Table already exists!\n')
      return true
    }
  } catch (err) {
    console.error('Error:', err.message)
    return false
  }
}

async function createTableViaHTTP() {
  return new Promise((resolve) => {
    const sql = `
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
      RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language 'plpgsql';
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `

    // Try using Supabase's query endpoint
    const postData = JSON.stringify({ query: sql })

    const options = {
      hostname: 'efiurfmrgyisldruqbad.supabase.co',
      path: '/rest/v1/rpc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    }

    const req = https.request(options, (res) => {
      console.log(`Response: ${res.statusCode}`)
      
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Table created!\n')
          resolve(true)
        } else {
          console.log('Response:', data)
          resolve(false)
        }
      })
    })

    req.on('error', (error) => {
      console.error('Request error:', error.message)
      resolve(false)
    })

    req.write(postData)
    req.end()
  })
}

// Main execution
async function main() {
  const success = await createTableUsingPostgreSQL()

  if (!success) {
    console.log('⚠️  IMPORTANT: The Supabase JavaScript client cannot execute raw SQL.\n')
    console.log('📋 You MUST create the table manually via SQL Editor.\n')
    console.log('Steps:')
    console.log('1. Go to: https://app.supabase.com')
    console.log('2. Select: efiurfmrgyisldruqbad')
    console.log('3. Click: SQL Editor')
    console.log('4. New Query')
    console.log('5. Copy SQL from: SQL_CREATE_USERS_TABLE.sql')
    console.log('6. Paste & Run ⚡\n')
    console.log('OR\n')
    console.log('Try using curl command:\n')
    console.log(`curl -X POST https://efiurfmrgyisldruqbad.supabase.co/rest/v1/rpc/execute_sql \\
  -H "Authorization: Bearer ${supabaseServiceKey}" \\
  -H "apikey: ${supabaseServiceKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"sql": "CREATE TABLE users (...)"}'`)
  } else {
    console.log('Ready to use! Test at: http://localhost:3002/auth/signup')
  }
}

main()
