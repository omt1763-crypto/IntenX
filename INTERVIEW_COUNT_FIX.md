# Interview Count Issue: Diagnosis & Solution

## The Problem

Your dashboard shows "Interviews Conducted: 0" even though there are 20 interviews in the system.

## Root Cause

The 20 interviews exist in the database, but **they don't have `job_id` values**. Here's why:

1. **New Code Includes job_id**: The interview save code now includes `job_id` when saving (line 448 of `app/interview/realtime/page.tsx`)
2. **API Filters by job_id**: The dashboard fetches interviews filtered by `job_id` (the API query: `.in('job_id', jobIds)`)
3. **Old Interviews Missing job_id**: The 20 existing interviews were likely saved before the `job_id` field was being captured, OR they were saved from interview sessions that didn't have a job context

Result: The API finds interviews with matching job_ids = NONE (because old interviews have NULL job_id)

## How to Diagnose

1. Go to: **http://localhost:3000/debug/fix-interviews**
2. Click "Run Diagnostics"
3. You'll see:
   - How many jobs you have
   - How many interviews have job_id (should match dashboard count)
   - How many interviews DON'T have job_id (these are the missing ones)

## How to Fix

After running diagnostics:

1. Select one of your jobs from the "Select Job to Link To" dropdown
2. Click "Fix All [N] Interviews" (where [N] is the number without job_id)
3. The system will automatically link all those interviews to the selected job
4. Go back to your dashboard and refresh
5. The interview count should now show correctly!

## Technical Details

### Interview Save Flow (Fixed)
```javascript
// In app/interview/realtime/page.tsx, line 447-448
const interviewDataToSave = {
  job_id: jobId || null,  // <-- This captures the job context
  applicant_id: applicantId || null,
  // ... other fields
}
```

### Dashboard Filter (Fixed)
```javascript
// In app/api/get-interviews/route.js, line 34-39
const result = await supabaseAdmin
  .from('interviews')
  .select('*')
  .in('job_id', jobIds)  // <-- Filters to only recruiter's jobs
```

### Diagnostic API
```javascript
// GET /api/fix-interview-job-ids?recruiterId={userId}
// Returns: count of interviews with/without job_id

// POST /api/fix-interview-job-ids
// Body: { recruiterId, jobId }
// Links all interviews without job_id to the specified job
```

## Future Prevention

From now on:
- All new interviews will be saved with their associated `job_id`
- The dashboard will correctly count and display all interviews
- You can navigate from the applicant view to see interview analysis

## If you still see 0 interviews after fixing:

1. **Refresh the page** (browser cache)
2. **Check browser console** (F12 → Console) for error messages
3. **Run diagnostics again** to confirm the fix worked
4. **Verify your job exists** - Make sure you created at least one job in your dashboard

## Questions?

The enhanced logging in the API will show you exactly what's happening:
- Check browser console (F12) after visiting the dashboard
- Look for logs like: `[GetInterviews API] Found 0 job IDs` or `[GetInterviews API] Found 20 interviews for recruiter jobs`
