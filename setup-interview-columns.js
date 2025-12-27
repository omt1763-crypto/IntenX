#!/usr/bin/env node

/**
 * Script to add score and analysis columns to interviews table
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
  console.log('🔧 Setting up interview table columns...')
  console.log(`SUPABASE_URL: ${SUPABASE_URL}`)

  if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY) {
    console.error('❌ Missing environment variables')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY)

  try {
    // Run the SQL migrations
    const sql = `
      ALTER TABLE public.interviews 
      ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

      ALTER TABLE public.interviews 
      ADD COLUMN IF NOT EXISTS analysis JSONB;

      CREATE INDEX IF NOT EXISTS interviews_score_idx ON public.interviews(score);
    `

    console.log('[Setup] Running SQL migrations...')
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql })

    if (error) {
      // If RPC method doesn't exist, try alternative approach
      console.log('[Setup] RPC method not available, checking current schema...')
      
      // Just verify the columns exist by trying to query them
      const { data, error: checkError } = await supabaseAdmin
        .from('interviews')
        .select('id, score, analysis')
        .limit(1)

      if (checkError && checkError.message.includes('does not exist')) {
        console.warn('[Setup] ⚠️  Columns may not exist yet')
        console.warn('[Setup] Please run this SQL in Supabase dashboard:')
        console.warn(`
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS analysis JSONB;
CREATE INDEX IF NOT EXISTS interviews_score_idx ON public.interviews(score);
        `)
        process.exit(1)
      } else {
        console.log('[Setup] ✅ Columns exist or were created successfully')
      }
    } else {
      console.log('[Setup] ✅ SQL migrations executed successfully')
    }

    // Verify columns exist
    const { data: sample, error: verifyError } = await supabaseAdmin
      .from('interviews')
      .select('id, score, analysis')
      .limit(1)

    if (!verifyError) {
      console.log('[Setup] ✅ Verified: score and analysis columns are ready')
      process.exit(0)
    } else if (verifyError.message.includes('does not exist')) {
      console.error('[Setup] ❌ Columns still missing. Please run this SQL manually in Supabase dashboard:')
      console.error(`
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS analysis JSONB;
CREATE INDEX IF NOT EXISTS interviews_score_idx ON public.interviews(score);
      `)
      process.exit(1)
    }
  } catch (error) {
    console.error('[Setup] Fatal error:', error.message)
    console.error('[Setup] Please manually run the SQL from ADD_SCORE_AND_ANALYSIS_COLUMNS.sql')
    process.exit(1)
  }
}

main()
