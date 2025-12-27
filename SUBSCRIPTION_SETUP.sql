-- ============================================
-- SUBSCRIPTION SYSTEM TABLES
-- ============================================

-- 1. Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  interview_limit INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired
  interview_count INTEGER DEFAULT 0,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- 3. Create interview_usage table (track each interview)
CREATE TABLE IF NOT EXISTS public.interview_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - SUBSCRIPTION PLANS
-- ============================================

-- Everyone can view active plans
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- ============================================
-- RLS POLICIES - USER SUBSCRIPTIONS
-- ============================================

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can create own subscription" ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - INTERVIEW USAGE
-- ============================================

-- Users can view their own interview usage
CREATE POLICY "Users can view own usage" ON public.interview_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage records
CREATE POLICY "Users can insert own usage" ON public.interview_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_interview_usage_user_id ON public.interview_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_usage_created_at ON public.interview_usage(created_at DESC);

-- ============================================
-- INSERT DEFAULT PLANS
-- ============================================

INSERT INTO public.subscription_plans (name, description, price, interview_limit, features) VALUES
('Free Trial', 'Try 2 free practice interviews', 0, 2, '["2 practice interviews", "Basic feedback", "Limited AI analysis"]'::jsonb),
('Pro', 'Unlimited interviews + advanced features', 9.99, 999999, '["Unlimited interviews", "Advanced AI analysis", "Detailed feedback", "Interview history", "Performance tracking", "Download transcripts"]'::jsonb),
('Enterprise', 'For teams and organizations', 49.99, 999999, '["Unlimited interviews", "Team management", "Advanced analytics", "Priority support", "Custom branding", "API access"]'::jsonb);

-- ============================================
-- HELPER FUNCTION: Check interview limit
-- ============================================

CREATE OR REPLACE FUNCTION check_interview_limit(user_id UUID)
RETURNS JSON AS $$
DECLARE
  subscription_record RECORD;
  interview_limit INTEGER;
  interview_count INTEGER;
  can_continue BOOLEAN;
  message TEXT;
BEGIN
  -- Get user's subscription
  SELECT sub.*, plan.interview_limit 
  INTO subscription_record
  FROM public.user_subscriptions sub
  JOIN public.subscription_plans plan ON sub.plan_id = plan.id
  WHERE sub.user_id = check_interview_limit.user_id 
    AND sub.status = 'active'
  LIMIT 1;

  IF subscription_record IS NULL THEN
    -- No subscription found, create free trial
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    SELECT check_interview_limit.user_id, id, 'active'
    FROM public.subscription_plans
    WHERE name = 'Free Trial'
    ON CONFLICT DO NOTHING;

    -- Get the newly created or existing subscription
    SELECT sub.*, plan.interview_limit 
    INTO subscription_record
    FROM public.user_subscriptions sub
    JOIN public.subscription_plans plan ON sub.plan_id = plan.id
    WHERE sub.user_id = check_interview_limit.user_id 
      AND sub.status = 'active'
    LIMIT 1;
  END IF;

  -- Count user's interviews
  SELECT COUNT(*) INTO interview_count
  FROM public.interview_usage
  WHERE user_id = check_interview_limit.user_id;

  interview_limit := subscription_record.interview_limit;
  can_continue := interview_count < interview_limit;

  IF can_continue THEN
    message := 'Interview allowed';
  ELSE
    message := 'Interview limit reached. Please upgrade your subscription.';
  END IF;

  RETURN json_build_object(
    'can_continue', can_continue,
    'interview_count', interview_count,
    'interview_limit', interview_limit,
    'plan_name', subscription_record.name,
    'message', message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_interview_limit(UUID) TO authenticated;
