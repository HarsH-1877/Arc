import pool from './src/config/database';

async function clearMockData() {
    try {
        console.log('🗑️  Clearing existing mock users data...\n');

        const mockEmails = [
            'alice@example.com',
            'bob@example.com',
            'steve@example.com',
            'william@example.com',
            'joe@example.com',
            'virat@example.com'
        ];

        // Get user IDs
        const userIdsResult = await pool.query(
            `SELECT id FROM users WHERE email = ANY($1)`,
            [mockEmails]
        );

        if (userIdsResult.rows.length === 0) {
            console.log('✅ No mock users found to delete.');
            return;
        }

        const userIds = userIdsResult.rows.map(r => r.id);
        console.log(`Found ${userIds.length} mock users to delete...`);

        // Delete in correct order (foreign key constraints)
        console.log('Deleting snapshots...');
        const snapshotsResult = await pool.query(
            `DELETE FROM snapshots WHERE user_id = ANY($1)`,
            [userIds]
        );
        console.log(`   ✓ Deleted ${snapshotsResult.rowCount} snapshots`);

        console.log('Deleting friendships...');
        const friendsResult = await pool.query(
            `DELETE FROM friends WHERE user_id = ANY($1) OR friend_id = ANY($1)`,
            [userIds]
        );
        console.log(`   ✓ Deleted ${friendsResult.rowCount} friendships`);

        console.log('Deleting platform handles...');
        const handlesResult = await pool.query(
            `DELETE FROM platform_handles WHERE user_id = ANY($1)`,
            [userIds]
        );
        console.log(`   ✓ Deleted ${handlesResult.rowCount} platform handles`);

        console.log('Deleting users...');
        const usersResult = await pool.query(
            `DELETE FROM users WHERE id = ANY($1)`,
            [userIds]
        );
        console.log(`   ✓ Deleted ${usersResult.rowCount} users`);

        console.log('\n✅ Mock data cleared successfully!');

    } catch (error) {
        console.error('❌ Error clearing mock data:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

clearMockData();
