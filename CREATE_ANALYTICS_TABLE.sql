-- Create analytics_events table for tracking website visits
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_path VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  country_code VARCHAR(10),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  referrer TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  duration_seconds INTEGER DEFAULT 0
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country);
CREATE INDEX IF NOT EXISTS idx_analytics_page_path ON analytics_events(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_device_type ON analytics_events(device_type);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from API (anonymous)
CREATE POLICY "Allow insert analytics events" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Create policy for authenticated users to read all analytics
CREATE POLICY "Allow read analytics for authenticated users" ON analytics_events
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON analytics_events TO postgres, authenticated, anon;
