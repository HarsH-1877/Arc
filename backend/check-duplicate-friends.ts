import pool from './src/config/database';

async function checkDuplicateFriends() {
    try {
        console.log('Checking friends table for duplicates...\n');

        // Get all friends records
        const result = await pool.query(`
            SELECT f.*, u1.username as user_name, u2.username as friend_name
            FROM friends f
            JOIN users u1 ON f.user_id = u1.id
            JOIN users u2 ON f.friend_id = u2.id
            ORDER BY f.id
        `);

        console.log('Total friends records:', result.rows.length);
        console.table(result.rows);

        // Check for duplicate pairs
        const pairs = new Map();
        result.rows.forEach(row => {
            const key = [row.user_id, row.friend_id].sort().join('-');
            if (pairs.has(key)) {
                console.log('\n🔴 DUPLICATE FOUND:');
                console.log('Existing:', pairs.get(key));
                console.log('Duplicate:', row);
            } else {
                pairs.set(key, row);
            }
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDuplicateFriends();
