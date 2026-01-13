-- Interview Integrity Violations Table
-- Stores all deepfake, AI voice, and window switching violations detected during interviews

CREATE TABLE IF NOT EXISTS interview_integrity_violations (
  id BIGSERIAL PRIMARY KEY,
  interview_id VARCHAR(255) NOT NULL UNIQUE,
  applicant_id UUID,
  job_id UUID,
  user_id UUID,
  violation_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  severity_levels TEXT[] DEFAULT ARRAY[]::TEXT[],
  description TEXT,
  cancellation_reason TEXT,
  violations_json JSONB DEFAULT '{}'::JSONB,
  report_json JSONB DEFAULT '{}'::JSONB,
  detected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'recorded',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Indices for common queries
  CONSTRAINT fk_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
  CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indices for faster queries
CREATE INDEX IF NOT EXISTS idx_interview_violations_applicant ON interview_integrity_violations(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interview_violations_job ON interview_integrity_violations(job_id);
CREATE INDEX IF NOT EXISTS idx_interview_violations_user ON interview_integrity_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_violations_created ON interview_integrity_violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_violations_status ON interview_integrity_violations(status);
CREATE INDEX IF NOT EXISTS idx_interview_violations_severity ON interview_integrity_violations USING GIN (severity_levels);

-- Add RLS policies
ALTER TABLE interview_integrity_violations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all violations
CREATE POLICY admin_view_all_violations ON interview_integrity_violations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Policy: Hiring managers can view violations for their applicants
CREATE POLICY hiring_manager_view_violations ON interview_integrity_violations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applicants a
      WHERE a.id = interview_integrity_violations.applicant_id
      AND a.created_by = auth.uid()
    )
  );

-- Policy: Service role can insert violations
CREATE POLICY service_role_insert_violations ON interview_integrity_violations
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can update violations
CREATE POLICY admin_update_violations ON interview_integrity_violations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Add helpful comments
COMMENT ON TABLE interview_integrity_violations IS 'Logs all interview integrity violations including deepfake detection, AI voice detection, and window switching attempts';
COMMENT ON COLUMN interview_integrity_violations.violation_types IS 'Array of violation types detected: deepfake, ai-voice, window-switch';
COMMENT ON COLUMN interview_integrity_violations.severity_levels IS 'Array of severity levels: warning, critical';
COMMENT ON COLUMN interview_integrity_violations.violations_json IS 'Detailed violation data from detection modules';
COMMENT ON COLUMN interview_integrity_violations.report_json IS 'Complete integrity report including all detection results';
COMMENT ON COLUMN interview_integrity_violations.status IS 'Status: recorded, reviewed, archived';

-- Create a view for admins to easily see critical violations
CREATE OR REPLACE VIEW critical_interview_violations AS
SELECT
  id,
  interview_id,
  applicant_id,
  job_id,
  user_id,
  violation_types,
  description,
  cancellation_reason,
  detected_at,
  created_at,
  status
FROM interview_integrity_violations
WHERE 'critical' = ANY(severity_levels)
ORDER BY detected_at DESC;

GRANT SELECT ON critical_interview_violations TO authenticated;
