# OTP SMS Delivery Debugging Guide

## Quick Debug Steps

### 1. Check Recent OTP Status
```bash
curl "http://localhost:3000/api/resume-checker/debug-otp?phone=8103668703"
```

This shows:
- Latest OTP code
- Whether it's expired or active
- Number of attempts
- Verification status
- All OTP records for that number
- Twilio configuration status

### 2. Test Sending OTP
```bash
curl -X POST http://localhost:3000/api/resume-checker/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "8103668703"}'
```

### 3. Check Server Logs
Monitor the terminal/console where your Next.js server is running.

---

## What Gets Logged (Development Mode)

### Level 1: Input Validation
```
[Step 1] Raw input phoneNumber: "918 103 6670 3"
[Step 2] After removing non-digits: "9181036670"
[Step 3] ✓ Phone number validation passed
```

### Level 2: OTP Generation
```
[Step 4] Generated OTP: 537890
[Step 4] Expires at: 2026-01-15T12:45:00.000Z
```

### Level 3: Supabase Storage
```
[Step 5] Attempting to store OTP in Supabase...
[Step 5] ✓ OTP stored in Supabase
```

### Level 4: Twilio SMS
```
[Twilio] Input phoneNumber: "9181036670"
[Twilio] Input phoneNumber length: 10
[Twilio] ✓ All environment variables are set
[Twilio] Detected 10-digit number, added +91 prefix: +919181036670
[Twilio] Creating message with Twilio API...
[Twilio]   To: +919181036670
[Twilio]   From: +19789638389
[Twilio]   Body: Your verification code is: 537890. Valid for 10 minutes.
[Twilio] ✓ Message created successfully!
[Twilio] Message SID: SM46d2204725222459520296775ee020f9
[Twilio] Status: queued
```

---

## Common Issues & Fixes

### Issue 1: Phone Number Not Being Recognized
**Symptom:** Shows "918 103 6670 3" instead of "9181036670"

**Root Cause:** Phone number has spaces or special characters

**Fix:** 
- Make sure frontend sends clean phone number: `8103668703` or `+918103668703`
- Never send: `918 103 6670 3` or `0-8103-668703`

**Check in debug endpoint:**
```bash
curl "http://localhost:3000/api/resume-checker/debug-otp?phone=918 103 6670 3"
```

---

### Issue 2: OTP Stored But SMS Not Sent
**Symptom:** 
- Debug endpoint shows OTP exists: ✓
- But didn't receive SMS

**Possible Causes:**

#### A. Twilio Trial Account Restrictions
**Check:**
```bash
curl "http://localhost:3000/api/resume-checker/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "8103668703"}'
```

**Response will show:**
- SMS Status: If "error": Trial account issue
- Check Twilio console for restrictions

**Solution:**
- Upgrade from trial to paid account
- Or add verified phone numbers in Twilio dashboard

#### B. Invalid Phone Number Format
**Check in logs:** Look for `[Twilio] Final formatted phone:`

**Should be:** `+919181036670` (exactly like this)

**Not:** `+9181036670` or `918103668703` or `+91 918 1036670`

#### C. Twilio Credentials Missing
**Check in response:**
```json
{
  "twilioAccountSid": "NOT SET",
  "twilioAuthToken": "NOT SET", 
  "twilioPhoneNumber": "NOT SET"
}
```

**Solution:** Add to `.env.local`:
```env
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1_your_number_here
```

---

### Issue 3: Supabase Storage Failing
**Symptom:** 
- `[Step 5] ✗ Supabase insert error`

**Check in logs:** Look for error code and message

**Common Error Codes:**

| Code | Meaning | Fix |
|------|---------|-----|
| PGRST116 | Table doesn't exist | Run: [OTP_SETUP_SUPABASE.sql](../OTP_SETUP_SUPABASE.sql) |
| 23505 | Duplicate key | Phone number already has active OTP |
| 42501 | Permission denied | Check Supabase RLS policies |

**Solution:**
```bash
# Check if table exists in Supabase
SELECT * FROM phone_otps LIMIT 1;

# If not, run setup:
# Use OTP_SETUP_SUPABASE.sql file
```

---

### Issue 4: Authentication Failed
**Symptom:**
- Response: `"error": "Failed to send OTP"`
- In logs: Twilio auth error

**Check:**
1. Account SID is correct (no spaces)
2. Auth Token is correct (no spaces)
3. Credentials haven't changed in Twilio console

**Test Twilio Credentials:**
```bash
# Use your credentials from Twilio console
curl https://api.twilio.com/2010-04-01/Accounts \
  -u {YOUR_ACCOUNT_SID}:{YOUR_AUTH_TOKEN}
```

---

## Complete Debug Checklist

- [ ] Phone number is 10 digits (example: `8103668703`)
- [ ] `.env.local` has all three Twilio variables set
- [ ] Supabase tables exist (check: `phone_otps` table)
- [ ] Phone number formats as `+919181036670` (see logs)
- [ ] Debug endpoint shows all statuses as ✓ SET
- [ ] Twilio account is active (not trial or suspended)
- [ ] Check Twilio console: https://www.twilio.com/console/sms/logs
- [ ] Search for phone number in Twilio logs to see delivery status

---

## Testing Process

### Step 1: Verify Endpoint Works
```bash
curl "http://localhost:3000/api/resume-checker/debug-otp?phone=8103668703"
```
**Expect:** Full status report with configuration check

### Step 2: Send OTP
```bash
curl -X POST http://localhost:3000/api/resume-checker/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "8103668703"}'
```
**Expect:** 
```json
{
  "success": true,
  "testOtp": "123456",
  "smsStatus": {
    "success": true,
    "sid": "SMxxxx...",
    "status": "queued"
  }
}
```

### Step 3: Check Logs for Twilio Steps
Look for:
- `[Twilio] Final formatted phone: +919181036670`
- `[Twilio] ✓ Message created successfully!`
- `[Twilio] Status: queued`

### Step 4: Check SMS Delivery
- Wait 5-10 seconds
- Check your phone
- If not received: Check [Twilio Console SMS Logs](https://www.twilio.com/console/sms/logs)

### Step 5: Verify in Database
```bash
curl "http://localhost:3000/api/resume-checker/debug-otp?phone=8103668703"
```
Should show:
```json
{
  "latestOtp": {
    "otp": "123456",
    "status": "active",
    "verified": false
  }
}
```

---

## Reading Twilio Response Codes

| Status | Meaning | Action |
|--------|---------|--------|
| `queued` | Twilio accepted, queuing for send | Normal - wait for delivery |
| `sending` | Being sent to carrier | Normal - SMS in transit |
| `sent` | Sent to carrier | Carrier will deliver |
| `delivered` | SMS reached phone | Success ✓ |
| `failed` | Couldn't send | Check error_message |
| `undelivered` | Carrier couldn't deliver | Try different carrier/number |

---

## Still Not Working? Collect This Info

Run these and share the output:

```bash
# 1. Check OTP status
curl "http://localhost:3000/api/resume-checker/debug-otp?phone=8103668703"

# 2. Send OTP
curl -X POST http://localhost:3000/api/resume-checker/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "8103668703"}' | jq .

# 3. Check .env.local (without secrets)
echo "TWILIO_ACCOUNT_SID set: $([ -z $TWILIO_ACCOUNT_SID ] && echo NO || echo YES)"
echo "TWILIO_AUTH_TOKEN set: $([ -z $TWILIO_AUTH_TOKEN ] && echo NO || echo YES)"
echo "TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER"
```

Then check server logs for the full debug output.

---

## More Help

- [Twilio Status Codes](https://www.twilio.com/docs/sms/api/message-resource)
- [Twilio Console SMS Logs](https://www.twilio.com/console/sms/logs)
- [Check Twilio Account Status](https://www.twilio.com/console)
