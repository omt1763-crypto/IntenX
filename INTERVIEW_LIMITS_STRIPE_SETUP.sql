-- Interview Limits Tracking Table
-- Tracks how many interviews each user has completed
-- Prevents tampering by checking subscription status

CREATE TABLE IF NOT EXISTS interview_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interviews_used INT NOT NULL DEFAULT 0,
  interviews_limit INT NOT NULL DEFAULT 2,
  has_active_subscription BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_id VARCHAR(255), -- Stripe subscription ID
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  last_interview_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_interview_limits_user_id ON interview_limits(user_id);
CREATE INDEX idx_interview_limits_has_subscription ON interview_limits(has_active_subscription);
CREATE INDEX idx_interview_limits_subscription_expires ON interview_limits(subscription_expires_at);

-- Enable RLS
ALTER TABLE interview_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own limit
CREATE POLICY interview_limits_user_select ON interview_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert/update
CREATE POLICY interview_limits_service_insert ON interview_limits
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY interview_limits_service_update ON interview_limits
  FOR UPDATE
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_interview_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interview_limits_updated_at_trigger
BEFORE UPDATE ON interview_limits
FOR EACH ROW
EXECUTE FUNCTION update_interview_limits_updated_at();

-- Stripe Subscriptions Table
-- Securely stores subscription information from Stripe
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'active', 'past_due', 'canceled', 'unpaid'
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  plan_name VARCHAR(255) NOT NULL, -- 'Candidate Professional'
  plan_amount INT NOT NULL, -- Amount in cents (2500 = $25.00)
  plan_currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  interview_limit INT NOT NULL DEFAULT 999, -- Unlimited after subscription
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for Stripe lookups
CREATE INDEX idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);
CREATE INDEX idx_stripe_subscriptions_stripe_id ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX idx_stripe_subscriptions_customer_id ON stripe_subscriptions(stripe_customer_id);
CREATE INDEX idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX idx_stripe_subscriptions_period_end ON stripe_subscriptions(current_period_end);

-- Enable RLS
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own subscription
CREATE POLICY stripe_subscriptions_user_select ON stripe_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage subscriptions
CREATE POLICY stripe_subscriptions_service_all ON stripe_subscriptions
  FOR ALL
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_stripe_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stripe_subscriptions_updated_at_trigger
BEFORE UPDATE ON stripe_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_stripe_subscriptions_updated_at();

-- Interview History Table
-- Immutable log of all interviews (for audit trail)
CREATE TABLE IF NOT EXISTS interview_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_id VARCHAR(255) NOT NULL,
  interview_type VARCHAR(50) NOT NULL, -- 'hr', 'technical', 'behavioral', 'roleBased'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INT,
  score INT,
  feedback TEXT,
  had_active_subscription BOOLEAN NOT NULL, -- Was user subscribed at time of interview?
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for queries
CREATE INDEX idx_interview_history_user_id ON interview_history(user_id);
CREATE INDEX idx_interview_history_user_date ON interview_history(user_id, created_at DESC);
CREATE INDEX idx_interview_history_interview_id ON interview_history(interview_id);

-- Enable RLS
ALTER TABLE interview_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own interview history
CREATE POLICY interview_history_user_select ON interview_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert
CREATE POLICY interview_history_service_insert ON interview_history
  FOR INSERT
  WITH CHECK (true);
