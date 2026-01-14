import { NextRequest, NextResponse } from 'next/server'

const otpStore = new Map<string, { otp: string; timestamp: number; attempts: number }>()

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json()

    // Validate inputs
    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    // Check if OTP exists and is not expired (10 minutes)
    const stored = otpStore.get(phoneNumber)
    if (!stored) {
      return NextResponse.json(
        { error: 'OTP not found. Please request a new one.' },
        { status: 400 }
      )
    }

    const isExpired = Date.now() - stored.timestamp > 600000 // 10 minutes
    if (isExpired) {
      otpStore.delete(phoneNumber)
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if OTP matches
    if (stored.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      )
    }

    // OTP is valid, remove from store
    otpStore.delete(phoneNumber)

    // In production, you might want to:
    // 1. Create a verified session in your database
    // 2. Store the verification timestamp
    // 3. Set a secure cookie/token

    console.log(`[Resume Checker] Phone verified: ${phoneNumber}`)

    return NextResponse.json(
      {
        success: true,
        message: 'Phone number verified successfully',
        phoneNumber,
        verifiedAt: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Resume Checker] Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
