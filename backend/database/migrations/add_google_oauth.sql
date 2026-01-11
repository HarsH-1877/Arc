-- Migration: Add Google OAuth support to users table
-- Run this to update existing database

-- Add new columns
ALTER TABLE users 
  ALTER COLUMN password_hash DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Create index for Google ID lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Set existing users as email verified (backward compatibility)
UPDATE users SET email_verified = TRUE WHERE password_hash IS NOT NULL;

-- Add constraint: must have either password_hash OR google_id
ALTER TABLE users ADD CONSTRAINT check_auth_method 
  CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL);
