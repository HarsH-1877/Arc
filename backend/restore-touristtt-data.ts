// Script to restore real account data (like touristtt) by fetching from APIs
import pool from './src/config/database';
import { SnapshotService } from './src/services/snapshot.service';

async function restoreRealAccountData() {
    try {
        console.log('Restoring real account data from Codeforces/LeetCode...\n');

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

        // Get their platform handles
        const handlesResult = await pool.query(
            'SELECT platform, handle FROM platform_handles WHERE user_id = $1',
            [user.id]
        );

        if (handlesResult.rows.length === 0) {
            console.log('No platform handles found for touristtt');
            return;
        }

        console.log(`\nFound ${handlesResult.rows.length} platform handles`);

        // Fetch fresh data for each platform
        for (const handleRow of handlesResult.rows) {
            const { platform, handle } = handleRow;
            console.log(`\nFetching ${platform} data for handle: ${handle}...`);

            try {
                if (platform === 'codeforces') {
                    const count = await SnapshotService.backfillCodeforcesHistory(user.id, handle);
                    console.log(`✅ Created ${count} Codeforces snapshots`);
                } else if (platform === 'leetcode') {
                    const snapshot = await SnapshotService.createLeetCodeSnapshot(user.id, handle);
                    if (snapshot) {
                        console.log(`✅ Created LeetCode snapshot`);
                    } else {
                        console.log(`⚠️  Failed to create LeetCode snapshot`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error fetching ${platform} data:`, error);
            }
        }

        console.log('\n✅ Real account data restoration complete!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

restoreRealAccountData();
