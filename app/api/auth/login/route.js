import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { logActivity, updateLastLogin } from '@/lib/activity-logger'

export async function POST(req) {
  try {
    const { email, password, role } = await req.json()

    // Validation
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      )
    }

    console.log('[Login] Attempting to authenticate:', { email, role })

    // Try to sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[Login] Auth error:', {
        message: error.message,
        code: error.code,
        status: error.status,
      })
      return NextResponse.json(
        { error: 'Invalid email or password. Make sure you signed up first.' },
        { status: 401 }
      )
    }

    console.log('[Login] Auth successful, user ID:', data.user?.id)

    // Check if email is confirmed
    if (!data.user.email_confirmed_at) {
      console.log('[Login] Email not confirmed for user:', email)
      return NextResponse.json(
        { 
          error: 'Please confirm your email before logging in. Check your inbox for the verification link.',
          needsEmailVerification: true,
          email: email,
        },
        { status: 403 }
      )
    }

    console.log('[Login] Email confirmed for user:', email)

    // Fetch user profile to check role
    const { data: userProfiles, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)

    let userProfile = null

    if (profileError) {
      console.error('[Login] Profile fetch error:', profileError)
      // Create a basic profile if it doesn't exist
      console.log('[Login] Creating missing user profile...')
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            first_name: data.user.email.split('@')[0],
            last_name: 'User',
            role: role || 'candidate',
            password_hash: 'MANAGED_BY_SUPABASE_AUTH',
          }
        ])
        .select()
        .single()
      
      if (createError || !newProfile) {
        console.error('[Login] Failed to create profile:', createError)
        return NextResponse.json(
          { error: 'Failed to setup user profile' },
          { status: 500 }
        )
      }
      userProfile = newProfile
    } else if (userProfiles && userProfiles.length > 0) {
      userProfile = userProfiles[0]
    }

    if (!userProfile) {
      console.error('[Login] No user profile found or created')
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    console.log('[Login] User profile found, role:', userProfile.role)

    // Log the login activity
    await logActivity({
      userId: data.user.id,
      action: 'login',
      entityType: 'user',
      entityId: data.user.id,
      description: `User logged in as ${userProfile.role}`,
      metadata: {
        email: data.user.email,
        role: userProfile.role,
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent'),
    })

    // Update last login timestamp
    await updateLastLogin(data.user.id)

    console.log('[Login] Login activity logged')

    return NextResponse.json(
      {
        user: userProfile,
        session: data.session,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
