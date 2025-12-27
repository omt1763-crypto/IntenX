import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req) {
  try {
    const { userId, interviewId } = await req.json()

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // First check if user can continue
    const checkRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/check-interview-limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    const checkData = await checkRes.json()

    if (!checkData.canContinue) {
      return NextResponse.json({
        success: false,
        error: 'Interview limit reached',
        message: checkData.message,
        canContinue: false
      }, { status: 403 })
    }

    // Record the interview usage
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('interview_usage')
      .insert({
        user_id: userId,
        interview_id: interviewId
      })
      .select()

    if (usageError) {
      throw usageError
    }

    console.log(`[Record Usage] Recorded interview for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Interview recorded successfully',
      remainingInterviews: checkData.remainingInterviews - 1
    })
  } catch (error) {
    console.error('[Record Usage] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
