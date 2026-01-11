import pool from './src/config/database';

async function cleanupTestData() {
    try {
        console.log('🧹 Starting cleanup of all test data...\n');

        // Delete all data in order (respecting foreign key constraints)
        console.log('Deleting friend requests...');
        await pool.query('DELETE FROM friend_requests');

        console.log('Deleting friendships...');
        await pool.query('DELETE FROM friends');

        console.log('Deleting snapshots...');
        await pool.query('DELETE FROM snapshots');

        console.log('Deleting platform handles...');
        await pool.query('DELETE FROM platform_handles');

        console.log('Deleting all users...');
        await pool.query('DELETE FROM users');

        // Reset sequences
        console.log('\nResetting ID sequences...');
        await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE platform_handles_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE snapshots_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE friends_id_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE friend_requests_id_seq RESTART WITH 1');

        console.log('\n✅ Cleanup complete! All test data has been removed.');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

cleanupTestData();
