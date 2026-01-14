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
    let { phoneNumber, otp } = await request.json()

    // Normalize phone number - remove all non-digits
    phoneNumber = phoneNumber.replace(/\D/g, '')

    // Validate inputs
    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    console.log(`[Verify OTP] Attempting verification - Phone: ${phoneNumber}, OTP: ${otp}`)

    // Fetch OTP from Supabase
    const { data, error: fetchError } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !data) {
      console.error('[Resume Checker] OTP fetch error:', fetchError)
      console.log('[Resume Checker] Searched phone number:', phoneNumber)
      return NextResponse.json(
        { error: 'OTP not found. Please request a new one.' },
        { status: 400 }
      )
    }

    console.log(`[Verify OTP] Found OTP record - Stored OTP: ${data.otp}, Submitted OTP: ${otp}, Match: ${data.otp === otp}`)

    // Check if OTP is expired
    const expiresAt = new Date(data.expires_at)
    if (new Date() > expiresAt) {
      // Mark as expired
      await supabase
        .from('phone_otps')
        .update({ verified: false })
        .eq('id', data.id)

      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if max attempts exceeded (5 attempts)
    if (data.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 400 }
      )
    }

    // Check if OTP matches
    if (data.otp !== otp) {
      // Increment attempts
      const { error: updateError } = await supabase
        .from('phone_otps')
        .update({ attempts: data.attempts + 1 })
        .eq('id', data.id)

      if (updateError) {
        console.error('[Resume Checker] Failed to update attempts:', updateError)
      }

      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      )
    }

    // OTP is valid - mark as verified
    const { error: verifyError } = await supabase
      .from('phone_otps')
      .update({ verified: true })
      .eq('id', data.id)

    if (verifyError) {
      console.error('[Resume Checker] Failed to verify OTP:', verifyError)
      throw verifyError
    }

    // Create or update verified phone record
    const { error: phoneError } = await supabase
      .from('verified_phones')
      .upsert(
        {
          phone_number: phoneNumber,
          last_verified_at: new Date().toISOString(),
        },
        { onConflict: 'phone_number' }
      )

    if (phoneError) {
      console.log('[Resume Checker] Phone record creation skipped (table might not exist):', phoneError.message)
    }

    console.log(`[Resume Checker] OTP verified for ${phoneNumber}`)

    return NextResponse.json(
      {
        success: true,
        message: 'Phone number verified successfully',
        phoneNumber: phoneNumber,
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
