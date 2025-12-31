-- Interview Limits and Restrictions Setup

-- 1. Interview Count Tracking
-- Check how many interviews a user has completed
SELECT 
  user_id,
  COUNT(*) as interview_count,
  COUNT(*) <= 2 as can_take_free_interview,
  COUNT(*) > 2 as needs_subscription
FROM interviews
WHERE user_id = 'USER_ID_HERE'
GROUP BY user_id;

-- 2. Check current subscription status
SELECT 
  user_id,
  subscription_type,
  subscription_status,
  interview_limit
FROM subscriptions
WHERE user_id = 'USER_ID_HERE';

-- 3. View interview time logs (for 10-minute limit)
SELECT 
  id,
  user_id,
  duration_seconds,
  CASE 
    WHEN duration_seconds >= 600 THEN '✅ Completed (10+ min)'
    WHEN duration_seconds >= 540 THEN '⚠️ Almost time limit'
    ELSE '📝 Active'
  END as status,
  created_at
FROM interviews
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;

-- 4. Check for users who hit the interview limit
SELECT 
  user_id,
  COUNT(*) as completed_interviews,
  MAX(created_at) as last_interview
FROM interviews
WHERE status = 'completed'
GROUP BY user_id
HAVING COUNT(*) >= 2
ORDER BY completed_interviews DESC;

-- 5. Check subscription table for free tier indicators
SELECT 
  user_id,
  subscription_type,
  interviews_used,
  interviews_limit,
  is_active
FROM subscriptions
WHERE subscription_type = 'FREE'
ORDER BY created_at DESC;
