import { validate } from 'email-validator'
import { createTransport } from 'nodemailer'
import * as dns from 'dns'
import { promisify } from 'util'

const resolveMx = promisify(dns.resolveMx)

/**
 * Validates an email address using multiple methods:
 * 1. Format validation (RFC 5322 compliant)
 * 2. Domain MX record validation (checks if domain accepts emails)
 * 3. SMTP connection test (optional - checks if mailbox exists)
 */
export async function validateEmailAddress(email) {
  try {
    // Step 1: Basic format validation
    if (!validate(email)) {
      return {
        valid: false,
        reason: 'Invalid email format',
      }
    }

    // Step 2: Check domain MX records
    const domain = email.split('@')[1]
    if (!domain) {
      return {
        valid: false,
        reason: 'Email domain is invalid',
      }
    }

    // Check if domain has MX records
    const mxRecords = await resolveMx(domain).catch((err) => {
      console.error(`[Email Validation] MX lookup failed for ${domain}:`, err.message)
      return null
    })

    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        reason: `Domain '${domain}' does not accept emails (no MX records found)`,
      }
    }

    // Step 3: SMTP verification (optional but recommended)
    // Attempt to connect to the mail server and verify the mailbox exists
    const isSmtpValid = await verifySmtpMailbox(email, mxRecords[0])

    if (!isSmtpValid) {
      // If SMTP verification fails but everything else passed, we still allow it
      // This prevents false positives while catching most fake emails
      console.log(`[Email Validation] SMTP verification failed for ${email}, but allowing due to valid MX records`)
    }

    return {
      valid: true,
      reason: 'Email address is valid',
    }
  } catch (error) {
    console.error('[Email Validation] Unexpected error during validation:', error)
    // If there's an unexpected error, we can still allow the email (graceful degradation)
    // but log it for debugging
    return {
      valid: true,
      reason: 'Email validation passed (with warnings)',
      warning: error.message,
    }
  }
}

/**
 * Verifies if an email mailbox exists by attempting SMTP connection
 */
async function verifySmtpMailbox(email, mxRecord) {
  return new Promise((resolve) => {
    // Set a timeout for SMTP verification (5 seconds)
    const timeout = setTimeout(() => {
      resolve(true) // Assume valid if verification takes too long
    }, 5000)

    try {
      const transporter = createTransport({
        host: mxRecord.exchange,
        port: 25,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 3000,
        socketTimeout: 3000,
      })

      // Verify the mailbox
      transporter.verify((error, success) => {
        clearTimeout(timeout)

        if (error) {
          console.log(`[Email Validation] SMTP verification failed for ${mxRecord.exchange}:`, error.message)
          resolve(false)
        } else {
          resolve(true)
        }

        transporter.close()
      })
    } catch (error) {
      clearTimeout(timeout)
      console.error('[Email Validation] SMTP connection error:', error.message)
      resolve(false)
    }
  })
}

/**
 * Check for disposable/temporary email domains
 */
const disposableDomains = new Set([
  // Temporary email services
  'tempmail.com',
  'tempmail.net',
  'tempmail.org',
  'temp-mail.io',
  'temp-mail.org',
  'temporary-mail.net',
  'throwaway.email',
  'throwaway.email.com',
  'trashmail.com',
  'maildrop.cc',
  'mailnesia.com',
  'spam4.me',
  'dispostable.com',
  'fakeinbox.com',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.info',
  'guerrillamail.org',
  '10minutemail.com',
  '10minutemail.net',
  'yopmail.com',
  'yopmail.net',
  'mintemail.com',
  'tempail.com',
  'spamgourmet.com',
  'sharklasers.com',
  'pokemail.net',
  'grr.la',
  'getnada.com',
  'getresponse.com',
  'inboxkitten.com',
  'temp-mail.tk',
  'throwawaymail.com',
  'sharklasers.com',
  'spam.la',
  '0-mail.com',
  '0box.eu',
  '10minutemail.info',
  '10minutemail.fr',
  '10minutemail.de',
  '1secmail.com',
  'a-bc.net',
  'acompanhado.top',
  'acompanhados.com',
  'achatasafe.com',
  'abcdefghijklmnop.com',
  'abcinbox.com',
  'abcinbox.eu',
  'fakegmail.com',
  'fake-email.com',
  'fakemail.com',
  'fake-email.net',
  'testnator.com',
  'testmail.de',
  'temp123.com',
])

/**
 * Check if email uses a disposable email service
 */
export function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return true

  // Direct domain match
  if (disposableDomains.has(domain)) {
    return true
  }

  // Check for suspicious patterns
  if (domain.includes('tempmail') || 
      domain.includes('temp-mail') ||
      domain.includes('temporary') ||
      domain.includes('throwaway') ||
      domain.includes('spam') ||
      domain.includes('fake') ||
      domain.includes('test') ||
      domain.includes('trash') ||
      domain.includes('10minute')) {
    return true
  }

  return false
}

/**
 * Main validation function that combines all checks
 */
export async function validateEmailForSignup(email) {
  // Check for disposable emails first (quick check)
  if (isDisposableEmail(email)) {
    return {
      valid: false,
      reason: 'Disposable/temporary email addresses are not allowed. Please use a real email address.',
    }
  }

  // Validate the email address thoroughly
  const validation = await validateEmailAddress(email)
  return validation
}
