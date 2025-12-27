# Supabase Email Verification Setup

## Overview
The app now uses **Supabase's built-in email authentication** for email verification. This removes the need for custom email service management and lets Supabase handle all email sending automatically.

## How It Works

### Signup Flow:
1. User signs up with email and password
2. Supabase Auth creates user but marks `email_confirmed` as `false`
3. **Supabase automatically sends a verification email** with a confirmation link
4. User clicks the link in their email
5. User is redirected to login
6. User logs in and their email is now confirmed

### Verification Flow:
- Supabase Auth handles the confirmation link automatically
- When user clicks the link, Supabase confirms the email in `auth.users`
- The app's `/auth/verify-email` endpoint marks the email as verified in the `users` table

## Setup Instructions

### 1. Enable Email Verification in Supabase Dashboard

**Go to your Supabase Project:**
1. Navigate to **Authentication** → **Email Templates**
2. You'll see the default **Confirm signup** template
3. Customize the email template if needed (or keep the default)

### 2. Configure Email Service

**Option A: Use Supabase's Default Email Service (Recommended)**
- This works out of the box and is rate-limited but free
- Go to **Authentication** → **Providers** → **Email**
- Make sure "Enable email provider" is toggled ON
- That's it! Emails will be sent automatically

**Option B: Use Custom SMTP (Gmail, SendGrid, etc.)**

If you need more control or higher email volume:

**For Gmail:**
1. Enable 2-factor authentication on your Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app-specific password (16 characters)
4. In Supabase Dashboard → **Authentication** → **SMTP Settings**:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `your-email@gmail.com`
   - Password: `your-16-char-app-password`
   - From Email: `your-email@gmail.com`
5. Click "Save"

**For SendGrid:**
1. Create a SendGrid account and API key
2. In Supabase Dashboard → **Authentication** → **SMTP Settings**:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: `your-sendgrid-api-key`
   - From Email: `noreply@yourdomain.com`
3. Click "Save"

### 3. Test Email Verification

1. Start your app: `npm run dev`
2. Go to signup page
3. Sign up with a test email
4. You should receive a verification email within seconds
5. Click the confirmation link in the email
6. You'll be redirected to login
7. Log in with your email and password
8. Email verification is complete!

## Email Template Customization

To customize the verification email:

1. In Supabase Dashboard → **Authentication** → **Email Templates**
2. Click on **Confirm signup**
3. Customize the email subject and HTML template
4. Click **Save**

**Available Variables:**
- `{{ email }}` - User's email address
- `{{ token }}` - Verification token (already in the link)
- `{{ data.user_metadata }}` - User metadata if available

## Environment Variables

No email environment variables are needed anymore! The app now relies entirely on Supabase's auth system.

If you need to send transactional emails (welcome, notifications, etc.), you can optionally keep:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

But these are **not required** for signup/verification.

## Files Modified

- `app/api/auth/signup/route.js` - Removed custom email sending, now relies on Supabase
- `app/api/auth/verify-email/route.js` - Simplified to just mark email as verified in DB
- Removed dependencies on:
  - `lib/email-service.js` (Nodemailer)
  - `lib/email-token-service.js` (custom tokens)

## Troubleshooting

### Emails not being sent
1. Check Supabase Dashboard → **Authentication** → **Email** - is it enabled?
2. Check the "Confirm signup" template exists
3. Check your SMTP settings (if using custom SMTP)
4. Look at logs in Supabase Dashboard → **Functions**

### Custom email template not working
1. Make sure HTML syntax is correct
2. Test the template by clicking "Save" - Supabase will validate it
3. Verify all required variables are included in the link

### Rate limiting
- Supabase's default email service has rate limits
- If you hit limits, set up custom SMTP with Gmail or SendGrid

## Security Notes

✅ **Email verification prevents:**
- Registration with fake/disposable emails
- Unauthorized account access via email
- Email spoofing

✅ **Supabase's built-in protection:**
- Tokens expire after 24 hours
- One-time use tokens
- Rate limiting on email sends

## Next Steps

After email verification, you can:
1. Send welcome emails after verification completes
2. Use Supabase Functions for transactional emails
3. Send password reset emails (Supabase handles this too!)
4. Send invitation emails to other users

All of these can use Supabase's SMTP settings automatically.
