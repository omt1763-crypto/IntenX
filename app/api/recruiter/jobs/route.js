import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const recruiterId = searchParams.get('recruiterId')
    
    // Get from auth header if not in params
    const authHeader = req.headers.get('authorization')

    console.log('[RecruiterJobs API] Fetching jobs...')

    // Get all jobs for this recruiter
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (jobsError) {
      console.error('[RecruiterJobs API] Error:', jobsError)
      return NextResponse.json({
        error: jobsError.message,
        data: []
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: jobs || [],
      count: jobs?.length || 0
    })
  } catch (error) {
    console.error('[RecruiterJobs API] Exception:', error)
    return NextResponse.json({
      error: error.message,
      data: []
    }, { status: 500 })
  }
}
