import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetDatabase() {
  console.log('🔄 Starting database reset...')
  console.log('⚠️ This will DELETE ALL data from the database\n')

  try {
    // Delete in order of dependencies (foreign keys)
    
    // 1. Delete interviews (depends on jobs, applicants, users)
    console.log('🗑️ Deleting interviews...')
    const { count: interviewCount, error: intError } = await supabase
      .from('interviews')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (intError) {
      console.warn('⚠️ Could not delete interviews:', intError.message)
    } else {
      console.log(`✅ Deleted ${interviewCount} interviews`)
    }

    // 2. Delete job_applicants (depends on jobs)
    console.log('🗑️ Deleting job applicants...')
    const { count: appCount, error: appError } = await supabase
      .from('job_applicants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (appError) {
      console.warn('⚠️ Could not delete job applicants:', appError.message)
    } else {
      console.log(`✅ Deleted ${appCount} job applicants`)
    }

    // 3. Delete jobs (depends on users)
    console.log('🗑️ Deleting jobs...')
    const { count: jobCount, error: jobError } = await supabase
      .from('jobs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (jobError) {
      console.warn('⚠️ Could not delete jobs:', jobError.message)
    } else {
      console.log(`✅ Deleted ${jobCount} jobs`)
    }

    // 4. Delete users
    console.log('🗑️ Deleting users...')
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (userError) {
      console.warn('⚠️ Could not delete users:', userError.message)
    } else {
      console.log(`✅ Deleted ${userCount} users`)
    }

    // 5. Delete candidate_profiles (depends on users)
    console.log('🗑️ Deleting candidate profiles...')
    const { count: profileCount, error: profileError } = await supabase
      .from('candidate_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (profileError) {
      console.warn('⚠️ Could not delete candidate profiles:', profileError.message)
    } else {
      console.log(`✅ Deleted ${profileCount} candidate profiles`)
    }

    // 6. Delete recruiter_stats
    console.log('🗑️ Deleting recruiter stats...')
    const { count: statsCount, error: statsError } = await supabase
      .from('recruiter_stats')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (statsError) {
      console.warn('⚠️ Could not delete recruiter stats:', statsError.message)
    } else {
      console.log(`✅ Deleted ${statsCount} recruiter stats`)
    }

    console.log('\n✅ Database reset complete!')
    console.log('📝 Next steps:')
    console.log('1. Go to http://localhost:3000/signup')
    console.log('2. Create a new recruiter account')
    console.log('3. Create a new job')
    console.log('4. Share interview link and test the flow')
    console.log('\n🔍 Check data at: http://localhost:3000/debug/data')
    console.log('📊 Check recruiter data at: http://localhost:3000/debug/recruiter')

  } catch (error) {
    console.error('❌ Error resetting database:', error)
    process.exit(1)
  }
}

// Run the reset
resetDatabase()
