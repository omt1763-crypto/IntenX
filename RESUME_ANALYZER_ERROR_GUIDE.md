# Resume Analyzer API - 500 Error Diagnosis Guide

## The Error You're Experiencing

```
/api/resume-tracker/analyze: Failed to load resource: the server responded with a status of 500
Analysis error: Error: Failed to analyze resume
```

## Root Cause Analysis

The API route has been enhanced with **detailed diagnostic logging** to help identify the exact issue. The 500 error can be caused by one of these problems:

### 1. **OPENAI_API_KEY Not Set or Invalid** (Most Likely)
- The API checks if `OPENAI_API_KEY` environment variable exists
- In Vercel, you must set this in Project Settings → Environment Variables
- The key must start with `sk-proj-`

**Check in Vercel:**
1. Go to your project settings
2. Select "Environment Variables"
3. Verify `OPENAI_API_KEY` is set
4. The value should look like: `sk-proj-xxxxxxxxxxxxxxxxxxx`
5. Redeploy after setting the variable

### 2. **Invalid or Expired API Key**
- Even if the key is set, it might be invalid or expired
- OpenAI returns a 401 error which the API catches and returns as 500

**Check your OpenAI Account:**
1. Go to https://platform.openai.com/api-keys
2. Verify your API key is active
3. Check that your account has available credits
4. Look for any usage limits or quota issues

### 3. **OpenAI Rate Limit or Quota Exceeded**
- If you've made too many requests, OpenAI returns 429 (rate limit)
- If your account reached its spending limit, you get a 402 error

**Solution:**
- Wait a few minutes before retrying
- Check your OpenAI usage dashboard
- Add credits to your OpenAI account if needed

### 4. **PDF Extraction Issues** (If uploading PDF)
- The `pdf-parse` library might fail on certain PDF formats
- Try copying the text manually instead

### 5. **OpenAI Response Not Valid JSON**
- OpenAI should return a JSON response, but sometimes returns something else
- This causes a parse error

## How to Debug

### Step 1: Check Server Logs in Vercel

1. Go to your Vercel project dashboard
2. Click on "Deployments"
3. Select your active deployment
4. Click on "Logs"
5. Look for messages starting with `[Resume Tracker]`

The enhanced logging will show:
```
[Resume Tracker] ✅ OPENAI_API_KEY is configured
[Resume Tracker] Key length: 48
[Resume Tracker] Key starts with sk-proj: true
[Resume Tracker] Making OpenAI API call with model: gpt-4o-mini
[Resume Tracker] ✅ OpenAI response received successfully
```

If you see:
```
[Resume Tracker] FATAL: OPENAI_API_KEY is not set in environment variables
```
Then the environment variable is not set in Vercel.

### Step 2: Test Locally (Optional)

If you want to test locally with your API key:

```powershell
# Set the API key for this session
$env:OPENAI_API_KEY = "your-actual-api-key-here"

# Run the enhanced test
. "test-api-enhanced.ps1"
```

Or test directly against Vercel:

```powershell
. "test-api-enhanced.ps1" -Endpoint "https://your-vercel-domain.vercel.app/api/resume-tracker/analyze"
```

### Step 3: Direct OpenAI Test

To verify OpenAI itself is working:

```powershell
# Set your API key
$env:OPENAI_API_KEY = "your-actual-api-key-here"

# Run the direct OpenAI test
node test-openai-direct.js
```

This will:
- Check if the API key is set
- Send a request directly to OpenAI
- Show you exactly what OpenAI responds with

## Quick Fix Checklist

- [ ] OPENAI_API_KEY is set in Vercel Environment Variables
- [ ] The API key value starts with `sk-proj-`
- [ ] OpenAI account has available credits
- [ ] No rate limits or quota issues on OpenAI account
- [ ] Redeploy the Vercel project after setting env variables
- [ ] Check Vercel logs for `[Resume Tracker]` messages

## Testing Files Created

1. **test-api-enhanced.ps1** - PowerShell script to test the API endpoint
2. **test-openai-direct.js** - Node.js script to test OpenAI directly
3. **test-endpoint.js** - Alternative JavaScript test

## Expected Success Response

```json
{
  "success": true,
  "analysis": {
    "overallScore": 78,
    "atsScore": 82,
    "strengths": ["Strong technical background", "Good experience", ...],
    "weaknesses": [...],
    ...
  },
  "phoneNumber": "test-user-123",
  "createdAt": "2026-01-15T..."
}
```

## Still Having Issues?

Check the detailed logs in [api/resume-tracker/analyze/route.ts](app/api/resume-tracker/analyze/route.ts) at these key logging points:

1. **Line 38-41**: API key validation
2. **Line 41-44**: Key diagnostics
3. **Line 87-99**: OpenAI request details
4. **Line 150-152**: Response received confirmation
5. **Line 168-183**: Error details with stack trace

The logging will tell you exactly which step failed and why.
