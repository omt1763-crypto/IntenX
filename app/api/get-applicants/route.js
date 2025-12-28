import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const recruiterId = searchParams.get('recruiterId')

    if (!recruiterId) {
      return NextResponse.json(
        { error: 'Missing recruiterId parameter' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('job_applicants')
      .select('*, jobs(id, title, company)')

    if (jobId) {
      query = query.eq('job_id', jobId)
    } else {
      // Get all applicants for jobs owned by this recruiter
      const { data: recruiterJobs, error: jobsError } = await supabaseAdmin
        .from('jobs')
        .select('id')
        .eq('recruiter_id', recruiterId)

      if (jobsError) {
        console.error('[GetApplicants API] Error fetching recruiter jobs:', jobsError)
        return NextResponse.json(
          { 
            error: 'Failed to fetch recruiter jobs',
            data: []
          },
          { status: 200 }
        )
      }      const jobIds = recruiterJobs?.map(j => j.id) || []
      if (jobIds.length === 0) {
        console.log('[GetApplicants API] No jobs found for recruiter:', recruiterId)
        // Return empty applicants list when recruiter has no jobs
        return NextResponse.json({
          success: true,
          data: []
        })
      }

      query = query.in('job_id', jobIds)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GetApplicants API] Error fetching applicants:', error)
      return NextResponse.json(
        { 
          error: error.message || 'Failed to fetch applicants',
          code: error.code,
          data: []
        },
        { status: 200 } // Return 200 with empty data on error for graceful degradation
      )
    }

    console.log('[GetApplicants API] Applicants fetched:', data?.length || 0)
    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('[GetApplicants API] Error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        data: []
      },
      { status: 200 }
    )
  }
}
