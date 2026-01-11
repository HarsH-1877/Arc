-- Clear All User and Friend Data
-- Run this in pgAdmin or psql to reset the database

-- WARNING: This will delete ALL user data permanently!

-- Disable foreign key checks temporarily (if needed)
-- SET session_replication_role = 'replica';

-- Delete in order to respect foreign key constraints

-- 1. Delete topic mappings
TRUNCATE TABLE topic_mappings CASCADE;

-- 2. Delete topics
TRUNCATE TABLE topics CASCADE;

-- 3. Delete snapshots
TRUNCATE TABLE snapshots CASCADE;

-- 4. Delete platform handles
TRUNCATE TABLE platform_handles CASCADE;

-- 5. Delete friend requests
TRUNCATE TABLE friend_requests CASCADE;

-- 6. Delete friends
TRUNCATE TABLE friends CASCADE;

-- 7. Delete users (this will cascade to everything else if properly set up)
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Re-enable foreign key checks (if disabled)
-- SET session_replication_role = 'origin';

-- Verify all tables are empty
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'friends', COUNT(*) FROM friends
UNION ALL
SELECT 'friend_requests', COUNT(*) FROM friend_requests
UNION ALL
SELECT 'platform_handles', COUNT(*) FROM platform_handles
UNION ALL
SELECT 'snapshots', COUNT(*) FROM snapshots
UNION ALL
SELECT 'topics', COUNT(*) FROM topics
UNION ALL
SELECT 'topic_mappings', COUNT(*) FROM topic_mappings;
