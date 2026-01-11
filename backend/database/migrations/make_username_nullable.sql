-- Make username nullable for OAuth users
-- Run this in pgAdmin before testing Google OAuth

ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
