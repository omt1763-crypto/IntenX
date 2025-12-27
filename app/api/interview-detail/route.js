import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const applicantId = searchParams.get('applicantId')

    if (!applicantId) {
      return NextResponse.json(
        { error: 'Missing applicantId parameter' },
        { status: 400 }
      )
    }

    console.log('[InterviewDetail API] Fetching interview for applicant:', applicantId)

    // First get applicant data
    const { data: applicantData, error: applicantError } = await supabaseAdmin
      .from('job_applicants')
      .select('*')
      .eq('id', applicantId)
      .single()

    if (applicantError) {
      console.error('[InterviewDetail API] Error fetching applicant:', applicantError)
    }

    // Get interview data by applicant_id
    const { data: interviewData, error: interviewError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('applicant_id', applicantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (interviewError) {
      console.error('[InterviewDetail API] Error fetching interview:', interviewError)
      return NextResponse.json(
        { 
          error: 'Interview not found',
          code: interviewError.code,
          message: interviewError.message
        },
        { status: 404 }
      )
    }

    if (!interviewData) {
      console.log('[InterviewDetail API] No interview found for applicant:', applicantId)
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }

    console.log('[InterviewDetail API] Interview found:', interviewData.id)

    return NextResponse.json({
      success: true,
      data: {
        id: interviewData.id,
        name: applicantData?.name || 'Candidate Interview',
        email: applicantData?.email || interviewData.client || 'Unknown',
        position: applicantData?.position_applied || interviewData.position || 'Unknown',
        job_id: interviewData.job_id,
        duration: interviewData.duration || 0,
        timestamp: interviewData.timestamp || interviewData.created_at,
        skills: interviewData.skills || [],
        conversation: interviewData.conversation || [],
        notes: interviewData.notes || '',
        analysis: interviewData.analysis || null,
        applicantInfo: {
          name: applicantData?.name,
          email: applicantData?.email,
          position_applied: applicantData?.position_applied,
          applied_on: applicantData?.created_at,
          status: applicantData?.status
        }
      }
    })
  } catch (error) {
    console.error('[InterviewDetail API] Error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
