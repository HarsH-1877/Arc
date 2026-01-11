// Script to completely clear and restore ONLY real data for touristtt
import pool from './src/config/database';
import { SnapshotService } from './src/services/snapshot.service';

async function cleanAndRestoreTouristtData() {
    try {
        console.log('Cleaning and restoring touristtt data from real APIs...\n');

        // Get touristtt's user info
        const userResult = await pool.query(
            'SELECT id, username FROM users WHERE username = $1',
            ['touristtt']
        );

        if (userResult.rows.length === 0) {
            console.log('User touristtt not found');
            return;
        }

        const user = userResult.rows[0];
        console.log(`Found user: ${user.username} (ID: ${user.id})`);

        // COMPLETELY DELETE all snapshots for touristtt
        console.log('\n🗑️  Deleting ALL existing snapshots for touristtt...');
        const deleteResult = await pool.query(
            'DELETE FROM snapshots WHERE user_id = $1',
            [user.id]
        );
        console.log(`   Deleted ${deleteResult.rowCount} old snapshots`);

        // Get their platform handles
        const handlesResult = await pool.query(
            'SELECT platform, handle FROM platform_handles WHERE user_id = $1',
            [user.id]
        );

        if (handlesResult.rows.length === 0) {
            console.log('No platform handles found for touristtt');
            return;
        }

        console.log(`\n📡 Fetching fresh data from APIs...`);

        // Fetch fresh data for each platform
        for (const handleRow of handlesResult.rows) {
            const { platform, handle } = handleRow;
            console.log(`\n   ${platform}: ${handle}`);

            try {
                if (platform === 'leetcode') {
                    const snapshot = await SnapshotService.createLeetCodeSnapshot(user.id, handle);
                    if (snapshot) {
                        console.log(`   ✅ Created 1 LeetCode snapshot`);
                    } else {
                        console.log(`   ⚠️  Failed to create LeetCode snapshot`);
                    }
                } else if (platform === 'codeforces') {
                    const count = await SnapshotService.backfillCodeforcesHistory(user.id, handle);
                    console.log(`   ✅ Created ${count} Codeforces snapshots (from rating history)`);
                }
            } catch (error) {
                console.error(`   ❌ Error fetching ${platform} data:`, error);
            }
        }

        // Verify final count
        const finalCount = await pool.query(
            'SELECT COUNT(*) as count FROM snapshots WHERE user_id = $1',
            [user.id]
        );

        console.log(`\n✅ Restoration complete!`);
        console.log(`   Total snapshots for touristtt: ${finalCount.rows[0].count}`);
        console.log(`\n⚠️  Note: Only showing actual rating change events from Codeforces API`);
        console.log(`   (Real accounts don't have daily activity like mock users)`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

cleanAndRestoreTouristtData();
