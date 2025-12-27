import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/debug/clear-interviews - Delete ALL interviews
export async function POST(request: NextRequest) {
  try {
    console.log('[Debug API] Clearing all interviews...')

    // Delete all interviews using gte filter to match all rows
    const { error } = await supabaseAdmin
      .from('interviews')
      .delete()
      .gte('created_at', '1970-01-01')

    if (error) {
      console.error('[Debug API] Error deleting interviews:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message
        },
        { status: 500 }
      )
    }

    console.log('[Debug API] All interviews cleared successfully')

    return NextResponse.json({
      success: true,
      message: 'All interviews cleared successfully'
    })
  } catch (error: any) {
    console.error('[Debug API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to clear interviews'
      },
      { status: 500 }
    )
  }
}
