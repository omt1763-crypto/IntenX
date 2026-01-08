import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ applications: [], error: null })
    }

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    // Try multiple possible table names for applications/job_applicants
    let data = null
    let error = null
    let count = 0

    // Try 'job_applications' first
    let result = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!result.error) {
      data = result.data
      count = result.count || 0
      error = null
    } else {
      // Try 'applications' table
      result = await supabaseAdmin
        .from('applications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (!result.error) {
        data = result.data
        count = result.count || 0
        error = null
      } else {
        // Try 'job_applicants' table
        result = await supabaseAdmin
          .from('job_applicants')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        data = result.data
        count = result.count || 0
        error = result.error?.message || null
      }
    }

    return NextResponse.json({ 
      applications: data || [], 
      count: count || 0, 
      error 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      applications: [], 
      count: 0, 
      error: error.message 
    }, { status: 500 })
  }
}
