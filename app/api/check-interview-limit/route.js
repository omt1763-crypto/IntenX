import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*, subscription_plans(name, interview_limit)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    let planName = 'Free Trial'
    let interviewLimit = 2

    // If no subscription, create free trial
    if (!subscription && !subError) {
      const { data: freePlan } = await supabaseAdmin
        .from('subscription_plans')
        .select('id')
        .eq('name', 'Free Trial')
        .single()

      if (freePlan) {
        await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: freePlan.id,
            status: 'active'
          })
          .on('*', (payload) => {
            console.log('[Check Limit] Auto-created free trial')
          })
      }
    } else if (subscription) {
      planName = subscription.subscription_plans.name
      interviewLimit = subscription.subscription_plans.interview_limit
    }

    // Count interviews used
    const { count: interviewCount } = await supabaseAdmin
      .from('interview_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    const usedInterviews = interviewCount || 0
    const remainingInterviews = Math.max(0, interviewLimit - usedInterviews)
    const canContinue = usedInterviews < interviewLimit

    console.log(`[Check Limit] User: ${userId}`)
    console.log(`  Plan: ${planName}`)
    console.log(`  Interviews Used: ${usedInterviews}/${interviewLimit}`)
    console.log(`  Can Continue: ${canContinue}`)

    return NextResponse.json({
      success: true,
      canContinue,
      planName,
      interviewCount: usedInterviews,
      interviewLimit,
      remainingInterviews,
      message: canContinue 
        ? `${remainingInterviews} interview${remainingInterviews !== 1 ? 's' : ''} remaining`
        : 'Interview limit reached. Please upgrade your subscription.'
    })
  } catch (error) {
    console.error('[Check Limit] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
