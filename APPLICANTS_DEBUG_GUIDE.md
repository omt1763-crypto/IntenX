# Debug: Applicants Still Showing 0 - Diagnostic Guide

## Current Status
- ✅ Interviews are being created (showing 1-3 interviews per job)
- ❌ But applicants page shows 0 applicants
- ❌ API fetch is returning empty data

## Why This Happens

The recruiter dashboard has TWO separate data sources:
```
Dashboard Jobs → Shows interviews count ✅
Dashboard Applicants → Shows applicants count ❌
```

The jobs count comes from queries on `interviews` table, but applicants count comes from `job_applicants` table.

## Quick Diagnostics

### Step 1: Check Supabase Data

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Paste this and run:

```sql
-- Check what's in your database
SELECT 'Jobs:' as table_name, COUNT(*) as count FROM public.jobs
UNION ALL
SELECT 'Interviews:' as table_name, COUNT(*) as count FROM public.interviews
UNION ALL
SELECT 'Applicants:' as table_name, COUNT(*) as count FROM public.job_applicants;

-- Show all applicants
SELECT * FROM public.job_applicants ORDER BY created_at DESC LIMIT 10;

-- Show all interviews
SELECT id, job_id, position, status, created_at FROM public.interviews ORDER BY created_at DESC LIMIT 10;
```

**What you should see:**
- If applicants table is EMPTY → applicants aren't being created
- If applicants table has DATA → API fetch is broken

---

### Step 2: Check Backend Logs

Go to **Render Dashboard** → Your **Backend Service** → **Logs**

Search for: `[SaveInterview API]` or `[GetApplicants API]`

**Look for these success messages:**
```
[SaveInterview API] ✅ New applicant created for interview: [UUID]
```

**Or these error messages:**
```
[SaveInterview API] Error creating applicant record: ...
[GetApplicants API] Error fetching applicants: ...
```

---

### Step 3: Check API Response

1. Open **Browser Console** (F12 → Console tab)
2. Go to recruiter dashboard: `https://intenx-1.onrender.com/recruiter/dashboard/applicants`
3. Look for logs like:
   ```
   [ApplicantsPage] API response: {success: true, data: Array(0)}
   ```

**If data is empty:** API returned empty array ← problem is in query or data insertion

---

## Most Likely Issues

### Issue 1: Applicants Not Being Inserted
**Symptoms:**
- Supabase `job_applicants` table is EMPTY
- Render logs show: `Error creating applicant record: ...`

**Fix:**
1. Check error message in Render logs
2. Most common: Column doesn't exist
3. Go to Supabase → `job_applicants` table → check columns
4. Ensure these exist:
   - `id` (UUID)
   - `job_id` (UUID)
   - `name` (text)
   - `email` (text)
   - `phone` (text) ← We added this
   - `interview_id` (UUID)
   - `status` (text)
   - `created_at` (timestamp)

If missing, run the fix SQL from `FIX_APPLICANTS_TABLE_COLUMNS.sql`

---

### Issue 2: Applicants Exist But Not Fetching
**Symptoms:**
- Supabase `job_applicants` table HAS DATA
- API returns empty array

**Fix:**
Check `/api/get-applicants` logs:
```
[GetApplicants API] Found recruiter jobs: X jobs
[GetApplicants API] Filtering by job IDs: [...]
[GetApplicants API] Applicants fetched: 0
```

**Common causes:**
1. **Wrong recruiter_id** - recruiter_id doesn't match logged-in user
2. **Wrong job ownership** - applicant's job_id doesn't match recruiter's jobs
3. **RLS policy** - Table has RLS and it's blocking reads

---

### Issue 3: Interview Creation Logging

To see if interviews are actually creating applicants, check Render logs for:

```
[SaveInterview API] ✅ New applicant created for interview: 550e8400-e29b-41d4-a716-446655440000
```

If you DON'T see this message, one of these is true:
1. Interview doesn't have `job_id` 
2. Interview has `applicant_id` (so it takes first branch, not auto-create)
3. Database insert failed silently

---

## Step-by-Step Fix

### Step 1: Verify Table Structure
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'job_applicants' AND table_schema = 'public'
ORDER BY ordinal_position;
```

Expected columns:
- id, job_id, name, email, phone, position_applied, resume_url, interview_id, status, created_at

### Step 2: Check Data Exists
```sql
SELECT COUNT(*) as total_applicants FROM public.job_applicants;
SELECT * FROM public.job_applicants LIMIT 5;
```

### Step 3: Check API Fetch
Go to recruiter dashboard and look at browser console. Copy-paste the API call:
```
/api/get-applicants?recruiterId=YOUR_RECRUITER_ID
```

### Step 4: Test Fresh Interview
1. Go to interview link with jobId
2. Complete interview
3. Check Render logs immediately
4. Check Supabase `job_applicants` table for new row
5. Refresh recruiter dashboard

---

## SQL Verification Script

Run this in Supabase SQL Editor to see everything:

```sql
-- See jobs for your recruiter
SELECT id, title, recruiter_id, created_at FROM public.jobs ORDER BY created_at DESC;

-- See interviews linked to those jobs
SELECT id, job_id, position, status, created_at FROM public.interviews 
WHERE job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = 'YOUR_RECRUITER_ID')
ORDER BY created_at DESC;

-- See applicants for those jobs
SELECT id, name, email, job_id, interview_id, status FROM public.job_applicants
WHERE job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = 'YOUR_RECRUITER_ID')
ORDER BY created_at DESC;
```

---

## Enable Debug Logging

The API now has enhanced logging. Check Render logs for detailed output:
```
[GetApplicants API] 📥 Request received
[GetApplicants API] recruiterId: ca403627-...
[GetApplicants API] Found recruiter jobs: 3 jobs
[GetApplicants API] ✅ Applicants fetched: 5
[GetApplicants API] Applicant details: [...]
```

---

## If Still Stuck

1. **Copy your recruiter ID** from dashboard logs
2. **Check Supabase** `job_applicants` table manually
3. **Check Render logs** for exact error messages
4. **Try the verification SQL script** to see actual database state
5. **Test with manual SQL insert** to verify table works:

```sql
INSERT INTO public.job_applicants (
  job_id, name, email, position_applied, status
) VALUES (
  'JOB_UUID_HERE',
  'Test User',
  'test@example.com',
  'Test Position',
  'completed'
);
```

If manual insert works but auto-create from API fails, the issue is in the API code logic or permissions.

---

**Next:** Check Supabase directly with verification script to see if data exists. If it does, issue is fetch. If it doesn't, issue is creation.
