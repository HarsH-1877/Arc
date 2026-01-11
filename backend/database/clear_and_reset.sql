-- Clear All Data and Prepare for OAuth
-- Run this in pgAdmin to start fresh with OAuth support

-- Step 1: Make username nullable for OAuth users
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;

-- Step 2: Clear all user data
TRUNCATE TABLE topic_mappings CASCADE;
TRUNCATE TABLE topics CASCADE;
TRUNCATE TABLE snapshots CASCADE;
TRUNCATE TABLE platform_handles CASCADE;
TRUNCATE TABLE friend_requests CASCADE;
TRUNCATE TABLE friends CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Step 3: Verify all tables are empty
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'friends', COUNT(*) FROM friends
UNION ALL
SELECT 'friend_requests', COUNT(*) FROM friend_requests
UNION ALL
SELECT 'platform_handles', COUNT(*) FROM platform_handles
UNION ALL
SELECT 'snapshots', COUNT(*) FROM snapshots;

-- You should see count = 0 for all tables
