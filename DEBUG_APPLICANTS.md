# Debugging Applicants Not Showing

## Problem
Applicants page shows 0 applicants even after candidates complete interviews.

## Root Causes Identified

### 1. ✅ FIXED: Auth State Clearing
**Issue**: Auth state was being cleared when Supabase sent `INITIAL_SESSION` event with no session
**Fix**: Modified AuthContext to only clear auth on explicit `SIGNED_OUT` event, not on `INITIAL_SESSION`
**Status**: DEPLOYED

### 2. ⚠️ Candidate Data Not Being Saved
**Issue**: `/api/candidate-intake` might fail silently due to missing columns or validation errors
**Improvements Made**:
- Added detailed error logging with error codes
- Added column mismatch detection (error code 42703)
- Added table missing detection (error code 42P01)
- Log all insert attempts with full data payload

## How to Test

### Step 1: Check if Candidate Form Is Being Submitted
1. Go to interview link: `https://intenx-1.onrender.com/interview/realtime?jobId=YOUR_JOB_ID`
2. Fill in candidate form (name, email, phone, position)
3. Click "Start Interview"
4. **Check browser console for**: `[Interview] Candidate info saved: {id, message}`

### Step 2: Check API Response
If form doesn't submit:
1. Open Browser DevTools → Network tab
2. Filter for `candidate-intake` requests
3. Check if request succeeded (200-201) or failed (400-500)
4. Check response body for error messages

Example success response:
```json
{
  "success": true,
  "message": "Candidate information saved successfully",
  "candidateId": "uuid-here"
}
```

Example error response:
```json
{
  "error": "Column error: column \"phone\" does not exist. Expected columns: id, name, email, phone, position_applied, job_id, resume_url, status, created_at"
}
```

### Step 3: Check Backend Logs
Check Render backend logs for:
```
[CandidateIntake] Received: { name, email, phone, position, jobId }
[CandidateIntake] Attempting to insert with data: { ... }
[CandidateIntake] ✅ Candidate successfully saved: uuid
```

### Step 4: Check Database Directly
In Supabase:
1. Go to `job_applicants` table
2. Look for records with:
   - Your job's `job_id`
   - Candidate `name`, `email`, `phone`
   - `created_at` within last few minutes

## Possible Issues & Solutions

### Issue 1: `job_applicants` Table Missing Columns
**Error**: `Column error: column \"phone\" does not exist`

**Solution**: Update table schema in Supabase:
```sql
-- Add missing columns
ALTER TABLE job_applicants
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS position_applied VARCHAR(255),
ADD COLUMN IF NOT EXISTS resume_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Verify columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'job_applicants';
```

### Issue 2: `job_applicants` Table Doesn't Exist
**Error**: `Database table not set up...`

**Solution**: Create table:
```sql
CREATE TABLE job_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  position_applied VARCHAR(255),
  resume_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_job_applicants_job_id ON job_applicants(job_id);
CREATE INDEX idx_job_applicants_email ON job_applicants(email);
```

### Issue 3: RLS (Row Level Security) Blocking Inserts
**Error**: `new row violates row level security policy`

**Solution**: Disable or adjust RLS for `job_applicants` table:
```sql
-- Check current RLS status
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'job_applicants';

-- Disable RLS (not recommended for production)
ALTER TABLE job_applicants DISABLE ROW LEVEL SECURITY;

-- Or create RLS policy to allow inserts
CREATE POLICY "Allow anyone to insert applicants" ON job_applicants
  FOR INSERT
  WITH CHECK (true);
```

### Issue 4: jobId Not Being Sent
**Check**: In browser console, verify form submission logs:
```
[Interview] Candidate info saved: { ..., candidateId: "..." }
```

If no log appears, form validation is failing. Check browser console for:
```
[Interview] Error saving candidate info: ...
```

## Expected Flow

```
1. Candidate opens interview link
   ↓
2. Candidate fills form (name, email, phone, position)
   ↓
3. Form submits to /api/candidate-intake (POST)
   ↓
4. API inserts to job_applicants table
   ↓
5. Response: { success: true, candidateId: "..." }
   ↓
6. Interview starts
   ↓
7. Later: Recruiter views applicants dashboard
   ↓
8. Applicants list populated from job_applicants table
```

## Monitoring

Add this to your browser console to monitor saves in real-time:
```javascript
// Listen for all fetch requests to /api/candidate-intake
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('candidate-intake')) {
    console.log('[Monitor] Candidate intake request:', args);
  }
  return originalFetch.apply(this, args);
};
```

## Next Steps

1. **Test with fresh interview**: Have a candidate fill out form and start interview
2. **Check browser console** for success/error messages
3. **If error**: Copy exact error message and check solutions above
4. **If successful but not showing**: Check database directly in Supabase
5. **Report** exact error message if still stuck
