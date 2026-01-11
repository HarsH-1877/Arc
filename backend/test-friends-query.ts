import pool from './src/config/database';

async function testFriendsQuery() {
    try {
        // Test for user 8 (HarsH)
        console.log('Testing friends query for user 8 (HarsH):\n');

        const result = await pool.query(
            `SELECT DISTINCT
                u.id, 
                u.username, 
                u.email,
                f.created_at as friend_since
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = $1
            UNION
            SELECT DISTINCT
                u.id, 
                u.username, 
                u.email,
                f.created_at as friend_since
            FROM friends f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = $1
            ORDER BY friend_since DESC`,
            [8]
        );

        console.log('Friends for user 8:', result.rows.length);
        console.table(result.rows);

        // Test for user 3 (Tourist)
        console.log('\n\nTesting friends query for user 3 (Tourist):\n');

        const result2 = await pool.query(
            `SELECT DISTINCT
                u.id, 
                u.username, 
                u.email,
                f.created_at as friend_since
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = $1
            UNION
            SELECT DISTINCT
                u.id, 
                u.username, 
                u.email,
                f.created_at as friend_since
            FROM friends f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = $1
            ORDER BY friend_since DESC`,
            [3]
        );

        console.log('Friends for user 3:', result2.rows.length);
        console.table(result2.rows);

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testFriendsQuery();
