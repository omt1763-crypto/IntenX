# Fix: Applicants Not Showing - SOLUTION FOUND

## The Problem

Applicants are showing **0** even though you completed 2 interviews because the **`job_applicants` table is missing critical columns**: `phone` and `resume_url`.

When the interview form submits candidate data, it includes:
- name ✅
- email ✅
- **phone** ❌ (column missing)
- position_applied ✅
- job_id ✅
- **resume_url** ❌ (column missing)
- status ✅

The database rejects the insert with a **column not found error (code 42703)**, so no applicants are saved.

## Solution: Execute This SQL in Supabase

### Step 1: Go to Supabase SQL Editor
1. Open [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **+ New Query**

### Step 2: Copy and Paste This SQL

```sql
-- Add missing columns to job_applicants table
ALTER TABLE public.job_applicants 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE public.job_applicants 
ADD COLUMN IF NOT EXISTS resume_url VARCHAR(500);

-- Ensure status has correct default
ALTER TABLE public.job_applicants 
ALTER COLUMN status SET DEFAULT 'pending';

-- Verify the fix
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_name = 'job_applicants' AND table_schema = 'public'
ORDER BY ordinal_position;
```

### Step 3: Run the Query
- Click **Run** button (blue play icon)
- Should see success with 3 columns added/verified
- The SELECT statement will show your table structure

### Step 4: Verify Table Structure
You should see these columns:
- id (UUID)
- job_id (UUID)
- name (character varying)
- email (character varying)
- **phone (character varying)** ← NEW
- position_applied (character varying)
- **resume_url (character varying)** ← NEW
- status (character varying)
- created_at (timestamp with timezone)
- updated_at (timestamp with timezone)

## Step 5: Test It Works

1. **Go to Interview Link**: `https://intenx-1.onrender.com/interview/realtime?jobId=[JOB_ID]`
   - Replace `[JOB_ID]` with one of your 3 job IDs

2. **Open Browser Console** (F12 or Ctrl+Shift+I)
   - Go to **Console** tab

3. **Fill Out the Form**:
   - Name: Test Applicant
   - Email: test@example.com
   - Phone: 555-1234
   - Position: Your job title
   - (Skip resume file for now)

4. **Submit Form**

5. **Watch Console** - Look for these success messages:
   ```
   [Interview Form] 📋 Form validation passed
   [Interview Form] 🚀 Submitting to /api/candidate-intake...
   [Interview Form] 📡 API Response status: 201
   [Interview Form] ✅ Success! Candidate saved: {candidateId: ...}
   ```

6. **Check Recruiter Dashboard**
   - Go to: `https://intenx-1.onrender.com/recruiter/dashboard/applicants`
   - Should now show **at least 1 applicant** instead of 0

## What Was Wrong

The original table was missing columns because:
1. The table was created with minimal columns: id, job_id, name, email, position_applied, status
2. The interview form code was updated to collect phone and resume_url
3. But the table schema was never updated to match

## Files Updated

- ✅ `CREATE_JOB_APPLICANTS_TABLE.sql` - Updated with phone and resume_url columns
- ✅ `FIX_APPLICANTS_TABLE_COLUMNS.sql` - Migration script with ALTER TABLE commands

## Next Steps

After applying the SQL fix:
1. Test with the interview form submission (see Step 5 above)
2. Check recruiter dashboard applicants page
3. If still seeing 0, check browser console for any error messages
4. Report the exact error message and we can debug further

---

**Need Help?** 
- Check browser console (F12) for detailed error messages during form submission
- Check Render backend logs: https://dashboard.render.com → Backend service → Logs
- Run the SELECT query to verify table columns are added correctly
