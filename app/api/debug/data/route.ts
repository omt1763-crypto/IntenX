import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic' // Disable caching, always fetch fresh data

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

    console.log('[Admin API] Fetching data from Supabase...')

    // Fetch all data without limit to get complete dataset
    const [usersRes, jobsRes, interviewsRes] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
      supabaseAdmin.from('jobs').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
      supabaseAdmin.from('interviews').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    ])

    // Log for debugging
    console.log('[Admin API] Raw fetch results:', {
      usersCount: usersRes.data?.length,
      jobsCount: jobsRes.data?.length,
      interviewsCount: interviewsRes.data?.length,
      usersError: usersRes.error?.message,
      jobsError: jobsRes.error?.message,
      interviewsError: interviewsRes.error?.message,
      timestamp: new Date().toISOString()
    })

    // Log user IDs for debugging
    if (usersRes.data && usersRes.data.length > 0) {
      console.log('[Admin API] User IDs:', usersRes.data.map(u => ({ id: u.id, email: u.email })))
    }

    // Set response headers to prevent caching
    const response = NextResponse.json({
      users: usersRes.data || [],
      interviews: interviewsRes.data || [],
      jobs: jobsRes.data || [],
      error: null,
      timestamp: new Date().toISOString()
    })
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error: any) {
    console.error('[Admin API] Error loading data:', error)
    return NextResponse.json({
      error: error.message || 'Failed to load data',
      users: [],
      interviews: [],
      jobs: []
    }, { status: 500 })
  }
}
