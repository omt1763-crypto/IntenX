import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('[AllUsers API] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[AllUsers API] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
