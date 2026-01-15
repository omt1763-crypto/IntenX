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
    let { phoneNumber } = await request.json()

    // Normalize phone number - remove all non-digits
    phoneNumber = phoneNumber.replace(/\D/g, '')

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

    // Send OTP via Twilio SMS
    let smsResult: any = null
    let smsError: any = null
    try {
      smsResult = await sendSmsWithTwilio(phoneNumber, otp)
      console.log(`[Resume Checker] ✓ SMS sent successfully to ${phoneNumber}`)
    } catch (error: any) {
      smsError = error
      console.error('[Resume Checker] ✗ Twilio SMS error:', error.message)
    }

    // For development, return detailed SMS status
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          success: true,
          message: 'OTP sent successfully',
          testOtp: otp, // For development only
          smsStatus: smsResult ? {
            success: true,
            sid: smsResult.sid,
            status: smsResult.status, // 'queued', 'sending', 'sent', etc.
            to: smsResult.to,
            from: smsResult.from,
            dateCreated: smsResult.date_created,
          } : {
            success: false,
            error: smsError?.message || 'Unknown error'
          },
          debugInfo: {
            phoneNumber: phoneNumber,
            twilioFrom: process.env.TWILIO_PHONE_NUMBER,
            twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? '***' : 'NOT SET',
            twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ? '***' : 'NOT SET',
          }
        },
        { status: 200 }
      )
    }

    // Production response
    return NextResponse.json(
      { 
        success: true, 
        message: 'OTP sent successfully',
        smsStatus: smsResult?.status || 'unknown',
        smsId: smsResult?.sid || null
      },
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

// Send SMS via Twilio - Supports Indian numbers
async function sendSmsWithTwilio(phoneNumber: string, otp: string) {
  try {
    const twilio = require('twilio')
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    // Format phone number to E.164 format: +<country_code><number>
    let formattedPhone = phoneNumber.replace(/\D/g, '') // Remove all non-digits
    
    // If it's 10 digits, assume India
    if (formattedPhone.length === 10) {
      formattedPhone = `+91${formattedPhone}`
    } else if (!formattedPhone.startsWith('+')) {
      // Otherwise add + prefix
      formattedPhone = `+${formattedPhone}`
    } else if (formattedPhone.startsWith('0')) {
      // Remove leading 0 if present
      formattedPhone = `+91${formattedPhone.slice(1)}`
    }

    console.log(`[Twilio] Attempting to send SMS...`)
    console.log(`[Twilio] To: ${formattedPhone}`)
    console.log(`[Twilio] From: ${process.env.TWILIO_PHONE_NUMBER}`)
    console.log(`[Twilio] Account SID: ${process.env.TWILIO_ACCOUNT_SID}`)
    console.log(`[Twilio] OTP: ${otp}`)

    const message = await client.messages.create({
      body: `Your verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })

    console.log(`[Twilio] ✓ SMS created successfully!`)
    console.log(`[Twilio] Message SID: ${message.sid}`)
    console.log(`[Twilio] Status: ${message.status}`)
    console.log(`[Twilio] Sent to: ${message.to}`)
    console.log(`[Twilio] Full response:`, JSON.stringify(message, null, 2))
    
    return message
  } catch (error: any) {
    console.error(`[Twilio] ✗ Error sending SMS`)
    console.error(`[Twilio] Error message:`, error.message)
    console.error(`[Twilio] Error code:`, error.code)
    console.error(`[Twilio] Error status:`, error.status)
    console.error(`[Twilio] Full error:`, JSON.stringify(error, null, 2))
    throw error
  }
}
