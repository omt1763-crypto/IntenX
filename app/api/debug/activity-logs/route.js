import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*, user:users(id, first_name, last_name, email, role)', { count: 'exact' })

    if (action && action !== 'all') {
      query = query.eq('action', action)
    }
    if (userId && userId !== 'all') {
      query = query.eq('user_id', userId)
    }

    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[ActivityLogs API] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      logs,
      count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('[ActivityLogs API] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
