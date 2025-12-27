import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const response = {
    loading: false,
    env: { ok: false },
    connection: { ok: false },
    table: { ok: false },
    ready: false
  }

  try {
    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (url && anonKey && serviceKey) {
      response.env.ok = true
    } else {
      response.env.message = 'Missing Supabase credentials in environment'
      return NextResponse.json(response)
    }

    // Check Supabase connection
    try {
      const supabase = createClient(url, anonKey)
      const { data: session } = await supabase.auth.getSession()
      response.connection.ok = true
    } catch (error) {
      response.connection.message = error.message
      return NextResponse.json(response)
    }

    // Check users table
    try {
      const supabase = createClient(url, serviceKey)
      const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact' }).limit(1)

      if (error && error.code === 'PGRST116') {
        response.table.message = 'Table not found - needs to be created'
        response.table.ok = false
      } else if (error) {
        response.table.message = error.message
        response.table.ok = false
      } else {
        response.table.ok = true
        response.table.message = 'Table exists'
      }
    } catch (error) {
      response.table.message = error.message
    }

    // Overall readiness
    response.ready = response.env.ok && response.connection.ok && response.table.ok

    return NextResponse.json(response)
  } catch (error) {
    response.error = error.message
    return NextResponse.json(response, { status: 500 })
  }
}
