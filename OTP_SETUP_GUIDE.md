# OTP Integration Setup Guide

## Overview
This guide walks you through setting up OTP (One-Time Password) verification with Supabase and SMS integration using Twilio.

## Step 1: Create Supabase Tables

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the SQL from `OTP_SETUP_SUPABASE.sql`
5. Click **Run**

This creates:
- `phone_otps` - Stores OTP codes with expiration
- `verified_phones` - Tracks verified phone numbers

## Step 2: Set Environment Variables

### Get Supabase Credentials
1. Go to **Settings** → **API**
2. Copy **Project URL** and **Service Role Key**
3. Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Setup Twilio (Optional - for production SMS)
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Get your **Account SID**, **Auth Token**, and **Phone Number**
3. Add to `.env.local`:

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Step 3: Update API Routes

Replace the old route files with the new Supabase-integrated versions:

```bash
# Backup old files
mv app/api/resume-checker/send-otp/route.ts app/api/resume-checker/send-otp/route-old.ts
mv app/api/resume-checker/verify-otp/route.ts app/api/resume-checker/verify-otp/route-old.ts

# Use new files
mv app/api/resume-checker/send-otp/route-new.ts app/api/resume-checker/send-otp/route.ts
mv app/api/resume-checker/verify-otp/route-new.ts app/api/resume-checker/verify-otp/route.ts
```

## Step 4: Test OTP Flow

1. **Development Mode**: Open browser console (F12) and look for the test OTP
   - The OTP will be logged in console and shown in API response
   - Use this OTP to test the verification flow

2. **Production Mode**: 
   - OTP is only stored in database
   - Implement Twilio SMS integration (uncomment code in route.ts files)
   - Uncomment the `sendSmsWithTwilio` function

## Step 5: Implement Twilio SMS (Optional)

In `app/api/resume-checker/send-otp/route.ts`, uncomment and complete:

```typescript
// Uncomment this line to send actual SMS
// await sendSmsWithTwilio(phoneNumber, otp)

// Complete the function implementation
async function sendSmsWithTwilio(phoneNumber: string, otp: string) {
  const twilio = require('twilio')
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )

  await client.messages.create({
    body: `Your IntenX Scanner verification code is: ${otp}. Valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+${phoneNumber}`,
  })
}
```

## Features

✅ **Secure OTP Storage**: OTPs stored in Supabase with expiration  
✅ **Rate Limiting**: Max 5 verification attempts per OTP  
✅ **Auto-Expiration**: OTPs expire after 10 minutes  
✅ **Development Mode**: Test OTP visible in console  
✅ **Production Ready**: Clean SMS integration with Twilio  
✅ **Phone Verification Tracking**: Track verified phone numbers  

## Testing Checklist

- [ ] Supabase tables created successfully
- [ ] Environment variables added to `.env.local`
- [ ] Can request OTP in development mode
- [ ] OTP appears in browser console
- [ ] Can verify with correct OTP
- [ ] Verification fails with wrong OTP
- [ ] OTP expires after 10 minutes
- [ ] Rate limiting works (max 5 attempts)

## Troubleshooting

### "Table not found" error
- Run the SQL setup script in Supabase Dashboard
- Make sure you're using the correct Supabase project

### "Missing environment variables"
- Check `.env.local` has all required variables
- Restart Next.js dev server after adding variables
- Make sure variables match your Supabase project

### OTP not storing in database
- Check Supabase table permissions (RLS policies)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check logs in Supabase Dashboard

### SMS not sending (Twilio)
- Verify Twilio credentials in `.env.local`
- Check Twilio phone number format: `+1234567890`
- View Twilio logs for delivery failures

## File Structure

```
app/api/resume-checker/
├── send-otp/
│   ├── route.ts (NEW - Supabase integration)
│   └── route-old.ts (backup)
├── verify-otp/
│   ├── route.ts (NEW - Supabase integration)
│   └── route-old.ts (backup)

components/resume-checker/
├── PhoneVerification.tsx (UPDATED - New theme colors)

lib/
├── supabase-client.ts (NEW)

OTP_SETUP_SUPABASE.sql (NEW - DB setup)
OTP_SETUP_GUIDE.md (this file)
```

## Next Steps

1. ✅ Set up Supabase tables
2. ✅ Add environment variables
3. ✅ Update API routes
4. ✅ Test OTP flow
5. ✅ (Optional) Integrate Twilio for production SMS
6. ✅ Deploy to production

Happy coding! 🚀
