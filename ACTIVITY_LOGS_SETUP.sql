-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'login_attempt', 'failed_login', 'data_access', 'unusual_request', 'brute_force', 'permission_denied', 'bulk_operation', 'admin_action'
  severity VARCHAR(20) NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  reviewed BOOLEAN DEFAULT FALSE,
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_severity ON activity_logs(severity);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_reviewed ON activity_logs(reviewed);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin can view all activity logs
CREATE POLICY activity_logs_admin_select ON activity_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: Service role can insert
CREATE POLICY activity_logs_service_insert ON activity_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Admin can update (for review status)
CREATE POLICY activity_logs_admin_update ON activity_logs
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_activity_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_logs_updated_at_trigger
BEFORE UPDATE ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION update_activity_logs_updated_at();
