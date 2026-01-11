import pool from './src/config/database';

async function testFixedQuery() {
    try {
        console.log('Testing FIXED query for user 8 (HarsH):\n');

        const result = await pool.query(
            `SELECT 
                u.id, 
                u.username, 
                u.email,
                f.created_at as friend_since
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = $1
            ORDER BY f.created_at DESC`,
            [8]
        );

        console.log('Friends count:', result.rows.length);
        console.table(result.rows);

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testFixedQuery();
