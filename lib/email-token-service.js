import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

/**
 * Generates a unique verification token for email verification
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Creates a verification token in the database
 */
export async function createVerificationToken(userId, email) {
  try {
    const token = generateVerificationToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    console.log('[Email Token] Creating verification token for:', email)

    const { data, error } = await supabaseAdmin
      .from('email_verification_tokens')
      .insert([
        {
          user_id: userId,
          email,
          token,
          expires_at: expiresAt.toISOString(),
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('[Email Token] Error creating token:', error)
      throw error
    }

    console.log('[Email Token] Verification token created successfully')
    return token
  } catch (error) {
    console.error('[Email Token] Unexpected error:', error)
    throw error
  }
}

/**
 * Verifies an email token
 */
export async function verifyEmailToken(token) {
  try {
    console.log('[Email Token] Verifying token...')

    const { data, error } = await supabaseAdmin
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) {
      console.error('[Email Token] Invalid or expired token')
      return { valid: false, reason: 'Invalid or expired verification token' }
    }

    // Check if token has expired
    if (new Date(data.expires_at) < new Date()) {
      console.log('[Email Token] Token has expired')
      return { valid: false, reason: 'Verification token has expired' }
    }

    console.log('[Email Token] Token verified successfully')
    return { valid: true, token: data, userId: data.user_id, email: data.email }
  } catch (error) {
    console.error('[Email Token] Error verifying token:', error)
    return { valid: false, reason: 'Error verifying token' }
  }
}

/**
 * Marks email as verified
 */
export async function markEmailAsVerified(userId) {
  try {
    console.log('[Email Token] Marking email as verified for user:', userId)

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ email_verified: true, email_verified_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('[Email Token] Error marking email as verified:', error)
      throw error
    }

    // Delete all used tokens
    await supabaseAdmin
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', userId)

    console.log('[Email Token] Email marked as verified')
    return data
  } catch (error) {
    console.error('[Email Token] Unexpected error:', error)
    throw error
  }
}

/**
 * Resends verification email
 */
export async function resendVerificationEmail(userId, email) {
  try {
    console.log('[Email Token] Resending verification email for:', email)

    // Delete old tokens
    await supabaseAdmin
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', userId)

    // Create new token
    const token = await createVerificationToken(userId, email)

    return { token, email }
  } catch (error) {
    console.error('[Email Token] Error resending:', error)
    throw error
  }
}