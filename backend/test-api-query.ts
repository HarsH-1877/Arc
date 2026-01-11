import pool from './src/config/database';

async function testActualAPI() {
    try {
        const userId = 8; // HarsH

        console.log('Testing actual friends API query for user 8 (HarsH)...\n');

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
            [userId]
        );

        console.log('Result count:', result.rows.length);
        console.log('Friends returned:');
        console.table(result.rows);

        // Check for duplicates by ID
        const ids = result.rows.map(r => r.id);
        const uniqueIds = new Set(ids);

        if (ids.length !== uniqueIds.size) {
            console.error('\n❌ DUPLICATES FOUND IN RESULT!');
            console.log('IDs:', ids);
            console.log('Unique IDs:', Array.from(uniqueIds));
        } else {
            console.log('\n✅ No duplicates - all IDs are unique');
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testActualAPI();
