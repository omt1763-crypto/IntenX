import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/debug/user/[userId]/clear-data - Clear user's data but keep account
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId

    console.log('[Debug API] Clearing user data:', userId)

    // Delete user's interviews
    await supabaseAdmin
      .from('interviews')
      .delete()
      .eq('user_id', userId)

    // Delete user's jobs
    const { data: userJobs } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('recruiter_id', userId)

    if (userJobs && userJobs.length > 0) {
      const jobIds = userJobs.map(j => j.id)
      
      // Delete applicants for those jobs
      await supabaseAdmin
        .from('candidate_intake')
        .delete()
        .in('job_id', jobIds)

      // Delete jobs
      await supabaseAdmin
        .from('jobs')
        .delete()
        .eq('recruiter_id', userId)
    }

    // Delete user's applicant records
    await supabaseAdmin
      .from('candidate_intake')
      .delete()
      .eq('user_id', userId)

    console.log('[Debug API] User data cleared successfully:', userId)

    return NextResponse.json({
      success: true,
      message: 'User data cleared successfully'
    })
  } catch (error: any) {
    console.error('[Debug API] Error clearing user data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to clear user data'
      },
      { status: 500 }
    )
  }
}
