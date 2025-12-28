import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const interviewData = await req.json()

    console.log('[SaveInterview API] Saving interview:', {
      userId: interviewData.user_id,
      jobId: interviewData.job_id,
      applicantId: interviewData.applicant_id,
      duration: interviewData.duration,
    })
    console.log('[SaveInterview API] Full data being saved:', JSON.stringify({
      job_id: interviewData.job_id,
      applicant_id: interviewData.applicant_id,
      user_id: interviewData.user_id,
      status: interviewData.status,
      timestamp: interviewData.timestamp
    }, null, 2))

    // Validate required fields
    if (!interviewData.user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      )
    }

    // Ensure JSONB fields are properly formatted
    const cleanData = {
      id: interviewData.id,
      user_id: interviewData.user_id,
      applicant_id: interviewData.applicant_id || null,
      job_id: interviewData.job_id || null,
      interview_type: interviewData.interview_type || 'real',
      title: interviewData.title || 'Technical Interview',
      position: interviewData.position || 'Interview',
      company: interviewData.company || 'Unknown',
      client: interviewData.client || 'Unknown',
      duration: parseInt(interviewData.duration) || 0,
      status: interviewData.status || 'completed',
      timestamp: interviewData.timestamp || new Date().toISOString(),
      skills: Array.isArray(interviewData.skills) ? interviewData.skills : [],
      conversation: Array.isArray(interviewData.conversation) ? interviewData.conversation : [],
      notes: interviewData.notes || '',
      created_at: new Date().toISOString(),
    }

    console.log('[SaveInterview API] Clean data to insert:', JSON.stringify(cleanData, null, 2))

    // Save interview using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('interviews')
      .insert([cleanData])
      .select()
      .single()

    if (error) {
      console.error('[SaveInterview API] Full error object:', JSON.stringify(error, null, 2))
      console.error('[SaveInterview API] Error message:', error.message)
      console.error('[SaveInterview API] Error code:', error.code)
      console.error('[SaveInterview API] Error details:', error.details)
      
      // Check if it's a table missing error (specific check for "does not exist")
      if (error.message && (error.message.includes('does not exist') || error.code === '42P01')) {
        console.error('[SaveInterview API] Table does not exist')
        return NextResponse.json(
          { 
            error: 'Interviews table not set up. Please run the table creation SQL.',
            code: 'TABLE_MISSING'
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { 
          error: error.message || 'Failed to save interview',
          code: error.code,
          details: error.details || error,
          fullError: JSON.stringify(error)
        },
        { status: 400 }
      )
    }

    console.log('[SaveInterview API] Interview saved successfully:', data.id)
    console.log('[SaveInterview API] Saved interview with job_id:', data.job_id, 'applicant_id:', data.applicant_id)
    
    // Handle applicant record
    if (cleanData.applicant_id) {
      // If we have an applicant ID, update it
      const { error: updateError } = await supabaseAdmin
        .from('job_applicants')
        .update({
          interview_id: data.id,
          status: 'completed'
        })
        .eq('id', cleanData.applicant_id)

      if (updateError) {
        console.error('[SaveInterview API] Error updating applicant:', updateError)
      } else {
        console.log('[SaveInterview API] Applicant updated with interview_id:', data.id)
      }
    } else if (cleanData.job_id) {
      // If no applicant ID but we have a job_id, create an applicant record
      console.log('[SaveInterview API] No applicant ID provided, creating new applicant record for job:', cleanData.job_id)
      
      const { data: newApplicant, error: createError } = await supabaseAdmin
        .from('job_applicants')
        .insert([
          {
            job_id: cleanData.job_id,
            name: cleanData.position || 'Interview Candidate',
            email: cleanData.company || 'candidate@example.com',
            phone: null,
            position_applied: cleanData.position || 'Unknown Position',
            resume_url: null,
            interview_id: data.id,
            status: 'completed',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error('[SaveInterview API] Error creating applicant record:', createError)
        console.error('[SaveInterview API] Error code:', createError.code)
        console.error('[SaveInterview API] Error message:', createError.message)
      } else {
        console.log('[SaveInterview API] ✅ New applicant created for interview:', newApplicant?.id)
        
        // NOW UPDATE THE INTERVIEW WITH THE NEW APPLICANT ID
        if (newApplicant?.id) {
          const { error: updateInterviewError } = await supabaseAdmin
            .from('interviews')
            .update({
              applicant_id: newApplicant.id
            })
            .eq('id', data.id)
          
          if (updateInterviewError) {
            console.error('[SaveInterview API] Error linking interview to applicant:', updateInterviewError)
          } else {
            console.log('[SaveInterview API] ✅ Interview linked to applicant:', newApplicant.id)
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Interview saved successfully'
    })
  } catch (error) {
    console.error('[SaveInterview API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const jobId = searchParams.get('jobId')

    console.log('[GetInterviews API] Request received:', { userId, jobId })

    if (!userId && !jobId) {
      return NextResponse.json(
        { error: 'Missing userId or jobId parameter' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('interviews')
      .select('*')

    if (userId) {
      query = query.eq('user_id', userId)
      console.log('[GetInterviews API] Querying by userId:', userId)
    }
    if (jobId) {
      query = query.eq('job_id', jobId)
      console.log('[GetInterviews API] Querying by jobId:', jobId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    console.log('[GetInterviews API] Supabase query completed')
    console.log('[GetInterviews API] Returned rows:', data?.length || 0)
    
    if (error) {
      console.error('[GetInterviews API] Supabase error:', error.message)
      console.error('[GetInterviews API] Error code:', error.code)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch interviews', code: error.code },
        { status: 400 }
      )
    }

    console.log('[GetInterviews API] ✅ Success: returning', data?.length || 0, 'interviews')
    
    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('[GetInterviews API] Catch block error:', error.message)
    console.error('[GetInterviews API] Full error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
