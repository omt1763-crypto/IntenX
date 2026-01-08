import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        error: 'Supabase not configured',
        users: [],
        interviews: [],
        jobs: []
      })
    }

    const [usersRes, interviewsRes, jobsRes] = await Promise.all([
      supabaseAdmin.from('users').select('*').limit(100),
      supabaseAdmin.from('interviews').select('*').limit(100),
      supabaseAdmin.from('jobs').select('*').limit(100)
    ])

    return NextResponse.json({
      users: usersRes.data || [],
      interviews: interviewsRes.data || [],
      jobs: jobsRes.data || [],
      error: null
    })
  } catch (error: any) {
    console.error('[Admin] Error loading data:', error)
    return NextResponse.json({
      error: error.message || 'Failed to load data',
      users: [],
      interviews: [],
      jobs: []
    }, { status: 500 })
  }
}
