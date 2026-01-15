import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '')

/**
 * Debug endpoint to check OTP status for a phone number
 * GET /api/resume-checker/debug-otp?phone=8103668703
 */
export async function GET(request: NextRequest) {
  try {
    // Get phone number from query params
    const { searchParams } = new URL(request.url)
    let phoneNumber = searchParams.get('phone')

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number required as query param: ?phone=8103668703' },
        { status: 400 }
      )
    }

    // Normalize phone number
    phoneNumber = phoneNumber.replace(/\D/g, '')
    
    console.log(`[Debug OTP] Checking status for phone: ${phoneNumber}`)

    // Fetch all OTP records for this phone number
    const { data: otpRecords, error: otpError } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })

    if (otpError) {
      console.error('[Debug OTP] Error fetching OTP records:', otpError)
      return NextResponse.json(
        { 
          error: 'Failed to fetch OTP records',
          details: otpError.message 
        },
        { status: 500 }
      )
    }

    // Fetch verified phone record
    const { data: verifiedPhone, error: verifiedError } = await supabase
      .from('verified_phones')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    if (verifiedError && verifiedError.code !== 'PGRST116') {
      console.error('[Debug OTP] Error fetching verified phone:', verifiedError)
    }

    // Format response
    const latestOtp = otpRecords?.[0]

    return NextResponse.json(
      {
        phone: phoneNumber,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        latestOtp: latestOtp ? {
          id: latestOtp.id,
          otp: latestOtp.otp,
          createdAt: latestOtp.created_at,
          expiresAt: latestOtp.expires_at,
          isExpired: new Date(latestOtp.expires_at) < new Date(),
          attempts: latestOtp.attempts,
          verified: latestOtp.verified,
          status: latestOtp.verified ? 'verified' : (new Date(latestOtp.expires_at) < new Date() ? 'expired' : 'active'),
        } : null,
        totalOtpRecords: otpRecords?.length || 0,
        allOtps: otpRecords?.map((r: any) => ({
          otp: r.otp,
          createdAt: r.created_at,
          expiresAt: r.expires_at,
          verified: r.verified,
          attempts: r.attempts,
        })) || [],
        verifiedPhone: verifiedPhone ? {
          lastVerifiedAt: verifiedPhone.last_verified_at,
          createdAt: verifiedPhone.created_at,
        } : null,
        supabaseStatus: {
          url: supabaseUrl ? '✓ SET' : '✗ NOT SET',
          serviceKey: supabaseServiceKey ? '✓ SET' : '✗ NOT SET',
        },
        twilioStatus: {
          accountSid: process.env.TWILIO_ACCOUNT_SID ? '✓ SET' : '✗ NOT SET',
          authToken: process.env.TWILIO_AUTH_TOKEN ? '✓ SET' : '✗ NOT SET',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || '✗ NOT SET',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Debug OTP] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to debug OTP status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
