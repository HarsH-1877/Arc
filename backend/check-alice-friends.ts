
import pool from './src/config/database';

async function listAliceFriends() {
    try {
        // Find Alice first
        const aliceResult = await pool.query(
            "SELECT id, username FROM users WHERE username = 'alice_coder'"
        );

        if (aliceResult.rows.length === 0) {
            console.log('Alice not found!');
            return;
        }

        const alice = aliceResult.rows[0];
        console.log(`Checking friends for ${alice.username} (ID: ${alice.id})`);

        // Get friends
        const result = await pool.query(
            `SELECT u.username, u.email 
             FROM friends f
             JOIN users u ON f.friend_id = u.id
             WHERE f.user_id = $1`,
            [alice.id]
        );

        console.log('\nFriends List:');
        result.rows.forEach(f => console.log(`- ${f.username} (${f.email})`));
        console.log(`\nTotal Friends: ${result.rows.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

listAliceFriends();
