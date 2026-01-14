-- Run this SQL in Supabase Dashboard → SQL Editor to set up OTP tables

-- Create phone_otps table for storing OTP verification
CREATE TABLE IF NOT EXISTS phone_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT phone_length CHECK (LENGTH(phone_number) >= 10)
);

-- Create verified_phones table to track verified phone numbers
CREATE TABLE IF NOT EXISTS verified_phones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  last_verified_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT phone_number_length CHECK (LENGTH(phone_number) >= 10)
);

-- Create indexes for faster queries
CREATE INDEX idx_phone_otps_phone_number ON phone_otps(phone_number);
CREATE INDEX idx_phone_otps_expires_at ON phone_otps(expires_at);
CREATE INDEX idx_verified_phones_phone_number ON verified_phones(phone_number);

-- Enable Row Level Security (RLS)
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_phones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow service role to read/write)
CREATE POLICY "Service role can do anything" ON phone_otps
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything" ON verified_phones
  USING (true) WITH CHECK (true);

-- Create function to auto-delete expired OTPs (optional, runs daily)
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM phone_otps WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON phone_otps TO authenticated, anon;
GRANT SELECT ON verified_phones TO authenticated, anon;
