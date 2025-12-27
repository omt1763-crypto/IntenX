import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// DELETE /api/debug/user/[userId] - Delete user and all associated data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId

    console.log('[Debug API] Deleting user:', userId)

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

    // Delete user's subscriptions
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)

    // Delete from auth
    await supabaseAdmin.auth.admin.deleteUser(userId)

    // Delete user profile
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    console.log('[Debug API] User deleted successfully:', userId)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('[Debug API] Error deleting user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete user'
      },
      { status: 500 }
    )
  }
}

// PATCH /api/debug/user/[userId] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId
    const body = await request.json()

    console.log('[Debug API] Updating user:', userId, body)

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(body)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log('[Debug API] User updated successfully:', userId)

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('[Debug API] Error updating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update user'
      },
      { status: 500 }
    )
  }
}
