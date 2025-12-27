#!/usr/bin/env node

/**
 * Check interview table schema
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
  console.log('📊 Checking interviews table schema...\n')

  if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY)

  try {
    // Get a sample row to see what columns exist
    const { data, error } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error querying interviews:', error.message)
      process.exit(1)
    }

    if (data && data.length > 0) {
      console.log('✅ Interviews table exists')
      console.log('\nCurrent columns in interviews table:')
      const columns = Object.keys(data[0])
      columns.forEach((col, i) => {
        console.log(`  ${i + 1}. ${col}`)
      })
      
      const hasScore = columns.includes('score')
      const hasAnalysis = columns.includes('analysis')
      
      console.log('\n📋 Column Status:')
      console.log(`  score: ${hasScore ? '✅ EXISTS' : '❌ MISSING'}`)
      console.log(`  analysis: ${hasAnalysis ? '✅ EXISTS' : '❌ MISSING'}`)
      
      if (!hasScore || !hasAnalysis) {
        console.log('\n⚠️  Need to add missing columns.')
        console.log('Run this SQL in your Supabase dashboard SQL editor:')
        console.log(`
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS analysis JSONB;
CREATE INDEX IF NOT EXISTS interviews_score_idx ON public.interviews(score);
        `)
      }
    } else {
      console.log('No interviews found (table may be empty)')
    }
  } catch (error) {
    console.error('Fatal error:', error.message)
    process.exit(1)
  }
}

main()
