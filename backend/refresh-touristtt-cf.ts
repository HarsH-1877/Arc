// Re-fetch touristtt's Codeforces data with correct problem counts
import pool from './src/config/database';
import { SnapshotService } from './src/services/snapshot.service';

async function refreshTouristtCFData() {
    try {
        console.log('🔄 Refreshing touristtt Codeforces data...\n');

        const userId = 8; // touristtt's user ID
        const handle = 'tourist'; // CF handle

        // Delete existing CF snapshots
        await pool.query(
            'DELETE FROM snapshots WHERE user_id = $1 AND platform = $2',
            [userId, 'codeforces']
        );
        console.log('✅ Deleted old CF snapshots');

        // Re-fetch with correct problem counts
        const count = await SnapshotService.backfillCodeforcesHistory(userId, handle);
        console.log(`✅ Created ${count} new CF snapshots with correct problem counts\n`);

        // Verify
        const verifyResult = await pool.query(
            `SELECT COUNT(*) as count, MAX(total_solved) as max_solved
             FROM snapshots 
             WHERE user_id = $1 AND platform = 'codeforces'`,
            [userId]
        );

        console.log(`📊 Verification:`);
        console.log(`   Total CF snapshots: ${verifyResult.rows[0].count}`);
        console.log(`   Max problems solved: ${verifyResult.rows[0].max_solved}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

refreshTouristtCFData();
