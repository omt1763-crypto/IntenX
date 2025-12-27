# Interview Limit Implementation Summary

## Overview
The system enforces a **2-interview limit** for all free trial users. After 2 interviews, users must upgrade their subscription to continue.

## Current Implementation

### 1. Database Setup
- **subscription_plans table**: Defines plans with interview limits
  - Free Trial: 2 interviews
  - Pro: Unlimited (999,999)
  - Enterprise: Unlimited (999,999)

- **interview_usage table**: Tracks each interview taken by a user
  - Records user_id, interview_id, created_at
  - Used to count user's total interviews

- **user_subscriptions table**: Links users to their subscription plan

### 2. Limit Enforcement Points

#### A. Interview Start (Primary Enforcement)
- **File**: `app/interview/realtime/page.tsx` (lines 530-560)
- **Flow**:
  1. User clicks "Start Interview"
  2. System calls `POST /api/check-interview-limit`
  3. If limit reached, show subscription paywall
  4. Otherwise, proceed with interview

#### B. Interview Limit API
- **File**: `app/api/check-interview-limit/route.js`
- **Logic**:
  1. Gets user's active subscription plan
  2. Counts interviews from `interview_usage` table
  3. Compares used vs. limit
  4. Returns: canContinue, remaining interviews, plan name

#### C. Subscription Paywall
- **File**: `components/SubscriptionPaywall.tsx`
- **Shows when**:
  - User hits interview limit
  - Displays current plan and remaining interviews
  - Prompts user to upgrade

### 3. Interview Recording
- When interview completes, entry created in `interview_usage` table
- Counted in next limit check

## Verification Checklist

✅ Free Trial limit = 2 interviews
✅ Limit checked before interview starts
✅ Paywall shown when limit reached
✅ `interview_usage` table tracks all interviews
✅ Auto-creates free trial subscription if missing

## Testing the Limit

1. **First Interview**: User can start
2. **Second Interview**: User can start
3. **Third Interview**: Paywall appears with upgrade prompt

## How to Modify Limits

To change the free trial limit from 2 to another number:

1. Update SQL:
```sql
UPDATE public.subscription_plans 
SET interview_limit = 3 
WHERE name = 'Free Trial';
```

2. Or modify in code when creating the free trial plan

## Current Plan Limits
- **Free Trial**: 2 interviews ($0)
- **Pro**: Unlimited interviews ($9.99/month)
- **Enterprise**: Unlimited interviews ($49.99/month)
