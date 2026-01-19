# Step-by-Step Guide to Fix the Resume Analyzer 500 Error

## ⚡ Quick Summary
Your resume analyzer API is returning a **500 error**. The API route has been updated with **detailed logging** to help diagnose the issue. The most likely cause is that `OPENAI_API_KEY` is not set in your Vercel environment variables.

---

## 🔧 SOLUTION: Set OPENAI_API_KEY in Vercel

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add OPENAI_API_KEY
1. Click **"Add Environment Variable"**
2. Name: `OPENAI_API_KEY`
3. Value: Paste your actual OpenAI API key (starts with `sk-proj-`)
4. Select all environments (Production, Preview, Development)
5. Click **"Save"**

### Step 3: Redeploy
1. Go to **Deployments**
2. Click **"Redeploy"** on your latest deployment
3. Wait for deployment to complete (usually 2-5 minutes)

### Step 4: Test
Try uploading a resume again. The API should now work!

---

## 🔍 How to Check if It's Working

### Method 1: Check Vercel Logs (Recommended)
1. In Vercel dashboard, go to **Deployments**
2. Click on your latest deployment
3. Click on the **"Logs"** tab at the top
4. Look for messages starting with `[Resume Tracker]`

**What to look for:**
✅ `[Resume Tracker] ✅ OPENAI_API_KEY is configured` = Good!
❌ `[Resume Tracker] FATAL: OPENAI_API_KEY is not set` = Need to set it!

### Method 2: Use the Test Scripts (Local Testing)

#### PowerShell Test:
```powershell
# If testing locally:
$env:OPENAI_API_KEY = "sk-proj-your-actual-key"
cd "c:\Users\omt91\Downloads\main"
. "test-api-enhanced.ps1"

# If testing against Vercel:
. "test-api-enhanced.ps1" -Endpoint "https://your-domain.vercel.app/api/resume-tracker/analyze"
```

#### Node.js Test (Direct OpenAI):
```powershell
$env:OPENAI_API_KEY = "sk-proj-your-actual-key"
cd "c:\Users\omt91\Downloads\main"
node test-openai-direct.js
```

---

## 📋 What Was Fixed/Enhanced

The API route has been updated with **better error logging** to help diagnose issues:

### Logging Added:
1. ✅ Checks if OPENAI_API_KEY is set
2. ✅ Shows key length and prefix
3. ✅ Logs all request details
4. ✅ Shows OpenAI response status
5. ✅ Captures full error messages with stack traces
6. ✅ Identifies specific error types (401, 429, 402, etc.)

### File Updated:
📁 `app/api/resume-tracker/analyze/route.ts`

---

## 🚨 If It Still Doesn't Work

### Check These Things:

1. **API Key Format**
   - Should start with `sk-proj-`
   - Should be at least 40+ characters
   - No spaces or extra characters

2. **OpenAI Account**
   - Visit https://platform.openai.com/account/usage/overview
   - Check if you have available credits
   - Check if your account is in good standing

3. **Vercel Logs**
   - Deployment → Logs
   - Look for error messages
   - Check the exact error from OpenAI

4. **Try a Different Resume**
   - Very large PDFs might timeout
   - Try a simpler text-based resume first

---

## 📝 Testing Locally (Optional)

If you want to fully test before deploying:

```powershell
# 1. Set your API key
$env:OPENAI_API_KEY = "sk-proj-YOUR_KEY_HERE"

# 2. Start the Next.js dev server (in another terminal)
cd "c:\Users\omt91\Downloads\main\interviewverse_frontend"
npm run dev

# 3. Wait for server to start (usually opens on http://localhost:3000)

# 4. In a new terminal, run the test
cd "c:\Users\omt91\Downloads\main"
. "test-api-enhanced.ps1" -Endpoint "http://localhost:3000/api/resume-tracker/analyze"
```

---

## 🎯 Expected Success

When working correctly, you should see:

### In Browser:
```json
{
  "success": true,
  "analysis": {
    "overallScore": 78,
    "atsScore": 85,
    "strengths": ["Technical skills", "Experience", ...],
    "weaknesses": ["Missing keywords", ...],
    ...
  },
  "phoneNumber": "your-number",
  "createdAt": "2026-01-15T..."
}
```

### In Vercel Logs:
```
[Resume Tracker] ✅ OPENAI_API_KEY is configured
[Resume Tracker] Key length: 48
[Resume Tracker] Making OpenAI API call with model: gpt-4o-mini
[Resume Tracker] Request details:
  - Model: gpt-4o-mini
  - Resume text length: 1245
  - Has job description: true
[Resume Tracker] ✅ OpenAI response received successfully
[Resume Tracker] Response length: 2847
[Resume Tracker] ✅ Successfully parsed OpenAI response as JSON
[Resume Tracker] Parsed keys: atsScore, strengths, weaknesses, ...
```

---

## 📞 Need Help?

If you're still seeing errors:

1. **Share the full error message** from Vercel Logs
2. **Check the "Details"** field in the error response
3. **Common errors:**
   - `"API key appears to be invalid or expired"` → Wrong/expired key
   - `"Your OpenAI account has reached its usage limit"` → Add credits
   - `"Please try again in a few moments"` → Rate limit, wait and retry
   - `"Failed to parse resume analysis response"` → OpenAI returned invalid JSON

---

## 📚 Files Updated

1. ✅ **app/api/resume-tracker/analyze/route.ts** - Enhanced with detailed logging
2. ✅ **test-api-enhanced.ps1** - PowerShell test script
3. ✅ **test-openai-direct.js** - Direct OpenAI test
4. ✅ **RESUME_ANALYZER_ERROR_GUIDE.md** - Detailed technical guide

All ready for diagnosis and testing!
