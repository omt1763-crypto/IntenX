import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * This endpoint helps fix interviews that don't have job_id values
 * It can either:
 * 1. GET - show diagnostics of the issue
 * 2. POST - attempt to link interviews to jobs based on applicant data
 */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const recruiterId = searchParams.get('recruiterId')

    if (!recruiterId) {
      return NextResponse.json(
        { error: 'Missing recruiterId parameter' },
        { status: 400 }
      )
    }

    console.log('[FixInterviewJobIds] Diagnostic check for recruiter:', recruiterId)

    // Get recruiter's jobs
    const { data: recruiterJobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title')
      .eq('recruiter_id', recruiterId)

    const jobIds = recruiterJobs?.map(j => j.id) || []
    console.log('[FixInterviewJobIds] Recruiter has', jobIds.length, 'jobs')

    // Get interviews WITH job_id
    const { data: interviewsWithJobId } = await supabaseAdmin
      .from('interviews')
      .select('id, created_at, job_id')
      .in('job_id', jobIds.length > 0 ? jobIds : ['null'])
      .order('created_at', { ascending: false })

    // Get interviews WITHOUT job_id
    const { data: interviewsNoJobId } = await supabaseAdmin
      .from('interviews')
      .select('id, applicant_id, user_id, created_at')
      .is('job_id', null)
      .limit(100) // Limit for performance

    console.log('[FixInterviewJobIds] Found', interviewsWithJobId?.length || 0, 'interviews WITH job_id')
    console.log('[FixInterviewJobIds] Found', interviewsNoJobId?.length || 0, 'interviews WITHOUT job_id')

    // Try to find applicant info for interviews without job_id
    const diagnostics = {
      recruiter_id: recruiterId,
      total_jobs: jobIds.length,
      jobs: recruiterJobs,
      interviews_with_job_id: interviewsWithJobId?.length || 0,
      interviews_without_job_id: interviewsNoJobId?.length || 0,
      sample_no_job_id: interviewsNoJobId?.slice(0, 5) || [],
      recommendation: interviewsNoJobId && interviewsNoJobId.length > 0
        ? `Found ${interviewsNoJobId.length} interviews missing job_id. These are likely from old interviews. Need manual linking or batch update.`
        : 'All interviews have job_id. No issues found.'
    }

    return NextResponse.json({
      success: true,
      diagnostics
    })
  } catch (error) {
    console.error('[FixInterviewJobIds] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const { recruiterId, applicantId, jobId } = await req.json()

    if (!recruiterId || !jobId) {
      return NextResponse.json(
        { error: 'Missing recruiterId or jobId' },
        { status: 400 }
      )
    }

    console.log('[FixInterviewJobIds] Attempting to link interviews for recruiter:', recruiterId)
    console.log('[FixInterviewJobIds] jobId:', jobId)

    // If applicantId is provided, update just that interview
    if (applicantId) {
      const { data, error } = await supabaseAdmin
        .from('interviews')
        .update({ job_id: jobId })
        .eq('applicant_id', applicantId)
        .is('job_id', null)
        .select()

      if (error) {
        console.error('[FixInterviewJobIds] Error updating:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${data?.length || 0} interview(s)`,
        updated: data
      })
    }

    // Otherwise, find all interviews without job_id and try to link them based on applicant data
    // This is more complex and should be done carefully
    const { data: noJobIdInterviews, error: fetchError } = await supabaseAdmin
      .from('interviews')
      .select('id, applicant_id')
      .is('job_id', null)
      .limit(50)

    if (fetchError) {
      console.error('[FixInterviewJobIds] Fetch error:', fetchError)
      return NextResponse.json(
        { error: fetchError.message },
        { status: 400 }
      )
    }

    console.log('[FixInterviewJobIds] Found', noJobIdInterviews?.length || 0, 'interviews to update')

    if (!noJobIdInterviews || noJobIdInterviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No interviews to update'
      })
    }

    // Batch update all with the provided jobId
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('interviews')
      .update({ job_id: jobId })
      .is('job_id', null)
      .limit(50)
      .select()

    if (updateError) {
      console.error('[FixInterviewJobIds] Batch update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated?.length || 0} interviews with job_id: ${jobId}`,
      updated_count: updated?.length || 0
    })
  } catch (error) {
    console.error('[FixInterviewJobIds] Exception:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
