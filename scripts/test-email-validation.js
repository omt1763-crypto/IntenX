/**
 * Test script for email validation
 * Run with: node scripts/test-email-validation.js
 */

const { validateEmailForSignup, isDisposableEmail } = require('../lib/email-validation')

async function runTests() {
  console.log('🔍 Email Validation Test Suite\n')
  console.log('=' .repeat(60))

  const testCases = [
    // Valid emails (real domains with MX records)
    { email: 'test@gmail.com', shouldPass: true, description: 'Valid Gmail address' },
    { email: 'user@outlook.com', shouldPass: true, description: 'Valid Outlook address' },
    { email: 'contact@example.com', shouldPass: true, description: 'Valid example.com address' },

    // Invalid format
    { email: 'invalid-email', shouldPass: false, description: 'Invalid format (no @)' },
    { email: 'user@', shouldPass: false, description: 'Invalid format (no domain)' },
    { email: '@domain.com', shouldPass: false, description: 'Invalid format (no username)' },

    // Disposable/Fake emails
    { email: 'fake@tempmail.com', shouldPass: false, description: 'Temporary email service' },
    { email: 'test@guerrillamail.com', shouldPass: false, description: 'Guerrilla mail service' },
    { email: 'user@mailinator.com', shouldPass: false, description: 'Mailinator service' },
    { email: 'spam@10minutemail.com', shouldPass: false, description: '10 minute mail service' },

    // Non-existent domains
    { email: 'test@fakefakefake123.com', shouldPass: false, description: 'Non-existent domain' },
    { email: 'user@invalidmxdomain.xyz', shouldPass: false, description: 'Domain without MX records' },
  ]

  let passCount = 0
  let failCount = 0

  for (const testCase of testCases) {
    try {
      console.log(`\n📧 Testing: ${testCase.email}`)
      console.log(`   Description: ${testCase.description}`)

      // Check disposable emails first
      if (isDisposableEmail(testCase.email)) {
        console.log(`   ⚠️  Disposable email detected`)
        if (!testCase.shouldPass) {
          console.log(`   ✅ PASS (correctly rejected)`)
          passCount++
        } else {
          console.log(`   ❌ FAIL (should be rejected but expected to pass)`)
          failCount++
        }
        continue
      }

      const result = await validateEmailForSignup(testCase.email)

      if (result.valid === testCase.shouldPass) {
        console.log(`   ✅ PASS - ${result.reason}`)
        passCount++
      } else {
        console.log(`   ❌ FAIL - ${result.reason}`)
        console.log(`   Expected: ${testCase.shouldPass}, Got: ${result.valid}`)
        failCount++
      }
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`)
      failCount++
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log(`\n📊 Test Results:`)
  console.log(`   ✅ Passed: ${passCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log(`   Total: ${passCount + failCount}`)
  console.log(`   Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(2)}%\n`)

  process.exit(failCount > 0 ? 1 : 0)
}

// Run tests
runTests().catch(console.error)
