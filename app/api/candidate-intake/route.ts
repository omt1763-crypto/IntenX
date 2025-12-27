import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const position = formData.get('position') as string
    const jobId = formData.get('jobId') as string
    const resumeFile = formData.get('resume') as File | null

    console.log('[CandidateIntake] Received:', { name, email, phone, position, jobId })

    // Validate required fields
    if (!name || !email || !phone || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Store candidate intake info in database
    const { data, error } = await supabaseAdmin
      .from('candidate_intake')
      .insert([
        {
          name,
          email,
          phone,
          position,
          job_id: jobId,
          resume_filename: resumeFile?.name || null,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('[CandidateIntake] Database error:', error)
      console.error('[CandidateIntake] Error code:', error.code)
      console.error('[CandidateIntake] Error message:', error.message)
      console.error('[CandidateIntake] Error details:', error.details)
      
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database table not set up. Please create the candidate_intake table in Supabase.' 
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { 
          error: error.message || 'Failed to save candidate information',
          details: error.details,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('[CandidateIntake] Candidate saved:', data.id)

    // TODO: Handle resume file upload to storage if needed
    // For now, we're just storing the filename in the database

    return NextResponse.json({
      success: true,
      message: 'Candidate information saved successfully',
      candidateId: data.id
    }, { status: 201 })
  } catch (error) {
    console.error('[CandidateIntake] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
