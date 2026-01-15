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
    
    console.log('===== SEND OTP DEBUG START =====')
    console.log(`[Step 1] Raw input phoneNumber: "${phoneNumber}"`)
    console.log(`[Step 1] Type: ${typeof phoneNumber}`)
    console.log(`[Step 1] Length: ${phoneNumber.length}`)

    // Normalize phone number - remove all non-digits
    phoneNumber = phoneNumber.replace(/\D/g, '')
    
    console.log(`[Step 2] After removing non-digits: "${phoneNumber}"`)
    console.log(`[Step 2] Length: ${phoneNumber.length}`)

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      console.log(`[Step 3] ✗ VALIDATION FAILED - Phone number too short`)
      return NextResponse.json(
        { error: 'Invalid phone number - must be at least 10 digits' },
        { status: 400 }
      )
    }
    
    console.log(`[Step 3] ✓ Phone number validation passed`)

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    
    console.log(`[Step 4] Generated OTP: ${otp}`)
    console.log(`[Step 4] Expires at: ${expiresAt}`)

    // Store OTP in Supabase
    console.log(`[Step 5] Attempting to store OTP in Supabase...`)
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
      console.error(`[Step 5] ✗ Supabase insert error:`, error)
      console.error(`[Step 5] Error code: ${error.code}`)
      console.error(`[Step 5] Error message: ${error.message}`)
      
      // If table doesn't exist, return test OTP
      if (error.code === 'PGRST116' || error.message.includes('not found')) {
        console.log(`[Step 5] Table not found - returning test OTP`)
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json(
            {
              success: true,
              message: 'OTP sent successfully (dev mode - table not found)',
              testOtp: otp,
            },
            { status: 200 }
          )
        }
      }
      throw error
    }
    
    console.log(`[Step 5] ✓ OTP stored in Supabase`)
    console.log(`[Step 5] Stored data:`, JSON.stringify(data, null, 2))

    // Send OTP via Twilio SMS
    console.log(`[Step 6] Attempting to send SMS via Twilio...`)
    let smsResult: any = null
    let smsError: any = null
    try {
      smsResult = await sendSmsWithTwilio(phoneNumber, otp)
      console.log(`[Step 6] ✓ SMS sent successfully to ${phoneNumber}`)
    } catch (error: any) {
      smsError = error
      console.error('[Step 6] ✗ Twilio SMS error occurred')
      console.error('[Step 6] Error message:', error.message)
      console.error('[Step 6] Full error:', error)
    }

    // For development, return detailed SMS status
    if (process.env.NODE_ENV === 'development') {
      console.log('===== SEND OTP DEBUG END (Development Mode) =====')
      return NextResponse.json(
        {
          success: true,
          message: smsError ? 'OTP stored but SMS failed' : 'OTP sent successfully',
          testOtp: otp, // For development only
          phoneNumber: phoneNumber,
          phoneNumberLength: phoneNumber.length,
          smsStatus: smsResult ? {
            success: true,
            sid: smsResult.sid,
            status: smsResult.status, // 'queued', 'sending', 'sent', etc.
            to: smsResult.to,
            from: smsResult.from,
            dateCreated: smsResult.date_created,
            dateSent: smsResult.date_sent,
            dateUpdated: smsResult.date_updated,
            errorCode: smsResult.error_code,
            errorMessage: smsResult.error_message,
          } : {
            success: false,
            error: smsError?.message || 'Unknown error',
            errorCode: smsError?.code,
            errorStatus: smsError?.status,
          },
          debugInfo: {
            phoneNumber: phoneNumber,
            twilioFrom: process.env.TWILIO_PHONE_NUMBER,
            twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? '***' : 'NOT SET',
            twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ? '***' : 'NOT SET',
            environment: process.env.NODE_ENV,
          }
        },
        { status: 200 }
      )
    }

    console.log('===== SEND OTP DEBUG END (Production Mode) =====')
    // Production response - but always return SMS status for debugging
    return NextResponse.json(
      { 
        success: true, 
        message: 'OTP sent successfully',
        phoneNumber: phoneNumber,
        smsStatus: smsResult ? {
          success: true,
          status: smsResult.status,
          sid: smsResult.sid,
          to: smsResult.to,
        } : {
          success: false,
          error: smsError?.message || 'Unknown SMS error',
          status: 'failed'
        },
        smsId: smsResult?.sid || null,
        // Always include test info for debugging on live site
        ...(process.env.NODE_ENV !== 'production' && {
          testOtp: otp,
          debugInfo: {
            twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? '***' : 'NOT SET',
            twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ? '***' : 'NOT SET',
            twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
          }
        })
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('===== SEND OTP DEBUG END (Error) =====')
    console.error('[Resume Checker] Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Send SMS via Twilio - Supports Indian numbers
async function sendSmsWithTwilio(phoneNumber: string, otp: string) {
  console.log(`\n[Twilio] ===== TWILIO SMS DEBUG START =====`)
  
  try {
    // Validate inputs
    console.log(`[Twilio] Input phoneNumber: "${phoneNumber}"`)
    console.log(`[Twilio] Input phoneNumber length: ${phoneNumber.length}`)
    console.log(`[Twilio] Input OTP: ${otp}`)
    
    if (!process.env.TWILIO_ACCOUNT_SID) {
      throw new Error('TWILIO_ACCOUNT_SID not configured')
    }
    if (!process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('TWILIO_AUTH_TOKEN not configured')
    }
    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER not configured')
    }
    
    console.log(`[Twilio] ✓ All environment variables are set`)
    console.log(`[Twilio] Raw Phone Number from env: ${process.env.TWILIO_PHONE_NUMBER}`)
    
    // Format FROM number (Twilio number) to ensure it has + prefix
    let formattedFromNumber = process.env.TWILIO_PHONE_NUMBER!.replace(/\D/g, '')
    if (!formattedFromNumber.startsWith('+')) {
      formattedFromNumber = `+${formattedFromNumber}`
    }
    console.log(`[Twilio] Formatted FROM number: ${formattedFromNumber}`)
    console.log(`[Twilio] Account SID: ${process.env.TWILIO_ACCOUNT_SID}`)

    const twilio = require('twilio')
    console.log(`[Twilio] Twilio SDK loaded successfully`)
    
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
    console.log(`[Twilio] Twilio client initialized`)

    // Format phone number to E.164 format: +<country_code><number>
    let formattedPhone = phoneNumber.replace(/\D/g, '') // Remove all non-digits
    console.log(`[Twilio] After removing non-digits: "${formattedPhone}" (length: ${formattedPhone.length})`)
    
    // If it's 10 digits, assume India
    if (formattedPhone.length === 10) {
      formattedPhone = `+91${formattedPhone}`
      console.log(`[Twilio] Detected 10-digit number, added +91 prefix: ${formattedPhone}`)
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('0')) {
      // Remove leading 0 if present
      formattedPhone = `+91${formattedPhone.slice(1)}`
      console.log(`[Twilio] Detected 11-digit number with leading 0, converted to: ${formattedPhone}`)
    } else if (formattedPhone.length === 12 && formattedPhone.startsWith('91')) {
      // Already has country code, just add +
      formattedPhone = `+${formattedPhone}`
      console.log(`[Twilio] Detected 12-digit number with country code, added +: ${formattedPhone}`)
    } else if (!formattedPhone.startsWith('+')) {
      // Otherwise add + prefix
      formattedPhone = `+${formattedPhone}`
      console.log(`[Twilio] Added + prefix: ${formattedPhone}`)
    }

    console.log(`[Twilio] Final formatted phone: ${formattedPhone}`)
    console.log(`[Twilio] Final phone length: ${formattedPhone.length}`)

    // Prepare message body
    const messageBody = `Your verification code is: ${otp}. Valid for 10 minutes.`
    console.log(`[Twilio] Message body: "${messageBody}"`)
    console.log(`[Twilio] Message length: ${messageBody.length} characters`)

    console.log(`[Twilio] Creating message with Twilio API...`)
    console.log(`[Twilio]   To: ${formattedPhone}`)
    console.log(`[Twilio]   From: ${formattedFromNumber}`)
    console.log(`[Twilio]   Body: ${messageBody}`)

    const message = await client.messages.create({
      body: messageBody,
      from: formattedFromNumber,
      to: formattedPhone,
    })

    console.log(`[Twilio] ✓ Message created successfully!`)
    console.log(`[Twilio] Message SID: ${message.sid}`)
    console.log(`[Twilio] Status: ${message.status}`)
    console.log(`[Twilio] To: ${message.to}`)
    console.log(`[Twilio] From: ${message.from}`)
    console.log(`[Twilio] Date Created: ${message.date_created}`)
    console.log(`[Twilio] Date Sent: ${message.date_sent}`)
    console.log(`[Twilio] Error Code: ${message.error_code}`)
    console.log(`[Twilio] Error Message: ${message.error_message}`)
    console.log(`[Twilio] Price: ${message.price}`)
    console.log(`[Twilio] Price Unit: ${message.price_unit}`)
    console.log(`[Twilio] Full response:`, JSON.stringify(message, null, 2))
    console.log(`[Twilio] ===== TWILIO SMS DEBUG END (SUCCESS) =====\n`)
    
    return message
  } catch (error: any) {
    console.error(`[Twilio] ✗ Error sending SMS`)
    console.error(`[Twilio] Error type: ${error.constructor.name}`)
    console.error(`[Twilio] Error message: ${error.message}`)
    console.error(`[Twilio] Error code: ${error.code}`)
    console.error(`[Twilio] Error status: ${error.status}`)
    
    if (error.moreInfo) {
      console.error(`[Twilio] More info: ${error.moreInfo}`)
    }
    
    if (error.details) {
      console.error(`[Twilio] Details:`, error.details)
    }
    
    console.error(`[Twilio] Full error object:`, JSON.stringify(error, null, 2))
    console.error(`[Twilio] ===== TWILIO SMS DEBUG END (ERROR) =====\n`)
    
    throw error
  }
}
