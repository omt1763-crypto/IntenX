import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '')

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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    // Store OTP in Supabase
    const { data, error } = await supabase
      .from('phone_otps')
      .insert([
        {
          phone_number: phoneNumber,
          otp: otp,
          expires_at: expiresAt,
          attempts: 0,
          verified: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('[Resume Checker] Supabase insert error:', error)
      // If table doesn't exist, return test OTP
      if (error.code === 'PGRST116' || error.message.includes('not found')) {
        console.log(`[Resume Checker] OTP for ${phoneNumber}: ${otp} (table not found)`)
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json(
            {
              success: true,
              message: 'OTP sent successfully (dev mode)',
              testOtp: otp,
            },
            { status: 200 }
          )
        }
      }
      throw error
    }

    console.log(`[Resume Checker] OTP stored for ${phoneNumber}: ${otp}`)

    // TODO: Integrate with Twilio to send actual SMS
    // For now, log the OTP for development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          success: true,
          message: 'OTP sent successfully',
          testOtp: otp, // For development only
        },
        { status: 200 }
      )
    }

    // In production, actually send SMS
    // await sendSmsWithTwilio(phoneNumber, otp)

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

// TODO: Implement Twilio SMS integration
// async function sendSmsWithTwilio(phoneNumber: string, otp: string) {
//   const twilio = require('twilio')
//   const client = twilio(
//     process.env.TWILIO_ACCOUNT_SID,
//     process.env.TWILIO_AUTH_TOKEN
//   )
//
//   await client.messages.create({
//     body: `Your IntenX Scanner verification code is: ${otp}. Valid for 10 minutes.`,
//     from: process.env.TWILIO_PHONE_NUMBER,
//     to: `+${phoneNumber}`,
//   })
// }
