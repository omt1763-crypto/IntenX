import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/debug/clear-jobs - Delete ALL jobs
export async function POST(request: NextRequest) {
  try {
    console.log('[Debug API] Clearing all jobs...')

    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .gte('created_at', '1970-01-01')

    if (error) {
      console.error('[Debug API] Error deleting jobs:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message
        },
        { status: 500 }
      )
    }

    console.log('[Debug API] All jobs cleared successfully')

    return NextResponse.json({
      success: true,
      message: 'All jobs cleared successfully'
    })
  } catch (error: any) {
    console.error('[Debug API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to clear jobs'
      },
      { status: 500 }
    )
  }
}
