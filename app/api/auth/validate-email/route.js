import { NextResponse } from 'next/server'
import { validateEmailForSignup } from '@/lib/email-validation'

/**
 * API endpoint for validating email addresses in real-time
 * This is called from the signup form to provide immediate feedback
 */
export async function POST(req) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate the email
    const validation = await validateEmailForSignup(email)

    return NextResponse.json({
      valid: validation.valid,
      message: validation.reason,
    })
  } catch (error) {
    console.error('[Email Validation API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to validate email' },
      { status: 500 }
    )
  }
}
