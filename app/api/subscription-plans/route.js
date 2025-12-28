import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    // Get all active subscription plans
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (plansError) {
      throw plansError
    }

    // Get user's current subscription if userId provided
    let userSubscription = null
    if (userId) {
      const { data: sub } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*, subscription_plans(name, interview_limit)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (sub) {
        userSubscription = sub
      }
    }

    return NextResponse.json({
      success: true,
      plans: plans || [],
      currentSubscription: userSubscription
    })
  } catch (error) {
    console.error('[Get Plans] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
