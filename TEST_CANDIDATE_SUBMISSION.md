# Testing Candidate Form Submission & Applicant Tracking

## Step-by-Step Testing Guide

### 1. **Prepare**
- Open your recruiter dashboard
- Create a new job OR use an existing job
- Copy the interview link

### 2. **Open Interview Link**
- Open the interview link in an **incognito/private window** (different from recruiter session)
- You should see the candidate intake form with fields:
  - Full Name
  - Email Address
  - Phone Number
  - Position Applying For

### 3. **Fill Out Form**
```
Name: John Doe
Email: john.doe@example.com
Phone: +1 (555) 123-4567
Position: Senior React Developer
```

### 4. **Open Browser Console** (F12 → Console Tab)
Before clicking "Start Interview", keep console open and watch for these logs:

#### **Frontend Logs (You should see):**
```
[Interview Form] 📋 Form validation passed
[Interview Form] Candidate info: { name: "John Doe", email: "john.doe@example.com", ... }
[Interview Form] 🚀 Submitting to /api/candidate-intake...
[Interview Form] 📡 API Response status: 201
[Interview Form] 📡 API Response ok: true
[Interview Form] ✅ Success! Candidate saved: { success: true, message: "...", candidateId: "..." }
```

#### **Backend Logs (Check Render Console):**
Go to your Render dashboard → Your backend service → Logs

You should see:
```
════════════════════════════════════════════════════════════════════════════════
[CandidateIntake API] 📥 Received candidate form submission
[CandidateIntake API] Candidate data: {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  position: "Senior React Developer",
  jobId: "job-uuid-here",
  resumeFileName: "none"
}
════════════════════════════════════════════════════════════════════════════════
[CandidateIntake API] ✅ Validation passed, attempting database insert...
[CandidateIntake API] Attempting to insert with data: { ... }
[CandidateIntake API] ✅ Candidate successfully saved to job_applicants table
[CandidateIntake API] Saved record ID: applicant-uuid-here
[CandidateIntake API] Saved data: {
  id: "applicant-uuid-here",
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  position_applied: "Senior React Developer",
  job_id: "job-uuid-here",
  status: "pending",
  created_at: "2025-12-28T..."
}
════════════════════════════════════════════════════════════════════════════════
```

### 5. **What Each Log Means**

| Log | Status | Meaning |
|-----|--------|---------|
| `Form validation passed` | ✅ Good | Form data is valid |
| `🚀 Submitting` | ✅ Good | API call is being made |
| `API Response status: 201` | ✅ Good | Server accepted the data |
| `Successfully saved` | ✅ Good | Data was inserted into database |
| `Validation failed` | ❌ Bad | Missing or invalid field |
| `API Response status: 4xx/5xx` | ❌ Bad | Server error - check response error message |
| `Database error` | ❌ Bad | Table/column issue - check error code |

### 6. **Check Database Directly**

Go to **Supabase Dashboard** → `job_applicants` table

You should see a new row:
- **name**: John Doe
- **email**: john.doe@example.com
- **phone**: +1 (555) 123-4567
- **position_applied**: Senior React Developer
- **job_id**: (same as job you used)
- **status**: pending
- **created_at**: (current timestamp)

### 7. **Check Recruiter Dashboard**

Go back to recruiter dashboard:
1. Click **Applicants**
2. You should see the job grouped with 1 applicant
3. Applicant card shows: John Doe, john.doe@example.com, +1 (555) 123-4567

## Troubleshooting

### **Issue: Form won't submit**
- **Check**: Browser console for validation errors
- **Fix**: Ensure all fields are filled
- **Verify**: jobId is passed in URL

### **Issue: Form submits but no success message**
- **Check**: Browser console for error message
- **Check**: Network tab → `candidate-intake` response
- **Verify**: Response status (201 = good, 4xx/5xx = error)

### **Issue: Form succeeds but applicant not showing**
- **Check**: Supabase `job_applicants` table directly
- **Check**: Applicant has correct `job_id` matching your job
- **Check**: Recruiter dashboard filters/searches

### **Issue: See error "Column error"**
- **Problem**: Table schema missing columns
- **Fix**: Run SQL from DEBUG_APPLICANTS.md to add columns

### **Issue: See error "Table not found"**
- **Problem**: `job_applicants` table doesn't exist
- **Fix**: Run SQL from DEBUG_APPLICANTS.md to create table

## Success Criteria ✅

- [ ] Form submission logs appear in browser console
- [ ] Backend logs show `Successfully saved`
- [ ] Supabase table shows new applicant record
- [ ] Recruiter dashboard displays applicant count > 0
- [ ] Clicking applicant shows their details

## If Everything Works

🎉 **Great!** The candidate pipeline is working. Now:
1. Have multiple candidates complete interviews
2. Check applicants dashboard shows all of them
3. Click applicants to see interview details

## If Issues Persist

Copy these from console/logs and share:
1. **Exact error message** from console
2. **API response status** (from Network tab)
3. **Backend error** (from Render logs)
4. **Supabase table check** (does table exist? any rows?)
