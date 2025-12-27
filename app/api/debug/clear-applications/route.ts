import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/debug/clear-applications - Delete ALL applications
export async function POST(request: NextRequest) {
  try {
    console.log('[Debug API] Clearing all applications...')

    const { error } = await supabaseAdmin
      .from('job_applicants')
      .delete()
      .gte('created_at', '1970-01-01')

    if (error) {
      console.error('[Debug API] Error deleting applications:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message
        },
        { status: 500 }
      )
    }

    console.log('[Debug API] All applications cleared successfully')

    return NextResponse.json({
      success: true,
      message: 'All applications cleared successfully'
    })
  } catch (error: any) {
    console.error('[Debug API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to clear applications'
      },
      { status: 500 }
    )
  }
}
