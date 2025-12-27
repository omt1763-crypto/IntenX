import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req) {
  try {
    console.log('[ResetDatabase API] ⚠️ RESET REQUEST - Starting database reset')

    // Delete in order of dependencies (foreign keys)
    
    // 1. Delete interviews
    console.log('[ResetDatabase API] Deleting interviews...')
    const { error: intError } = await supabaseAdmin
      .from('interviews')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (intError) console.warn('[ResetDatabase API] Interviews error:', intError.message)

    // 2. Delete job_applicants
    console.log('[ResetDatabase API] Deleting job applicants...')
    const { error: appError } = await supabaseAdmin
      .from('job_applicants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (appError) console.warn('[ResetDatabase API] Job applicants error:', appError.message)

    // 3. Delete jobs
    console.log('[ResetDatabase API] Deleting jobs...')
    const { error: jobError } = await supabaseAdmin
      .from('jobs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (jobError) console.warn('[ResetDatabase API] Jobs error:', jobError.message)

    // 4. Delete users
    console.log('[ResetDatabase API] Deleting users...')
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (userError) console.warn('[ResetDatabase API] Users error:', userError.message)

    // 5. Delete candidate_profiles
    console.log('[ResetDatabase API] Deleting candidate profiles...')
    const { error: profileError } = await supabaseAdmin
      .from('candidate_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (profileError) console.warn('[ResetDatabase API] Candidate profiles error:', profileError.message)

    // 6. Delete recruiter_stats
    console.log('[ResetDatabase API] Deleting recruiter stats...')
    const { error: statsError } = await supabaseAdmin
      .from('recruiter_stats')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (statsError) console.warn('[ResetDatabase API] Recruiter stats error:', statsError.message)

    console.log('[ResetDatabase API] ✅ Database reset complete')

    return NextResponse.json({
      success: true,
      message: 'Database reset successfully',
      nextSteps: [
        'Go to http://localhost:3000/signup',
        'Create a new recruiter account',
        'Create a new job',
        'Share interview link and test'
      ]
    })

  } catch (error) {
    console.error('[ResetDatabase API] ❌ Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}
