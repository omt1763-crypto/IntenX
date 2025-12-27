#!/usr/bin/env node

/**
 * Diagnostic script to check Supabase credentials
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Supabase Credentials Diagnostic\n')

const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')

// Extract credentials
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)
const anonMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)
const serviceMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)

if (!urlMatch || !anonMatch || !serviceMatch) {
  console.log('❌ Missing credentials in .env.local')
  process.exit(1)
}

const url = urlMatch[1].trim()
const anonKey = anonMatch[1].trim()
const serviceKey = serviceMatch[1].trim()

console.log('📋 Supabase URL:')
console.log(`  ${url}\n`)

console.log('📋 Anon Key:')
console.log(`  Length: ${anonKey.length}`)
console.log(`  Starts with: ${anonKey.substring(0, 20)}...`)
console.log(`  Ends with: ...${anonKey.substring(anonKey.length - 20)}`)
console.log(`  Format: ${anonKey.split('.').length} parts (should be 3)\n`)

console.log('📋 Service Role Key:')
console.log(`  Length: ${serviceKey.length}`)
console.log(`  Starts with: ${serviceKey.substring(0, 20)}...`)
console.log(`  Ends with: ...${serviceKey.substring(serviceKey.length - 20)}`)
console.log(`  Format: ${serviceKey.split('.').length} parts (should be 3)\n`)

// Validate JWT format
const validateJWT = (token, name) => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    console.log(`❌ ${name}: Invalid JWT format (${parts.length} parts, expected 3)`)
    return false
  }
  
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    
    console.log(`✅ ${name}: Valid JWT format`)
    console.log(`   Header: ${JSON.stringify(header)}`)
    console.log(`   Payload role: ${payload.role}\n`)
    return true
  } catch (e) {
    console.log(`❌ ${name}: Invalid JWT encoding (${e.message})\n`)
    return false
  }
}

validateJWT(anonKey, 'Anon Key')
validateJWT(serviceKey, 'Service Role Key')

console.log('🔧 To fix:\n')
console.log('1. Go to: https://app.supabase.com')
console.log('2. Select project: efiurfmrgyisldruqbad')
console.log('3. Click: Settings → API')
console.log('4. Copy the EXACT values from "Project API keys"')
console.log('5. Paste in .env.local exactly as shown')
console.log('6. No spaces, no modifications\n')

console.log('⚠️  Make sure you copy the FULL JWT including all periods!\n')
