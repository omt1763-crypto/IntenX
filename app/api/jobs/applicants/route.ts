import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const recruiterId = searchParams.get('recruiterId')

    if (!jobId || !recruiterId) {
      return NextResponse.json(
        { error: 'jobId and recruiterId are required' },
        { status: 400 }
      )
    }

    // Fetch applicants from candidate_intake table
    const { data: applicants, error } = await supabase
      .from('candidate_intake')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Applicants API] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applicants' },
        { status: 500 }
      )
    }

    // Calculate analysis for each applicant
    const applicantsWithAnalysis = (applicants || []).map((applicant: any) => {
      return {
        ...applicant,
        analysis: {
          hasResume: !!applicant.resume_url,
          appliedAt: applicant.created_at,
          status: applicant.interview_completed ? 'completed' : 'pending'
        }
      }
    })

    return NextResponse.json({
      success: true,
      applicants: applicantsWithAnalysis,
      total: applicantsWithAnalysis.length
    })
  } catch (err) {
    console.error('[Applicants API] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
