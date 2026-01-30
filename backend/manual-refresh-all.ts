import pool from './src/config/database';
import { SnapshotService } from './src/services/snapshot.service';

async function refreshAllUsers() {
    try {
        console.log('🔄 Manually refreshing all linked accounts...\n');

        const result = await pool.query(`
            SELECT ph.user_id, ph.platform, ph.handle, u.username
            FROM platform_handles ph
            JOIN users u ON ph.user_id = u.id
            WHERE ph.is_verified = true
            ORDER BY u.username, ph.platform
        `);

        console.log(`Found ${result.rows.length} verified handles\n`);

        for (const handle of result.rows) {
            console.log(`Processing: ${handle.username} - ${handle.platform} (${handle.handle})`);

            if (handle.platform === 'codeforces') {
                const count = await SnapshotService.backfillCodeforcesHistory(
                    handle.user_id,
                    handle.handle
                );
                console.log(`  ✓ Created/updated ${count} snapshots\n`);
            } else if (handle.platform === 'leetcode') {
                const snapshot = await SnapshotService.createLeetCodeSnapshot(
                    handle.user_id,
                    handle.handle
                );
                console.log(`  ✓ Created snapshot: ${snapshot ? 'Success' : 'Failed'}\n`);
            }
        }

        console.log('✅ Refresh complete!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

refreshAllUsers();
