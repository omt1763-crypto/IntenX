import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Check if user has reached their 2 free interview limit
 * Free users get 2 interviews, then must subscribe
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    console.log('[CheckInterviewLimit API] Checking limit for user:', userId)

    // Get count of completed interviews for this user
    const { data: interviews, error: queryError, count } = await supabase
      .from('interviews')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .in('status', ['completed', 'submitted']) // Only count finished interviews

    if (queryError) {
      console.error('[CheckInterviewLimit API] Database error:', queryError)
      // If error, allow the interview (fail open)
      return NextResponse.json({
        canContinue: true,
        interviewCount: 0,
        freeInterviewsRemaining: 2,
        message: 'Interview limit check failed, proceeding with interview'
      })
    }

    const completedCount = count || 0
    const freeLimit = 2
    const freeInterviewsRemaining = Math.max(0, freeLimit - completedCount)
    const canContinue = completedCount < freeLimit

    console.log('[CheckInterviewLimit API] User stats:', {
      userId,
      completedCount,
      freeLimit,
      freeInterviewsRemaining,
      canContinue
    })

    // Check if user has active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('subscription_type, subscription_status')
      .eq('user_id', userId)
      .single()

    const hasActiveSubscription = subscription?.subscription_status === 'active'

    if (canContinue || hasActiveSubscription) {
      return NextResponse.json({
        canContinue: true,
        interviewCount: completedCount,
        freeInterviewsRemaining,
        hasSubscription: !!hasActiveSubscription,
        message: `You have ${freeInterviewsRemaining} free interviews remaining` +
          (hasActiveSubscription ? ' (or unlimited with subscription)' : '')
      })
    }

    // User has reached limit and no subscription
    return NextResponse.json(
      {
        canContinue: false,
        interviewCount: completedCount,
        freeInterviewsRemaining: 0,
        hasSubscription: false,
        planName: 'Free Plan',
        remainingInterviews: 0,
        message: `You've completed your ${freeLimit} free interviews. Upgrade to a paid plan for unlimited interviews.`
      },
      { status: 403 }
    )
  } catch (error) {
    console.error('[CheckInterviewLimit API] Error:', error)
    // Fail open - allow interview if there's an error
    return NextResponse.json({
      canContinue: true,
      interviewCount: 0,
      freeInterviewsRemaining: 2,
      message: 'Unable to verify interview limit, proceeding with interview'
    })
  }
}
