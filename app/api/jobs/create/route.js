import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(req) {
  try {
    const { jobData, userId } = await req.json()

    console.log('[CreateJob API] Request received:', {
      userId,
      jobTitle: jobData.title,
      jobId: jobData.id,
    })

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (!jobData.id || !jobData.title) {
      return NextResponse.json(
        { error: 'Missing required job fields' },
        { status: 400 }
      )
    }

    // Check job creation limit (3 free jobs)
    const { data: jobsData, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('recruiter_id', userId)
      .eq('status', 'open')

    if (jobsError) {
      console.error('[CreateJob API] Error checking job count:', jobsError)
      return NextResponse.json(
        { error: 'Failed to check job limit' },
        { status: 500 }
      )
    }

    const currentJobCount = jobsData?.length || 0
    const jobLimit = 3
    const maxJobsReached = currentJobCount >= jobLimit

    // If limit reached, check for active subscription
    if (maxJobsReached) {
      const { data: subscriptionData, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (!subscriptionData) {
        return NextResponse.json(
          {
            error: 'Job creation limit reached',
            message: `You've reached the free limit of ${jobLimit} job postings. Please upgrade your subscription to create more jobs.`,
            limitReached: true,
            currentJobs: currentJobCount,
            jobLimit: jobLimit,
          },
          { status: 403 }
        )
      }
    }

    // Ensure recruiter_id matches the authenticated user
    const jobToInsert = {
      id: jobData.id,
      recruiter_id: userId, // Force this to the authenticated user
      title: jobData.title,
      company: jobData.company || jobData.title,
      description: jobData.description || '',
      required_skills: jobData.required_skills || [],
      status: jobData.status || 'open',
      created_at: jobData.created_at || new Date().toISOString(),
    }

    console.log('[CreateJob API] Inserting job with recruiter_id:', userId)

    // Use service role key to bypass RLS for server-side operations
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert([jobToInsert])
      .select()
      .single()

    if (error) {
      console.error('[CreateJob API] Database error:', error)
      return NextResponse.json(
        { 
          error: error.message || 'Failed to create job',
          details: error.details,
          code: error.code,
        },
        { status: 500 }
      )
    }

    console.log('[CreateJob API] Job created successfully:', data.id)

    return NextResponse.json({
      success: true,
      job: data,
      message: 'Job created successfully',
      jobsCreated: currentJobCount + 1,
      jobLimit: jobLimit,
    }, { status: 201 })
  } catch (error) {
    console.error('[CreateJob API] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
