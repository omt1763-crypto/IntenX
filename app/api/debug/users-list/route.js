import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req) {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, role')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[UsersList API] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[UsersList API] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
