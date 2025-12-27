import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const recruiterId = searchParams.get('recruiterId')

    if (!recruiterId) {
      return NextResponse.json(
        { error: 'Missing recruiterId parameter', data: [] },
        { status: 400 }
      )
    }

    console.log('[GetInterviews API] Fetching interviews for recruiter:', recruiterId)

    // Step 1: Get recruiter's job IDs
    const { data: recruiterJobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('recruiter_id', recruiterId)

    if (jobsError) {
      console.error('[GetInterviews API] Error fetching jobs:', jobsError)
      return NextResponse.json(
        { error: 'Failed to fetch jobs', data: [], success: false },
        { status: 200 }
      )
    }

    const jobIds = recruiterJobs?.map(j => j.id) || []
    console.log('[GetInterviews API] Found job IDs:', jobIds)
    console.log('[GetInterviews API] Total jobs found:', recruiterJobs?.length || 0)

    // Step 2: Get interviews for recruiter's jobs ONLY
    let interviews = []
    
    if (jobIds.length > 0) {
      // Get interviews for recruiter's specific jobs
      console.log('[GetInterviews API] Getting interviews for job IDs:', jobIds)
      const result = await supabaseAdmin
        .from('interviews')
        .select('*')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
      
      interviews = result.data || []
      console.log('[GetInterviews API] Found', interviews.length, 'interviews for recruiter jobs')
      
      if (result.error) {
        console.error('[GetInterviews API] Query error:', result.error)
      }
    } else {
      // No jobs = no interviews
      console.log('[GetInterviews API] No jobs found for recruiter - returning empty interview list')
      interviews = []
    }

    return NextResponse.json({
      success: true,
      data: interviews,
      count: interviews?.length || 0,
      message: `Found ${interviews.length} interviews`
    })
  } catch (error) {
    console.error('[GetInterviews API] Exception:', error)
    return NextResponse.json(
      { 
        error: error.message,
        data: [],
        success: false
      },
      { status: 200 }
    )
  }
}
