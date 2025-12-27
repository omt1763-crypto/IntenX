import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const recruiterId = searchParams.get('recruiterId')

    if (!recruiterId) {
      return NextResponse.json({ error: 'Missing recruiterId', success: false }, { status: 400 })
    }

    console.log('[JobsSummary API] Fetching summary for recruiter:', recruiterId)

    // Get jobs
    const { data: jobsData, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (jobsError) {
      console.error('[JobsSummary API] Jobs error:', jobsError)
    }    const jobIds = (jobsData || []).map(j => j.id).filter(Boolean)

    // Get applicants: ONLY for this recruiter's jobs
    let applicants = []
    if (jobIds.length > 0) {
      const { data: appsData, error: appsError } = await supabaseAdmin
        .from('job_applicants')
        .select('*')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })

      if (appsError) console.error('[JobsSummary API] Applicants error:', appsError)
      applicants = appsData || []
    }
    // If no jobs, return empty applicants list (don't fetch all system applicants)

    // Get interviews: ONLY for this recruiter's jobs (don't include legacy interviews without job_id)
    let interviews = []
    
    if (jobIds.length > 0) {
      const { data: ivs, error: ivErr } = await supabaseAdmin
        .from('interviews')
        .select('*')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })

      if (ivErr) console.error('[JobsSummary API] Interviews error:', ivErr)
      interviews = ivs || []
    }
    // Note: We do NOT fetch legacy interviews (without job_id) - they don't belong to this recruiter
    
    // If no interviews found via job_id OR no jobs, try to fetch via applicant_id
    if ((interviews.length === 0 || jobIds.length === 0) && applicants.length > 0) {
      const applicantIds = applicants.map(a => a.id).filter(Boolean)
      if (applicantIds.length > 0) {
        console.log('[JobsSummary API] Fetching interviews via applicant_id for', applicantIds.length, 'applicants')
        const { data: ivs, error: ivErr } = await supabaseAdmin
          .from('interviews')
          .select('*')
          .in('applicant_id', applicantIds)
          .order('created_at', { ascending: false })

        if (ivErr) {
          console.warn('[JobsSummary API] Interviews via applicant_id error:', ivErr)
          // If that fails too, just skip interviews - they're not critical for the summary
        }
        interviews = [...(interviews || []), ...(ivs || [])]
      }
    }

    // Build counts
    const applicantCountByJob = {}
    applicants.forEach(a => {
      if (!a || !a.job_id) return
      applicantCountByJob[a.job_id] = (applicantCountByJob[a.job_id] || 0) + 1
    })

    const interviewCountByJob = {}
    interviews.forEach(i => {
      if (!i || !i.job_id) return
      interviewCountByJob[i.job_id] = (interviewCountByJob[i.job_id] || 0) + 1
    })

    const jobs = (jobsData || []).map(j => ({
      ...j,
      applicant_count: applicantCountByJob[j.id] || 0,
      interview_count: interviewCountByJob[j.id] || 0
    }))

    // Count applicant statuses (shortlisted, rejected, pending, accepted)
    const applicationStats = { pending: 0, shortlisted: 0, rejected: 0, accepted: 0 }
    applicants.forEach(a => {
      const s = (a && a.status) || 'pending'
      if (applicationStats.hasOwnProperty(s)) {
        applicationStats[s]++
      } else {
        applicationStats.pending++
      }
    })

    // Compute jobs created this month and percent of total
    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const jobsThisMonth = (jobsData || []).filter(j => {
      try {
        const d = new Date(j.created_at)
        return d >= startOfThisMonth && d < startOfNextMonth
      } catch (e) {
        return false
      }
    }).length

    const totalJobs = (jobsData || []).length
    const jobPercentOfTotal = totalJobs > 0 ? Math.round((jobsThisMonth / totalJobs) * 100) : 0

    const resp = {
      success: true,
      jobs,
      totalJobs,
      totalApplicants: applicants.length,
      totalInterviews: interviews.length,
      applicationStats,
      totalShortlisted: applicationStats.shortlisted || 0,
      jobsThisMonth,
      jobPercentOfTotal
    }

    return NextResponse.json(resp)
  } catch (error) {
    console.error('[JobsSummary API] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
