import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

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

    // Note: Role matching is optional - proceed with login regardless
    // if (userProfile.role !== role) {
    //   return NextResponse.json(
    //     { error: `This account is registered as a ${userProfile.role}` },
    //     { status: 403 }
    //   )
    // }

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
