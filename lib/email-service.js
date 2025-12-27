import nodemailer from 'nodemailer'

/**
 * Email service using Nodemailer for sending verification emails
 * You can configure this to use your own SMTP server or email service
 */

// Create email transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

/**
 * Generates the email verification template
 */
function generateVerificationEmailTemplate(userName, verificationUrl, token) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - InterX</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #007a78 0%, #11cd68 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
        }
        .message {
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 30px;
          color: #666;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #007a78 0%, #11cd68 100%);
          color: white;
          padding: 14px 40px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          opacity: 0.9;
          text-decoration: none;
        }
        .token-info {
          background: #f0fdf4;
          border-left: 4px solid #11cd68;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #333;
          word-break: break-all;
        }
        .footer {
          background: #f5f5f5;
          padding: 20px 30px;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #eee;
        }
        .footer p {
          margin: 5px 0;
        }
        .warning {
          color: #d32f2f;
          font-weight: 600;
          font-size: 13px;
        }
        .link {
          color: #007a78;
          text-decoration: none;
        }
        .link:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 InterX</h1>
          <p>Email Verification</p>
        </div>

        <div class="content">
          <div class="greeting">
            Hello ${userName}! 👋
          </div>

          <div class="message">
            <p>Welcome to <strong>InterX</strong>! We're thrilled to have you join our community.</p>
            <p>To complete your account setup and start using InterX, please verify your email address by clicking the button below:</p>
          </div>

          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>

          <div class="message">
            <p><strong>Or use this verification code:</strong></p>
          </div>

          <div class="token-info">
            ${token}
          </div>

          <div class="message">
            <p><strong>Link expires in:</strong> 24 hours</p>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p class="warning">⚠️ Security Notice:</p>
            <p style="margin: 5px 0; font-size: 13px; color: #666;">If you didn't create this account, please ignore this email or contact our support team immediately.</p>
          </div>

          <div class="message">
            <p>Need help? Visit our <a href="https://interx.example.com/support" class="link">support page</a> or reply to this email.</p>
            <p>Best regards,<br><strong>The InterX Team</strong> 🚀</p>
          </div>
        </div>

        <div class="footer">
          <p><strong>InterX - Interview Experience Platform</strong></p>
          <p>This is an automated message. Please do not reply directly to this email.</p>
          <p>© ${new Date().getFullYear()} InterX. All rights reserved.</p>
          <p>
            <a href="https://interx.example.com" class="link">Visit Website</a> | 
            <a href="https://interx.example.com/privacy" class="link">Privacy Policy</a> | 
            <a href="https://interx.example.com/terms" class="link">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Sends verification email to user
 */
export async function sendVerificationEmail(email, userName, token) {
  try {
    console.log('[Email Service] Sending verification email to:', email)

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`

    const htmlContent = generateVerificationEmailTemplate(userName, verificationUrl, token)

    const mailOptions = {
      from: `"InterX Team" <${process.env.EMAIL_USER || 'noreply@interx.com'}>`,
      to: email,
      subject: '🎯 Verify Your Email - InterX',
      html: htmlContent,
      text: `
        Welcome to InterX!

        Please verify your email address by visiting this link:
        ${verificationUrl}

        Or use this code: ${token}

        This link expires in 24 hours.

        If you didn't create this account, please ignore this email.

        Best regards,
        The InterX Team
      `,
    }

    // If no transporter is configured, log and return success
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('[Email Service] Email credentials not configured. In production, configure EMAIL_USER and EMAIL_PASSWORD.')
      console.log('[Email Service] Verification link would be:', verificationUrl)
      return { success: true, message: 'Email configuration needed', verificationUrl }
    }

    const result = await transporter.sendMail(mailOptions)

    console.log('[Email Service] Verification email sent successfully')
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('[Email Service] Error sending email:', error)
    throw new Error('Failed to send verification email: ' + error.message)
  }
}

/**
 * Sends welcome email after verification
 */
export async function sendWelcomeEmail(email, userName) {
  try {
    console.log('[Email Service] Sending welcome email to:', email)

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Welcome to InterX - ${userName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
          .header { background: linear-gradient(135deg, #007a78 0%, #11cd68 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
          .feature { margin: 20px 0; padding: 15px; background: #f0fdf4; border-left: 4px solid #11cd68; }
          a { color: #007a78; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to InterX!</h1>
            <p>Your account is all set and ready to go.</p>
          </div>
          <p>Hi ${userName},</p>
          <p>Thank you for verifying your email! You're now a member of the InterX community.</p>
          <div class="feature">
            <h3>✨ What's Next?</h3>
            <ul>
              <li>Complete your profile</li>
              <li>Explore interview opportunities</li>
              <li>Connect with other professionals</li>
            </ul>
          </div>
          <p><a href="https://interx.example.com/dashboard">Go to Dashboard →</a></p>
          <p>Best regards,<br>The InterX Team 🚀</p>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"InterX Team" <${process.env.EMAIL_USER || 'noreply@interx.com'}>`,
      to: email,
      subject: '🎉 Welcome to InterX - ' + userName,
      html: htmlContent,
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('[Email Service] Email credentials not configured.')
      return { success: true }
    }

    await transporter.sendMail(mailOptions)
    console.log('[Email Service] Welcome email sent successfully')
    return { success: true }
  } catch (error) {
    console.error('[Email Service] Error sending welcome email:', error)
    // Don't throw error for welcome email - it's not critical
    return { success: false, error: error.message }
  }
}

/**
 * Test email connection
 */
export async function testEmailConnection() {
  try {
    console.log('[Email Service] Testing email connection...')
    await transporter.verify()
    console.log('[Email Service] Email connection successful')
    return { success: true }
  } catch (error) {
    console.error('[Email Service] Email connection failed:', error)
    return { success: false, error: error.message }
  }
}