#!/usr/bin/env node

/**
 * Create Users Table via Supabase HTTP API
 * This bypasses the JS client limitations
 */

const https = require('https')

const supabaseUrl = 'efiurfmrgyisldruqbad.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXVyZm1yZ3lpc2xkcnVxYmFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MjAzOSwiZXhwIjoyMDgwNDM4MDM5fQ.71d8Q-17yrosS9WuI9Cj3OPFWkf1JToA8Ox12zuCLCE'

const createSQL = `
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

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
`

async function executeSQL() {
  console.log('🚀 Creating users table via Supabase API...\n')

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: createSQL
    })

    const options = {
      hostname: supabaseUrl,
      path: '/rest/v1/rpc/sql',
      port: 443,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    }

    const req = https.request(options, (res) => {
      let responseData = ''

      res.on('data', (chunk) => {
        responseData += chunk
      })

      res.on('end', () => {
        console.log(`📊 Response Status: ${res.statusCode}\n`)

        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ SUCCESS! Users table created!\n')
          resolve(true)
        } else if (res.statusCode === 404) {
          console.log('⚠️  API endpoint not found')
          console.log('This is expected - the SQL function may not exist\n')
          resolve(false)
        } else {
          console.log('Response:', responseData)
          resolve(false)
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Error:', error.message)
      reject(error)
    })

    req.write(data)
    req.end()
  })
}

// Test if table exists
async function testTable() {
  return new Promise((resolve) => {
    console.log('Testing if users table exists...\n')

    const options = {
      hostname: supabaseUrl,
      path: '/rest/v1/users?select=*&limit=1',
      port: 443,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept': 'application/json'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Users table EXISTS and is accessible!\n')
          resolve(true)
        } else if (res.statusCode === 404 || data.includes('not found')) {
          console.log('❌ Users table does NOT exist\n')
          resolve(false)
        } else {
          console.log('Response:', res.statusCode, data)
          resolve(false)
        }
      })
    })

    req.on('error', (error) => {
      console.error('Connection error:', error.message)
      resolve(false)
    })

    req.end()
  })
}

// Main
async function main() {
  try {
    // First check if table exists
    const tableExists = await testTable()

    if (tableExists) {
      console.log('🎉 Table is ready!\n')
      console.log('Ready to test signup at: http://localhost:3002/auth/signup\n')
      return
    }

    console.log('Attempting to create table...\n')
    const created = await executeSQL()

    if (created) {
      console.log('✅ Table created successfully!\n')
      console.log('You can now test signup at: http://localhost:3002/auth/signup\n')
    } else {
      console.log('⚠️  Could not create table via API')
      console.log('You may need to create it manually via Supabase SQL Editor\n')
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

main()
