
import pool from './src/config/database';

async function findAlice() {
    try {
        const result = await pool.query(
            "SELECT id, username, email FROM users WHERE username ILIKE '%alice%' OR email ILIKE '%alice%'"
        );
        console.log('Found users:', result.rows);

        if (result.rows.length > 0) {
            const alice = result.rows[0];
            console.log(`\nChecking friends for ${alice.username} (ID: ${alice.id})`);

            const friends = await pool.query(
                `SELECT u.username, u.email 
                 FROM friends f
                 JOIN users u ON f.friend_id = u.id
                 WHERE f.user_id = $1`,
                [alice.id]
            );

            console.log('\nFriends List:');
            friends.rows.forEach(f => console.log(`- ${f.username} (${f.email})`));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

findAlice();
