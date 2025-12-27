# Interview Loading Debug Guide - Troubleshooting "Loading interviews..." Issue

## Problem
User sees "⚠️ Loading interviews... We found 11 completed interviews" but the interviews don't display, and clicking "Refresh Interviews" shows the same message.

## Why This Happens

When you see this message, it means:
- **✅ API found the interviews** (stats.total = 11)
- **❌ But React state didn't load them** (interviews.length = 0)

This is a **data loading timing issue** - the stats are calculated but the interview array didn't populate.

## Debugging Steps

### Step 1: Open Browser Console
1. **Press F12** to open Developer Tools
2. Go to **Console** tab
3. Look for messages starting with `[CandidateDashboard]` or `[GetInterviews API]`

### Step 2: Check API Response
Look for this log pattern:
```
[GetInterviews API] Request received: { userId: "xxx-xxx-xxx", jobId: null }
[GetInterviews API] Querying by userId: xxx-xxx-xxx
[GetInterviews API] Supabase query completed
[GetInterviews API] Returned rows: 11
[GetInterviews API] ✅ Success: returning 11 interviews
```

**If you see this**: ✅ API is working fine, problem is in the dashboard

### Step 3: Check Dashboard State
Look for:
```
[CandidateDashboard] Fetching interviews via API for userId: xxx
[CandidateDashboard] API URL: /api/interviews?userId=xxx
[CandidateDashboard] API Response status: 200
[CandidateDashboard] API Response ok: true
[CandidateDashboard] Parsed API response: { success: true, data: [...], count: 11 }
[CandidateDashboard] result.data length: 11
[CandidateDashboard] ✅ SUCCESS: Loaded 11 interviews
[CandidateDashboard] ✅ setInterviews() called, state should update
```

### Step 4: Check the Debug Box
When you see the warning, a debug box will show:
```
State Debug:
interviews.length: 0
stats.total: 11
loading: false
```

**Expected**: `interviews.length: 11` (not 0)

If `interviews.length` is 0 but `stats.total` is 11, there's a state mismatch.

## Solutions

### Solution 1: Simple Refresh
1. Click the **🔄 Refresh Interviews** button
2. Check console for errors
3. If it still shows 0 interviews, go to Solution 2

### Solution 2: Full Page Refresh
1. **Press F5** (or Cmd+R on Mac) to refresh the entire page
2. Wait for the dashboard to load
3. Click "View History" again

### Solution 3: Clear Cache
1. **Open Console** (F12)
2. Run: `localStorage.clear()`
3. Refresh page (F5)
4. Log back in if needed

### Solution 4: Check API Response Manually
1. Open Console (F12)
2. Run this command:
```javascript
fetch('/api/interviews?userId=' + JSON.parse(localStorage.getItem('auth_user')).id)
  .then(r => r.json())
  .then(d => console.log('API Response:', d))
```
3. Check what the API returns

## Common Issues & Fixes

### Issue 1: "Loading interviews..." but API returning data

**Symptom**: API shows 11 interviews, but dashboard state shows 0

**Cause**: React state not being set from API response

**Fix**: 
- Open console, run: `localStorage.removeItem('selected_tab')`
- Full page refresh (F5)
- Click "View History" again

### Issue 2: API error instead of data

**Symptom**: API showing error in console

**Cause**: Database query failing or permission issue

**What to look for**:
```
[GetInterviews API] Supabase error: ...
```

**Fix**: Check if userId is correct in URL

### Issue 3: Stuck on loading forever

**Symptom**: "Loading interviews..." won't go away even after refresh

**Cause**: API call hanging or not completing

**Fix**:
- Check Network tab (F12 → Network)
- Look for the `/api/interviews` request
- Check if it's still pending or failed

## Debug Console Output Reference

### Success Flow
```
✅ [GetInterviews API] Returned rows: 11
✅ [CandidateDashboard] ✅ SUCCESS: Loaded 11 interviews
✅ [CandidateDashboard] ✅ setInterviews() called, state should update
```

### Failure Flow
```
❌ [CandidateDashboard] API Response ok: false
❌ [CandidateDashboard] API returned error status: 400
❌ [GetInterviews API] Supabase error: [error message]
```

## What the New Code Does

### Enhanced Dashboard (page.js)
- **Better logging**: Every step logged for debugging
- **State tracking**: Shows current interviews.length and stats.total
- **Debug box**: Displays state values when loading fails
- **Refresh button**: Calls loadDashboard() again if needed

### Enhanced API (route.js)
- **Request logging**: Shows what userId is being queried
- **Response logging**: Shows how many rows returned
- **Error details**: Shows Supabase error code and message
- **Count field**: Returns count of interviews for verification

## Next Steps

1. **Try the Refresh button** first - this often fixes the issue
2. **Check console logs** using the debugging steps above
3. **Full page refresh** if Refresh button doesn't work
4. **Report the console output** if issue persists

## For Developers

If interviews still don't load after refresh, check:

1. **Database connection**:
   ```sql
   SELECT COUNT(*) FROM interviews WHERE user_id = 'xxx';
   ```

2. **User ID accuracy**: Is the userId in the URL parameter correct?

3. **Network timing**: Is the API call actually completing?

4. **React state**: Is setInterviews() being called with data?

Look for the first ❌ error in the console and work backwards from there.

---

**Key Debug Info to Share if Issue Persists**:
- Console output showing [CandidateDashboard] logs
- API Response showing data count
- Current state values (interviews.length, stats.total)
- Browser/device being used
- Steps to reproduce
