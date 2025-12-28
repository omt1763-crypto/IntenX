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

    console.log('═'.repeat(80))
    console.log('[GetApplicants API] 📥 Request received')
    console.log('[GetApplicants API] recruiterId:', recruiterId)
    console.log('[GetApplicants API] jobId:', jobId || 'none (fetching all)')

    let query = supabaseAdmin
      .from('job_applicants')
      .select('*, jobs(id, title, company)')

    if (jobId) {
      console.log('[GetApplicants API] Filtering by jobId:', jobId)
      query = query.eq('job_id', jobId)
    } else {
      // Get all applicants for jobs owned by this recruiter
      console.log('[GetApplicants API] Fetching jobs for recruiter:', recruiterId)
      const { data: recruiterJobs, error: jobsError } = await supabaseAdmin
        .from('jobs')
        .select('id, title')
        .eq('recruiter_id', recruiterId)

      if (jobsError) {
        console.error('[GetApplicants API] ❌ Error fetching recruiter jobs:', jobsError)
        return NextResponse.json(
          { 
            error: 'Failed to fetch recruiter jobs',
            data: []
          },
          { status: 200 }
        )
      }

      console.log('[GetApplicants API] Found recruiter jobs:', recruiterJobs?.length || 0, recruiterJobs?.map(j => j.title))
      const jobIds = recruiterJobs?.map(j => j.id) || []
      
      if (jobIds.length === 0) {
        console.log('[GetApplicants API] ⚠️  No jobs found for recruiter:', recruiterId)
        // Return empty applicants list when recruiter has no jobs
        return NextResponse.json({
          success: true,
          data: []
        })
      }

      console.log('[GetApplicants API] Filtering applicants by job IDs:', jobIds)
      query = query.in('job_id', jobIds)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GetApplicants API] ❌ Error fetching applicants:', error)
      console.error('[GetApplicants API] Error code:', error.code)
      console.error('[GetApplicants API] Error message:', error.message)
      return NextResponse.json(
        { 
          error: error.message || 'Failed to fetch applicants',
          code: error.code,
          data: []
        },
        { status: 200 } // Return 200 with empty data on error for graceful degradation
      )
    }

    console.log('[GetApplicants API] ✅ Applicants fetched:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('[GetApplicants API] Applicant details:', data.map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        job_id: a.job_id,
        job_title: a.jobs?.title,
        status: a.status
      })))
    }
    console.log('═'.repeat(80))
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
