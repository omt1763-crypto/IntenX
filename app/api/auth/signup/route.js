import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { validateEmailForSignup } from '@/lib/email-validation'

export async function POST(req) {
  try {
    const { firstName, lastName, email, password, role } = await req.json()

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email address (checks format, domain, and SMTP validity)
    console.log('[Signup] Validating email address:', email)
    const emailValidation = await validateEmailForSignup(email)
    if (!emailValidation.valid) {
      console.log('[Signup] Email validation failed:', emailValidation.reason)
      return NextResponse.json(
        { error: emailValidation.reason },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Step 0: Check if user already exists in users table
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)

    if (existingUsers && existingUsers.length > 0) {
      console.log('[Signup] User already exists in database:', email)
      return NextResponse.json(
        { error: 'This email is already registered. Please log in or use a different email.' },
        { status: 409 }
      )
    }

    // Note: We ignore errors which means "no rows found" - that's expected
    if (checkError) {
      console.error('[Signup] Error checking existing user:', checkError)
      // Continue anyway
    }    // Step 1: Create user in Supabase Auth (auto-confirm email for now)
    console.log('[Signup] Creating auth user for:', email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email - skip verification for now
    })

    if (authError) {
      console.error('[Signup] Auth creation error:', authError)
      // Check if it's a duplicate email error
      if (authError.message?.includes('already registered') || authError.message?.includes('User already exists')) {
        return NextResponse.json(
          { error: 'This email is already registered. Please log in.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: authError.message || 'Failed to create auth account' },
        { status: 400 }
      )
    }

    const userId = authData.user.id
    console.log('[Signup] Auth user created with ID:', userId)

    // Step 2: Create user profile in users table
    // Use a placeholder for password_hash since it's managed by Supabase Auth
    console.log('[Signup] Creating user profile in database...')
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          password_hash: 'MANAGED_BY_SUPABASE_AUTH', // Placeholder - password is in auth.users
        }
      ])
      .select()
      .single()

    if (userError) {
      console.error('[Signup] User profile creation error:', userError)
      // Try to delete the auth user if profile creation fails
      console.log('[Signup] Rolling back: Deleting auth user after profile creation failure...')
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }    console.log('[Signup] User profile created successfully')

    // Step 3: Email verification disabled for now - user can sign up directly
    console.log('[Signup] Signup completed successfully for:', email)
    
    return NextResponse.json({
      user: userData,
      message: 'Account created successfully! You can now log in.',
      redirect: '/auth/login',
    }, { status: 201 })
  } catch (error) {
    console.error('[Signup] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
