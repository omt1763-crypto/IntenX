import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    if (!userId) {
      console.error('[Debug API] Missing userId for deletion')
      return NextResponse.json(
        { error: 'Missing user ID', deleted: false },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      console.error('[Debug API] Supabase not configured')
      return NextResponse.json(
        { error: 'Supabase not configured', deleted: false },
        { status: 500 }
      )
    }

    console.log('[Debug API] Attempting to delete user:', userId)

    // Delete user from users table
    const { error: deleteError, count } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    console.log('[Debug API] Delete result:', { 
      count, 
      error: deleteError?.message,
      code: deleteError?.code,
      userId 
    })

    if (deleteError) {
      console.error('[Debug API] Error deleting user from users table:', {
        userId,
        error: deleteError.message,
        code: deleteError.code,
      })
      return NextResponse.json(
        { 
          error: `Failed to delete user: ${deleteError.message}`,
          deleted: false,
          details: deleteError
        },
        { status: 500 }
      )
    }

    // Check if row was actually deleted
    if (count === 0) {
      console.warn('[Debug API] No rows deleted - user may not exist or RLS prevented deletion:', userId)
      return NextResponse.json(
        { 
          error: 'User not found or deletion not allowed',
          deleted: false,
          count: 0
        },
        { status: 404 }
      )
    }

    console.log('[Debug API] Successfully deleted user:', {
      userId,
      rowsDeleted: count,
    })

    // Verify the deletion actually worked by trying to fetch the user
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (verifyError && verifyError.code === 'PGRST116') {
      // PGRST116 means no rows found - deletion was successful
      console.log('[Debug API] Deletion verified - user no longer exists in database')
    } else if (verifyData) {
      // User still exists - deletion may have been blocked by RLS
      console.warn('[Debug API] ⚠️ DELETION VERIFICATION FAILED - User still exists in database:', {
        userId,
        userData: verifyData
      })
      return NextResponse.json(
        { 
          error: 'Deletion failed - user still exists. This may be due to Row Level Security policies.',
          deleted: false,
          rowsDeleted: count,
          verified: false
        },
        { status: 500 }
      )
    }

    // Also try to delete from auth.users (if user is linked to auth)
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (authError) {
        console.warn('[Debug API] Could not delete from auth.users (may not exist):', {
          userId,
          error: authError.message,
        })
      } else {
        console.log('[Debug API] Also deleted from auth.users:', userId)
      }
    } catch (authErr: any) {
      console.warn('[Debug API] Auth deletion failed (not critical):', {
        userId,
        error: authErr?.message,
      })
    }

    return NextResponse.json(
      { 
        success: true,
        deleted: true,
        userId,
        rowsDeleted: count || 1,
        message: `User deleted successfully`
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Debug API] Unexpected error deleting user:', {
      error: error?.message,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: error?.message || 'Internal server error',
        deleted: false
      },
      { status: 500 }
    )
  }
}
