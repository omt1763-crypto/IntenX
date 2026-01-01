import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

/**
 * API endpoint to resend verification email
 * Generates a new verification link and sends it to the user's email
 */
export async function POST(req) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('[Resend Verification API] Processing resend for email:', email)

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, email_verified')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.log('[Resend Verification API] User not found:', email)
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    if (user.email_verified) {
      return NextResponse.json(
        { success: false, message: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`

    // Store token in database (you may need to add a verification_tokens table)
    const { error: tokenError } = await supabaseAdmin
      .from('verification_tokens')
      .insert([
        {
          user_id: user.id,
          token: verificationToken,
          email: email,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      ])

    if (tokenError) {
      console.error('[Resend Verification API] Error storing token:', tokenError)
    }

    // Send verification email
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@interviewverse.com',
        to: email,
        subject: 'Verify Your Email - InterviewVerse',
        html: `
          <h2>Verify Your Email</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007a78; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      })

      console.log('[Resend Verification API] Verification email sent to:', email)
    } catch (emailError) {
      console.error('[Resend Verification API] Error sending email:', emailError)
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully!',
    }, { status: 200 })
  } catch (error) {
    console.error('[Resend Verification API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
