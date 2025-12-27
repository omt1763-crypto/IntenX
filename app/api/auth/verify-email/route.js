import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * API endpoint to verify an email
 * Supabase handles email verification through the confirmation link in the email
 * This endpoint marks the email as verified in the users table and logs the verification
 */
export async function POST(req) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('[Verify Email API] Marking email as verified for user:', userId)

    // Update the users table to mark email as verified
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('[Verify Email API] Error marking email as verified:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to verify email' },
        { status: 500 }
      )
    }

    console.log('[Verify Email API] Email verified successfully for user:', userId)
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user,
    }, { status: 200 })
  } catch (error) {
    console.error('[Verify Email API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}