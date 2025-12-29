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
 * Sends welcome email after successful signup
 */
export async function sendWelcomeEmail(email, firstName, role = 'candidate') {
  try {
    console.log('[Email Service] Sending welcome email to:', email)

    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
    const dashboardUrl = role === 'candidate' 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://intenx-1.onrender.com'}/candidate/dashboard`
      : role === 'recruiter'
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://intenx-1.onrender.com'}/recruiter/dashboard`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'https://intenx-1.onrender.com'}/business/dashboard`

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to IntenX - ${firstName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6366f1 0%, #5b4fe3 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
          .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #333; }
          .message { font-size: 14px; line-height: 1.8; margin-bottom: 20px; color: #666; }
          .features { margin: 30px 0; }
          .feature-item { padding: 15px; margin: 10px 0; background: #f8f9ff; border-left: 4px solid #6366f1; border-radius: 4px; }
          .feature-item strong { color: #6366f1; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 25px 0; text-align: center; }
          .button:hover { background: #5b4fe3; opacity: 0.95; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          .footer p { margin: 5px 0; }
          .link { color: #6366f1; text-decoration: none; }
          .link:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to IntenX!</h1>
            <p>Your account is ready to go</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hi ${firstName},</p>
            
            <p class="message">Thank you for signing up as a <strong>${roleLabel}</strong> on IntenX! We're excited to have you on board.</p>
            
            <p class="message">IntenX is an AI-powered interview platform that helps professionals ace their interviews and companies find the best talent. Here's what you can do:</p>
            
            <div class="features">
              ${role === 'candidate' ? `
              <div class="feature-item">
                <strong>💬 Practice Interviews</strong><br>
                Take unlimited mock interviews in practice mode to prepare for real interviews.
              </div>
              <div class="feature-item">
                <strong>📊 Real-time Feedback</strong><br>
                Get instant AI analysis and personalized suggestions to improve your performance.
              </div>
              <div class="feature-item">
                <strong>📈 Track Progress</strong><br>
                Monitor your improvements over time and build confidence.
              </div>
              <div class="feature-item">
                <strong>🎯 Apply with Confidence</strong><br>
                Interview with real job opportunities when you're ready.
              </div>
              ` : role === 'recruiter' ? `
              <div class="feature-item">
                <strong>📋 Post Jobs</strong><br>
                Create job postings and manage applications all in one place.
              </div>
              <div class="feature-item">
                <strong>🤖 AI Screening</strong><br>
                Let our AI conduct initial interviews and assess candidates automatically.
              </div>
              <div class="feature-item">
                <strong>📊 Detailed Analytics</strong><br>
                Get comprehensive assessments and scoring for every candidate.
              </div>
              <div class="feature-item">
                <strong>⏱️ Save Time</strong><br>
                Reduce hiring time by 70% and focus only on qualified candidates.
              </div>
              ` : `
              <div class="feature-item">
                <strong>👥 Manage Recruiters</strong><br>
                Control your recruiting team and monitor their activities.
              </div>
              <div class="feature-item">
                <strong>📊 Company Analytics</strong><br>
                Track hiring metrics and optimize your recruitment process.
              </div>
              <div class="feature-item">
                <strong>🎯 Bulk Hiring</strong><br>
                Scale your hiring efforts and reduce time-to-hire significantly.
              </div>
              <div class="feature-item">
                <strong>💼 Team Collaboration</strong><br>
                Work seamlessly with your team and stakeholders.
              </div>
              `}
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            </div>
            
            <p class="message">If you have any questions, feel free to reach out to our support team at <strong>support@intenx.com</strong> or visit our <a href="https://intenx-1.onrender.com" class="link">website</a>.</p>
            
            <p class="message" style="margin-bottom: 0;">Happy interviewing! 🚀<br><strong>The IntenX Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>IntenX - AI-Powered Interview Platform</strong></p>
            <p>© ${new Date().getFullYear()} IntenX. All rights reserved.</p>
            <p>
              <a href="https://intenx-1.onrender.com" class="link">Website</a> | 
              <a href="https://intenx-1.onrender.com/privacy" class="link">Privacy Policy</a> | 
              <a href="https://intenx-1.onrender.com/terms" class="link">Terms of Service</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px; color: #999;">This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"IntenX Team" <${process.env.EMAIL_USER || 'noreply@intenx.com'}>`,
      to: email,
      subject: `🎉 Welcome to IntenX, ${firstName}!`,
      html: htmlContent,
      text: `
Welcome to IntenX!

Hi ${firstName},

Thank you for signing up as a ${roleLabel} on IntenX! Your account is now active.

Go to your dashboard: ${dashboardUrl}

If you have any questions, contact us at support@intenx.com

Best regards,
The IntenX Team 🚀
      `,
    }

    // If no email credentials configured, just log and return success
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('[Email Service] Email credentials not configured. In production, configure EMAIL_USER and EMAIL_PASSWORD.')
      console.log('[Email Service] Welcome email would be sent to:', email)
      return { success: true, message: 'Email service not configured' }
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('[Email Service] Welcome email sent successfully to:', email)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('[Email Service] Error sending welcome email:', error)
    // Return success anyway - don't block signup if email fails
    return { success: false, error: error.message }
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