-- Migration: Create daily_submissions table for storing actual daily submission counts
-- This is a NEW table and won't affect existing functionality

-- Create the table
CREATE TABLE IF NOT EXISTS daily_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('codeforces', 'leetcode')),
    date DATE NOT NULL,
    submission_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform, date)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_daily_submissions_user_platform 
ON daily_submissions(user_id, platform, date);

-- Verify table was created
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'daily_submissions';
