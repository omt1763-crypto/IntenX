import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * API endpoint to get jobs summary for a business/recruiter
 * Returns aggregated data about jobs including counts and statistics
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const recruiterId = searchParams.get('recruiterId')

    if (!recruiterId) {
      return NextResponse.json(
        { error: 'Missing recruiterId parameter', success: false },
        { status: 400 }
      )
    }

    console.log('[Jobs Summary API] Fetching summary for recruiter:', recruiterId)

    // Get all jobs for this recruiter
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('id, status, created_at')
      .eq('recruiter_id', recruiterId)

    if (jobsError) {
      console.error('[Jobs Summary API] Error fetching jobs:', jobsError)
      return NextResponse.json(
        { error: 'Failed to fetch jobs', success: false },
        { status: 500 }
      )
    }

    const jobIds = jobs?.map(j => j.id) || []
    const totalJobs = jobs?.length || 0

    // Count jobs by status
    const openJobs = jobs?.filter(j => j.status === 'open')?.length || 0
    const closedJobs = jobs?.filter(j => j.status === 'closed')?.length || 0
    const onHoldJobs = jobs?.filter(j => j.status === 'on-hold')?.length || 0

    // Get interview count for these jobs
    let totalInterviews = 0
    if (jobIds.length > 0) {
      const { data: interviews, error: interviewsError } = await supabaseAdmin
        .from('interviews')
        .select('id')
        .in('job_id', jobIds)

      if (!interviewsError) {
        totalInterviews = interviews?.length || 0
      }
    }

    // Get applicant count
    let totalApplicants = 0
    if (jobIds.length > 0) {
      const { data: applicants, error: applicantsError } = await supabaseAdmin
        .from('job_applicants')
        .select('id')
        .in('job_id', jobIds)

      if (!applicantsError) {
        totalApplicants = applicants?.length || 0
      }
    }

    console.log('[Jobs Summary API] Summary - Total Jobs:', totalJobs, 'Interviews:', totalInterviews, 'Applicants:', totalApplicants)

    return NextResponse.json({
      success: true,
      data: {
        totalJobs,
        openJobs,
        closedJobs,
        onHoldJobs,
        totalInterviews,
        totalApplicants,
        recentJobs: jobs?.slice(0, 5) || []
      }
    }, { status: 200 })
  } catch (error) {
    console.error('[Jobs Summary API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}
