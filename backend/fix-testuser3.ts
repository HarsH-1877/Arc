import pool from './src/config/database';

async function fixTestuser3() {
    try {
        // Update username from HarsH to testuser3
        await pool.query(
            'UPDATE users SET username = $1 WHERE email = $2',
            ['testuser3', 'test3@example.com']
        );

        console.log('✓ Updated username to testuser3');

        // Verify the change
        const result = await pool.query(
            'SELECT id, username, email FROM users WHERE email = $1',
            ['test3@example.com']
        );

        console.log('Updated user:', result.rows[0]);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixTestuser3();
