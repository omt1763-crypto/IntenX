const fs = require('fs')
const path = require('path')

// Manual .env.local parser
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && !key.startsWith('#')) {
      env[key.trim()] = valueParts.join('=').trim()
    }
  })
  
  return env
}

const envVars = loadEnv()

const { createClient } = require('@supabase/supabase-js')

console.log('🔍 Environment check:')
console.log('  SUPABASE_URL:', envVars.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('  SERVICE_ROLE_KEY:', envVars.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')

// Initialize Supabase with service role key for admin access
const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanupUsers() {
  try {
    console.log('🧹 Starting database cleanup...')

    // Delete all users from the users table
    const { data, error } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (this trick deletes everything)

    if (error) {
      console.error('❌ Error deleting users:', error)
      return
    }

    console.log('✅ Successfully deleted all user records from users table')
    console.log(`Total records deleted: ${data?.length || 'unknown'}`)

    // List remaining users to confirm
    const { data: remainingUsers, error: checkError } = await supabase
      .from('users')
      .select('email, role')

    if (!checkError) {
      console.log(`✅ Remaining users in database: ${remainingUsers.length}`)
      if (remainingUsers.length === 0) {
        console.log('✨ Database is now clean! You can sign up with a fresh email.')
      }
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }
}

cleanupUsers()
