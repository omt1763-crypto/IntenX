import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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

    // Method 1: Get applicant data first
    const { data: applicantData, error: applicantError } = await supabaseAdmin
      .from('job_applicants')
      .select('*')
      .eq('id', applicantId)
      .single()

    if (applicantError) {
      console.error('[InterviewDetail API] Error fetching applicant:', applicantError.message)
    }

    let interviewData = null
    let interviewError = null

    // Method 1a: If applicant has interview_id, use it
    if (applicantData?.interview_id) {
      console.log('[InterviewDetail API] Found interview_id in applicant record:', applicantData.interview_id)
      const result = await supabaseAdmin
        .from('interviews')
        .select('*')
        .eq('id', applicantData.interview_id)
        .single()
      
      interviewData = result.data
      interviewError = result.error
      
      if (interviewData) {
        console.log('[InterviewDetail API] ✅ Found interview via applicant.interview_id')
      }
    }

    // Method 1b: If that fails, search by applicant_id in interviews table
    if (!interviewData && applicantId) {
      console.log('[InterviewDetail API] Trying lookup by applicant_id in interviews table')
      const result = await supabaseAdmin
        .from('interviews')
        .select('*')
        .eq('applicant_id', applicantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      interviewData = result.data
      interviewError = result.error
      
      if (interviewData) {
        console.log('[InterviewDetail API] ✅ Found interview via applicant_id match')
      }
    }

    // Method 2: If still no interview, get all interviews for the job and find the latest
    if (!interviewData && applicantData?.job_id) {
      console.log('[InterviewDetail API] Trying to find interview by job_id for applicant job:', applicantData.job_id)
      const result = await supabaseAdmin
        .from('interviews')
        .select('*')
        .eq('job_id', applicantData.job_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      interviewData = result.data
      
      if (interviewData) {
        console.log('[InterviewDetail API] ✅ Found most recent interview for job')
      }
    }

    // If still nothing found, return error
    if (!interviewData) {
      console.error('[InterviewDetail API] Interview not found after trying all methods')
      console.error('[InterviewDetail API] Applicant data:', applicantData)
      return NextResponse.json(
        { error: 'Interview not found', applicantId, applicantData },
        { status: 404 }
      )
    }

    console.log('[InterviewDetail API] ✅ Interview found:', interviewData.id)

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
