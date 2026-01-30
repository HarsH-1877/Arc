// Check touristtt's Codeforces data
import pool from './src/config/database';

async function checkCodeforcesData() {
    try {
        console.log('🔍 Checking touristtt Codeforces data...\n');

        // Get touristtt's user ID
        const userResult = await pool.query(
            'SELECT id, username FROM users WHERE username = $1',
            ['touristtt']
        );

        if (userResult.rows.length === 0) {
            console.log('❌ User touristtt not found');
            return;
        }

        const user = userResult.rows[0];
        console.log(`✅ Found user: ${user.username} (ID: ${user.id})\n`);

        // Check platform handles
        const handlesResult = await pool.query(
            'SELECT platform, handle, current_rating FROM platform_handles WHERE user_id = $1',
            [user.id]
        );

        console.log('📋 Platform Handles:');
        handlesResult.rows.forEach(h => {
            console.log(`   ${h.platform}: ${h.handle} (rating: ${h.current_rating || 'N/A'})`);
        });

        // Check CF snapshots
        const cfSnapshotsResult = await pool.query(
            `SELECT platform, timestamp, rating, total_solved 
             FROM snapshots 
             WHERE user_id = $1 AND platform = 'codeforces'
             ORDER BY timestamp DESC
             LIMIT 5`,
            [user.id]
        );

        console.log(`\n📊 Codeforces Snapshots (latest 5):`);
        console.log(`   Total CF snapshots: ${cfSnapshotsResult.rows.length}`);
        cfSnapshotsResult.rows.forEach((s, idx) => {
            console.log(`   ${idx + 1}. ${s.timestamp.toISOString()} - Rating: ${s.rating}, Solved: ${s.total_solved}`);
        });

        // Check LC snapshots
        const lcSnapshotsResult = await pool.query(
            `SELECT platform, timestamp, rating, total_solved 
             FROM snapshots 
             WHERE user_id = $1 AND platform = 'leetcode'
             ORDER BY timestamp DESC
             LIMIT 5`,
            [user.id]
        );

        console.log(`\n📊 LeetCode Snapshots (latest 5):`);
        console.log(`   Total LC snapshots: ${lcSnapshotsResult.rows.length}`);
        lcSnapshotsResult.rows.forEach((s, idx) => {
            console.log(`   ${idx + 1}. ${s.timestamp.toISOString()} - Rating: ${s.rating}, Solved: ${s.total_solved}`);
        });

        // Check latest snapshot for both platforms
        const latestResult = await pool.query(
            `SELECT DISTINCT ON (platform) platform, total_solved, rating
             FROM snapshots
             WHERE user_id = $1
             ORDER BY platform, timestamp DESC`,
            [user.id]
        );

        console.log(`\n📈 Latest Snapshot Data:`);
        latestResult.rows.forEach(row => {
            console.log(`   ${row.platform}: ${row.total_solved} problems, rating ${row.rating}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkCodeforcesData();
