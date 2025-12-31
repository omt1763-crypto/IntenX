# 🎯 Interview Limits Implementation Guide

## Overview
Your interview platform now has TWO critical restrictions:

1. **⏱️ 10-Minute Interview Duration Limit** - All interviews auto-end after 10 minutes
2. **2️⃣ 2 Free Interviews Per User** - Users get 2 free interviews, then must subscribe for more

---

## 📋 What Changed

### 1️⃣ 10-Minute Interview Duration Limit

**File**: `app/interview/realtime/page.tsx`

**Changes**:
```tsx
// Before:
const [maxDuration] = useState(120) // 2 minutes for practice mode

// After:
const [maxDuration] = useState(600) // 10 minutes (600 seconds) for ALL interviews
```

**How It Works**:
- Interview starts when user clicks "Start Interview"
- Timer counts up from 0
- At **9 minutes** (540 seconds): Yellow warning appears "1 minute remaining!"
- At **5 minutes** (300 seconds): Alert shown "5 minutes remaining!"
- At **10 minutes** (600 seconds): **INTERVIEW AUTO-ENDS**
  - AI stops responding
  - Recording stops
  - User redirected to completion screen
  - Conversation saved automatically

**User Experience**:
```
⏱️ Timer Display:
0:00 → 5:59    : Normal interview (blue)
6:00 → 8:59    : 5-minute warning shows
9:00 → 9:59    : 1-minute warning shows (red)
10:00          : INTERVIEW ENDS ✋
```

### 2️⃣ 2 Free Interviews Limit

**Files**:
- `app/interview/realtime/page.tsx` - Frontend check
- `app/api/check-interview-limit/route.ts` - Backend API (NEW)

**How It Works**:

#### Flow:
1. User clicks "Start Interview"
2. System checks: "Has this user completed 2+ interviews?"
3. **If NO** (0-1 interviews): ✅ Interview starts normally
4. **If YES** (2+ interviews) & **No subscription**: 🚫 Shows paywall
   - "You've used your 2 free interviews"
   - "Upgrade to continue interviewing"
   - Link to subscription plans
5. **If YES** (2+ interviews) & **Has subscription**: ✅ Interview starts (unlimited)

#### Database Check:
```sql
-- Checks 'interviews' table
SELECT COUNT(*) FROM interviews 
WHERE user_id = 'USER_ID' 
AND status IN ('completed', 'submitted')
```

Only **finished** interviews count:
- ✅ Count: completed, submitted interviews
- ❌ Don't count: in_progress, failed, abandoned

---

## 🔧 Configuration

### Change 10-Minute Limit
If you need to adjust the duration:

**File**: `app/interview/realtime/page.tsx` (line ~111)

```tsx
// Change this line:
const [maxDuration] = useState(600) // 10 minutes

// Examples:
const [maxDuration] = useState(300)   // 5 minutes
const [maxDuration] = useState(900)   // 15 minutes
const [maxDuration] = useState(1800)  // 30 minutes
```

### Change Free Interview Count
**File**: `app/api/check-interview-limit/route.ts` (line ~32)

```typescript
const freeLimit = 2  // Change this number

// Examples:
const freeLimit = 1  // Only 1 free interview
const freeLimit = 3  // 3 free interviews
const freeLimit = 5  // 5 free interviews
```

---

## 📊 Database Requirements

Your `interviews` table needs these columns:
- `user_id` - UUID of user who took interview
- `status` - Text ('completed', 'submitted', 'in_progress', etc.)
- `created_at` - Timestamp when interview was created

Verify with this SQL:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'interviews'
AND column_name IN ('user_id', 'status', 'created_at');
```

---

## ✅ Testing Checklist

### Test 10-Minute Limit

1. **Start an interview**
   - [ ] Timer shows 0:00 and counts up
   - [ ] Interview continues normally

2. **At 5 minutes**
   - [ ] "5 minutes remaining" message appears
   - [ ] Interview continues

3. **At 9 minutes**
   - [ ] "1 minute remaining" warning shows (red)
   - [ ] Interview still active

4. **At 10 minutes**
   - [ ] Interview auto-ends
   - [ ] "Interview time limit reached" message
   - [ ] Redirected to results page
   - [ ] Audio/video stops

### Test 2-Interview Limit

**First Interview**:
1. [ ] Log in as new user (0 interviews)
2. [ ] Start interview - should work ✅
3. [ ] Complete 10 minutes
4. [ ] Interview saved with status: `completed`

**Second Interview**:
1. [ ] Same user starts another interview
2. [ ] Should work (2nd free interview) ✅
3. [ ] Complete it
4. [ ] Database now shows 2 completed interviews

**Third Interview Attempt**:
1. [ ] Same user clicks "Start Interview"
2. [ ] Paywall appears: "You've used your 2 free interviews"
3. [ ] Shows subscription plans
4. [ ] Interview does NOT start ❌

**With Subscription**:
1. [ ] User upgrades subscription
2. [ ] Status in DB: `subscription_status = 'active'`
3. [ ] Same user can now start unlimited interviews ✅

---

## 🛡️ Error Handling

### If API Check Fails
- Interview continues anyway (fail-open approach)
- User can always interview
- Better to let them interview than block them

### If Database Connection Down
- System defaults to allowing interview
- Logs error but doesn't block user

### If Interview Auto-Ends
- Conversation automatically saved to database
- User sees: "Interview time limit reached"
- Time stats: exactly 10:00 recorded
- Can retake free interviews or subscribe

---

## 📱 User Messages

### Time Warnings During Interview

**5 Minutes Remaining** (shown at 5 min mark):
```
⏰ 5 MINUTES REMAINING in your interview
```

**1 Minute Remaining** (shown at 9 min mark):
```
⏰ 🔴 1 MINUTE REMAINING! Interview will end soon!
```

**Interview Ended** (at 10 min):
```
⏱️ Interview time limit reached (10 minutes max). Your interview has been ended.
```

### Paywall Message

**Reached 2 Interview Limit**:
```
❌ You've completed your 2 free interviews
📊 Upgrade to a paid plan for unlimited interviews

[View Pricing Plans] [Subscribe Now]
```

---

## 📈 Analytics & Monitoring

### Track Interview Duration
```sql
-- Average interview duration
SELECT 
  AVG(EXTRACT(EPOCH FROM (ended_at - created_at))) as avg_seconds,
  COUNT(*) as total_interviews,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ended_at - created_at))) as median_seconds
FROM interviews
WHERE status = 'completed'
AND created_at > NOW() - INTERVAL '30 days';
```

### Track Free vs Paid Users
```sql
-- How many users hit the 2-interview limit?
SELECT 
  COUNT(DISTINCT user_id) as users_who_maxed_out,
  COUNT(DISTINCT CASE WHEN subscription_status = 'active' THEN user_id END) as converted_to_paid,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN subscription_status = 'active' THEN user_id END) / 
        COUNT(DISTINCT user_id), 2) as conversion_rate_percent
FROM (
  SELECT 
    user_id,
    COUNT(*) as interview_count
  FROM interviews
  WHERE status = 'completed'
  GROUP BY user_id
  HAVING COUNT(*) >= 2
) as max_out_users
LEFT JOIN subscriptions ON max_out_users.user_id = subscriptions.user_id;
```

### Monitor API Health
```sql
-- Check recent interview attempts
SELECT 
  user_id,
  created_at,
  status,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as duration_seconds,
  CASE 
    WHEN EXTRACT(EPOCH FROM (updated_at - created_at)) >= 600 THEN 'Full 10 min'
    ELSE 'Incomplete'
  END as completion_status
FROM interviews
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🚀 Deployment Checklist

- [ ] Database migrations applied (check `user_id`, `status` columns exist)
- [ ] API endpoint `/api/check-interview-limit` is deployed
- [ ] `app/interview/realtime/page.tsx` updated with 600-second limit
- [ ] Test with 3 different users
- [ ] Test 10-minute auto-end on dev/staging
- [ ] Test paywall on dev/staging  
- [ ] Monitor logs for errors in first 24 hours
- [ ] Adjust free limit if needed (currently 2 interviews)

---

## 🎯 Key Points

✅ **All interviews now max at 10 minutes**
- No exceptions (practice or real)
- Automatic cutoff at 600 seconds
- User-friendly warnings at 5 and 1 minute

✅ **Free users get exactly 2 interviews**
- Counted by completed status
- Then shown paywall
- Can upgrade anytime

✅ **Fail-open design**
- If API fails, interview still works
- Better user experience than being blocked

✅ **Easy to configure**
- Change duration: one number in realtime/page.tsx
- Change free count: one number in check-interview-limit/route.ts

---

## 📞 Troubleshooting

**Problem**: Interview doesn't end at 10 minutes
- [ ] Check if `maxDuration` is still 600 in page.tsx
- [ ] Check browser console for errors
- [ ] Verify server time is correct (NTP sync)
- [ ] Clear browser cache and reload

**Problem**: Paywall doesn't show on 3rd interview
- [ ] Check API response: `canContinue: false`
- [ ] Verify interview count in DB: `SELECT COUNT(*) FROM interviews WHERE user_id='X'`
- [ ] Check subscription status in DB
- [ ] Test with different user (clean account)

**Problem**: Free interview count wrong
- [ ] Verify SQL query filters `status IN ('completed', 'submitted')`
- [ ] Check DB for old interviews with wrong status
- [ ] Run cleanup query if needed

---

## 📝 Code Reference

**Timer Display** (line ~1170 in realtime/page.tsx):
```tsx
<div className="text-6xl font-bold">
  {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
</div>
```

**Interview Start Check** (line ~557):
```tsx
const handleStart = async () => {
  if (session?.user?.id) {
    const limitRes = await fetch('/api/check-interview-limit', {
      method: 'POST',
      body: JSON.stringify({ userId: session.user.id })
    })
    const limitData = await limitRes.json()
    if (!limitData.canContinue) {
      setShowPaywall(true)
      return
    }
  }
  // ... start interview
}
```

---

## ✨ Summary

Your platform now:
- 🎯 **Limits interviews to 10 minutes** (no exceptions)
- 🔐 **Gives 2 free interviews** then shows paywall
- 📊 **Tracks usage** automatically in database
- 💪 **Fails gracefully** if systems have issues

This creates a sustainable freemium model while respecting user's time!
