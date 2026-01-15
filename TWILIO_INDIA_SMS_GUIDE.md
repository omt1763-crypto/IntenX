# Twilio SMS for Indian Numbers - Setup Guide

## ✅ Your Twilio Setup IS Working!

You've already confirmed it works with the curl command. The code now implements the exact same logic.

## Environment Variables Needed

Add these to your `.env.local`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1_your_twilio_number_here
```

**Where to find these:**
1. Log in to Twilio Console: https://www.twilio.com/console
2. Find your Account SID and Auth Token on the dashboard
3. Find your phone number under Explore Products → Phone Numbers → Manage Numbers

## How It Works (Based on Your Curl Test)

### Curl Test (You Already Did):
```bash
curl 'https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages.json' \
  -X POST \
  --data-urlencode 'To=+918103668703' \
  --data-urlencode 'From=+1_your_twilio_number' \
  --data-urlencode 'Body=hy' \
  -u {ACCOUNT_SID}:{AUTH_TOKEN}
```

**Result: 201 CREATED** ✅ (Message queued successfully)

### Our Code Does The Same:
```javascript
const message = await client.messages.create({
  to: '+918103668703',        // Indian number with country code
  from: '+1_your_twilio_number', // Your Twilio number
  body: 'Your code: 123456'
})
```

## Phone Number Format

The code now handles:
- **10 digits** (e.g., `8103668703`) → Converts to `+918103668703`
- **11 digits starting with 0** (e.g., `08103668703`) → Converts to `+918103668703`
- **Already formatted** (e.g., `+918103668703`) → Uses as-is

## Testing

### 1. Test via API
```bash
curl -X POST http://localhost:3000/api/resume-checker/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "8103668703"}'
```

### 2. Check Development Response
In development mode, you'll get:
```json
{
  "success": true,
  "testOtp": "123456",
  "smsStatus": {
    "success": true,
    "sid": "SM46d2204725222459520296775ee020f9",
    "status": "queued",
    "to": "+918103668703",
    "from": "+1_your_twilio_number"
  }
}
```

### 3. Check Logs
The API logs will show:
```
[Twilio] Attempting to send SMS...
[Twilio] To: +918103668703
[Twilio] From: +1_your_twilio_number
[Twilio] ✓ SMS created successfully!
[Twilio] Message SID: SM46d2204725222459520296775ee020f9
[Twilio] Status: queued
```

## Message Status Meanings

- **queued** - Message has been accepted by Twilio, waiting to send
- **sending** - Message is being sent to carrier
- **sent** - Message delivered to carrier
- **delivered** - Message received by phone
- **failed** - Message failed to send
- **undelivered** - Carrier couldn't deliver message

The initial status is usually `queued` - delivery happens in seconds!

## Troubleshooting

### Not Receiving SMS?
1. ✅ Verify number format: Should be `+91XXXXXXXXXX` for India
2. ✅ Check Twilio trial account status (trial accounts might have restrictions)
3. ✅ Check Twilio logs: https://www.twilio.com/console/sms/logs
4. ✅ Look at the SID in response - search it in Twilio console

### Invalid Phone Number Error?
- Make sure you're sending 10 digits without country code
- Or send full `+91XXXXXXXXXX` format
- The code handles both!

### Authentication Failed?
- Double-check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- These are sensitive - keep them in `.env.local` only
- Never commit to git!

### Testing:
```bash
curl -X POST http://localhost:3000/api/resume-checker/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "8103668703"}'
```

The code now uses the exact same logic as your successful curl request! Messages will be queued and delivered within seconds. 📱
