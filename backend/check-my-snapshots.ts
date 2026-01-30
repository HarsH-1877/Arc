import pool from './src/config/database';

async function checkSnapshots() {
    try {
        console.log('📊 Checking snapshot data...\n');

        // Get your user ID
        const userResult = await pool.query(
            `SELECT id, username, email FROM users WHERE email LIKE '%harsh%' OR username LIKE '%harsh%'`
        );

        if (userResult.rows.length === 0) {
            console.log('No user found matching "harsh"');
            return;
        }

        const user = userResult.rows[0];
        console.log(`User: ${user.username} (ID: ${user.id}, Email: ${user.email})\n`);

        // Get all snapshots
        const snapshotsResult = await pool.query(
            `SELECT platform, timestamp, rating 
             FROM snapshots 
             WHERE user_id = $1 
             ORDER BY platform, timestamp DESC`,
            [user.id]
        );

        console.log(`Total snapshots: ${snapshotsResult.rows.length}\n`);

        // Group by platform
        const cf = snapshotsResult.rows.filter(s => s.platform === 'codeforces');
        const lc = snapshotsResult.rows.filter(s => s.platform === 'leetcode');

        console.log('CODEFORCES SNAPSHOTS:');
        cf.forEach(s => {
            console.log(`  ${new Date(s.timestamp).toISOString().split('T')[0]} - Rating: ${s.rating}`);
        });

        console.log('\nLEETCODE SNAPSHOTS:');
        lc.forEach(s => {
            console.log(`  ${new Date(s.timestamp).toISOString().split('T')[0]} - Rating: ${s.rating}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkSnapshots();
