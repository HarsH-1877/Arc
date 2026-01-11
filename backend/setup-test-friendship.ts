import pool from './src/config/database';

async function setupTestFriendship() {
    try {
        // Get testuser1 and testuser2 IDs
        const users = await pool.query(
            'SELECT id, username FROM users WHERE username IN ($1, $2)',
            ['testuser1', 'testuser2']
        );

        if (users.rows.length < 2) {
            console.log('Both test users must exist!');
            process.exit(1);
        }

        const user1 = users.rows.find(u => u.username === 'testuser1');
        const user2 = users.rows.find(u => u.username === 'testuser2');

        console.log(`Setting up friendship between ${user1.username} (${user1.id}) and ${user2.username} (${user2.id})`);

        // Check if friendship already exists
        const existing = await pool.query(
            'SELECT id FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [user1.id, user2.id]
        );

        if (existing.rows.length > 0) {
            console.log('✓ Friendship already exists!');
        } else {
            // Create bidirectional friendship
            await pool.query(
                'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2), ($2, $1)',
                [user1.id, user2.id]
            );
            console.log('✓ Created friendship!');
        }

        // Verify
        const friendsResult = await pool.query(
            'SELECT * FROM friends WHERE user_id = $1 OR user_id = $2',
            [user1.id, user2.id]
        );
        console.log(`Total friend relations: ${friendsResult.rows.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

setupTestFriendship();
