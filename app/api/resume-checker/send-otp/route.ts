import { NextRequest, NextResponse } from 'next/server'

// This is a placeholder - in production, integrate with Twilio or your SMS provider
// For now, we'll generate a test OTP and log it

const otpStore = new Map<string, { otp: string; timestamp: number; attempts: number }>()

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Check rate limiting (max 3 requests per hour)
    const existing = otpStore.get(phoneNumber)
    if (existing && Date.now() - existing.timestamp < 3600000 && existing.attempts >= 3) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP (expires in 10 minutes)
    otpStore.set(phoneNumber, {
      otp,
      timestamp: Date.now(),
      attempts: (existing?.attempts || 0) + 1,
    })

    console.log(`[Resume Checker] OTP for ${phoneNumber}: ${otp}`)

    // In production, send OTP via Twilio or similar
    // await sendSmsOtp(phoneNumber, otp)

    // For development/testing, return the OTP (remove in production)
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          success: true,
          message: 'OTP sent successfully',
          // Only for development - remove in production
          testOtp: otp,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'OTP sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Resume Checker] Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}

// Helper function to send SMS via Twilio (implement as needed)
// async function sendSmsOtp(phoneNumber: string, otp: string) {
//   const twilio = require('twilio')
//   const client = twilio(
//     process.env.TWILIO_ACCOUNT_SID,
//     process.env.TWILIO_AUTH_TOKEN
//   )
//
//   await client.messages.create({
//     body: `Your AI Resume Checker verification code is: ${otp}. Valid for 10 minutes.`,
//     from: process.env.TWILIO_PHONE_NUMBER,
//     to: `+${phoneNumber}`,
//   })
// }
