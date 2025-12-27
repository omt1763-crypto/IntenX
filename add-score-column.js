#!/usr/bin/env node

/**
 * Add score column to interviews table using Supabase admin API
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=')
        if (key && value) {
          process.env[key.trim()] = value.trim()
        }
      }
    })
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function main() {
  console.log('🔧 Adding score column to interviews table...\n')

  if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }

  try {
    // Use Supabase REST API directly to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ADMIN_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;`
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      // If exec_sql doesn't work, try the alternative approach
      console.log('⚠️  exec_sql RPC not available, trying alternative method...')
      
      // The score column might be auto-added by checking if we can add it via schema
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY)
      
      // Try to update a row - if score column doesn't exist, this will fail
      // But we can't create columns via normal Supabase JS client
      console.log('⚠️  Manual SQL required')
      console.log('\n📋 Please run this SQL in your Supabase dashboard SQL editor:')
      console.log(`
-- Open https://app.supabase.com → Select your project → SQL Editor
-- Paste and run this:

ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS interviews_score_idx ON public.interviews(score);

-- Verify it worked:
SELECT column_name FROM information_schema.columns WHERE table_name = 'interviews' AND column_name = 'score';
      `)
      console.log('\n✅ Once you run the SQL above, the analysis regeneration will work!')
      process.exit(0)
    } else {
      console.log('✅ Score column added successfully!')
      console.log('\nYou can now run: node regenerate-analysis.js')
      process.exit(0)
    }
  } catch (error) {
    console.error('Error:', error.message)
    console.log('\n📋 Please manually add the column in Supabase dashboard:')
    console.log(`
1. Go to: https://app.supabase.com → Select your project
2. Click "SQL Editor" in the left sidebar
3. Create a new query and paste:

ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS interviews_score_idx ON public.interviews(score);

4. Click "Run"
5. Then run: node regenerate-analysis.js
    `)
    process.exit(1)
  }
}

main()
