import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { applicantData } = await req.json()

    console.log('[CreateApplicant API] Creating applicant:', {
      name: applicantData.name,
      email: applicantData.email,
      jobId: applicantData.job_id,
    })

    // Validate required fields
    if (!applicantData.name || !applicantData.email || !applicantData.job_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, job_id' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(applicantData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create applicant record
    const { data, error } = await supabaseAdmin
      .from('job_applicants')
      .insert([
        {
          id: applicantData.id,
          job_id: applicantData.job_id,
          name: applicantData.name,
          email: applicantData.email,
          position_applied: applicantData.position_applied || '',
          status: applicantData.status || '',
          created_at: applicantData.created_at || new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('[CreateApplicant API] Database error:', error)
      
      // Check if it's a table not found error
      if (error.message && error.message.includes('job_applicants')) {
        console.error('[CreateApplicant API] job_applicants table not found')
        console.log('[CreateApplicant API] ℹ️  Please create the table by running SQL in Supabase dashboard')
        
        return NextResponse.json(
          { 
            error: 'Applicants table not found. Please run the SQL migration.',
            details: 'See CREATE_JOB_APPLICANTS_TABLE.sql file in the project root',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { 
          error: error.message || 'Failed to create applicant',
          details: error.details,
        },
        { status: 500 }
      )
    }

    console.log('[CreateApplicant API] Applicant created successfully:', data.id)

    return NextResponse.json({
      success: true,
      applicant: data,
    }, { status: 201 })
  } catch (error) {
    console.error('[CreateApplicant API] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId query parameter required' },
        { status: 400 }
      )
    }

    console.log('[GetApplicants API] Fetching applicants for job:', jobId)

    // Get applicants for a specific job
    const { data, error } = await supabaseAdmin
      .from('job_applicants')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GetApplicants API] Database error:', error)
      
      // Check if it's a table not found error
      if (error.message && error.message.includes('job_applicants')) {
        console.log('[GetApplicants API] Returning empty list - table not found')
        return NextResponse.json({
          applicants: [],
          count: 0,
          warning: 'job_applicants table not yet created'
        }, { status: 200 })
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to fetch applicants' },
        { status: 500 }
      )
    }

    console.log('[GetApplicants API] Found applicants:', data?.length || 0)

    return NextResponse.json({
      applicants: data || [],
      count: data?.length || 0,
    }, { status: 200 })
  } catch (error) {
    console.error('[GetApplicants API] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req) {
  try {
    const { applicantId, status } = await req.json()

    if (!applicantId || !status) {
      return NextResponse.json({ error: 'applicantId and status are required' }, { status: 400 })
    }

    console.log('[UpdateApplicant API] Updating applicant:', { applicantId, status })

    const { data, error } = await supabaseAdmin
      .from('job_applicants')
      .update({ status })
      .eq('id', applicantId)
      .select()
      .single()

    if (error) {
      console.error('[UpdateApplicant API] Database error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update applicant' }, { status: 500 })
    }

    console.log('[UpdateApplicant API] Applicant updated:', data?.id)

    return NextResponse.json({ success: true, applicant: data }, { status: 200 })
  } catch (error) {
    console.error('[UpdateApplicant API] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
