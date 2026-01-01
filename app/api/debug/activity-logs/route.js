import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    // Verify admin access via debug password
    const debugPassword = req.headers.get('x-debug-password')
    if (debugPassword !== 'admin@123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' })

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
      return NextResponse.json({ error: error.message, details: error }, { status: 400 })
    }

    // Fetch user details for each log
    const enrichedLogs = await Promise.all(
      (logs || []).map(async (log) => {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, email, role')
          .eq('id', log.user_id)
          .single()

        return {
          ...log,
          user: user || { id: log.user_id, first_name: null, last_name: null, email: null, role: null }
        }
      })
    )

    return NextResponse.json({
      logs: enrichedLogs || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('[ActivityLogs API] Exception:', error.message, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
