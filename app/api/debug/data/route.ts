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

    // Fetch all data without limit to get complete dataset
    const [usersRes, jobsRes, interviewsRes] = await Promise.all([
      supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('jobs').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('interviews').select('*').order('created_at', { ascending: false })
    ])

    // Log for debugging
    console.log('[Admin] Data fetch results:', {
      users: usersRes.data?.length,
      interviews: interviewsRes.data?.length || 0,
      jobs: jobsRes.data?.length,
      usersError: usersRes.error,
      interviewsError: interviewsRes?.error,
      jobsError: jobsRes.error
    })

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
