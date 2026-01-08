import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        logs: [],
        count: 0,
        error: null
      })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const { data, count, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({
        logs: [],
        count: 0,
        error: error.message
      })
    }

    return NextResponse.json({
      logs: data || [],
      count: count || 0,
      error: null
    })
  } catch (error: any) {
    console.error('[ActivityLogs] Error:', error)
    return NextResponse.json({
      logs: [],
      count: 0,
      error: error.message || 'Failed to load activity logs'
    }, { status: 500 })
  }
}
