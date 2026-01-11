-- Delete specific user: minecraftjavaedition34@gmail.com
-- Run this in pgAdmin or psql

-- First, find the user ID
DO $$
DECLARE
    user_id_to_delete INT;
BEGIN
    -- Get the user ID
    SELECT id INTO user_id_to_delete 
    FROM users 
    WHERE email = 'minecraftjavaedition34@gmail.com';
    
    IF user_id_to_delete IS NULL THEN
        RAISE NOTICE 'User with email minecraftjavaedition34@gmail.com not found';
    ELSE
        RAISE NOTICE 'Deleting user ID: %', user_id_to_delete;
        
        -- Delete in proper order to respect foreign keys
        
        -- 1. Delete topic mappings
        DELETE FROM topic_mappings WHERE user_id = user_id_to_delete;
        
        -- 2. Delete topics
        DELETE FROM topics WHERE user_id = user_id_to_delete;
        
        -- 3. Delete snapshots
        DELETE FROM snapshots WHERE user_id = user_id_to_delete;
        
        -- 4. Delete platform handles
        DELETE FROM platform_handles WHERE user_id = user_id_to_delete;
        
        -- 5. Delete friend requests (both sent and received)
        DELETE FROM friend_requests WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
        
        -- 6. Delete friends (both directions)
        DELETE FROM friends WHERE user_id = user_id_to_delete OR friend_id = user_id_to_delete;
        
        -- 7. Finally, delete the user
        DELETE FROM users WHERE id = user_id_to_delete;
        
        RAISE NOTICE 'User deleted successfully';
    END IF;
END $$;

-- Verify deletion
SELECT * FROM users WHERE email = 'minecraftjavaedition34@gmail.com';
