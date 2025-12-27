import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/debug/create-user - Create a new user
export async function POST(request: NextRequest) {
  try {
    const { email, full_name, role, password } = await request.json()

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[Debug API] Creating user:', email, 'role:', role)

    // Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError || !authData.user) {
      console.error('[Debug API] Auth error:', authError)
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create auth user' },
        { status: 500 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('[Debug API] Profile error:', profileError)
      // Delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { success: false, error: profileError.message || 'Failed to create user profile' },
        { status: 500 }
      )
    }

    console.log('[Debug API] User created successfully:', authData.user.id)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email,
        full_name,
        role
      }
    })
  } catch (error: any) {
    console.error('[Debug API] Error creating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create user'
      },
      { status: 500 }
    )
  }
}
