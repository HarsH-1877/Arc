import pool from './src/config/database';
import bcrypt from 'bcryptjs';

async function createTestUsers() {
    try {
        const testUsers = [
            { username: 'testuser1', email: 'test1@example.com', password: 'password123' },
            { username: 'testuser2', email: 'test2@example.com', password: 'password123' },
            { username: 'testuser3', email: 'test3@example.com', password: 'password123' },
        ];

        for (const user of testUsers) {
            // Check if user already exists
            const existing = await pool.query(
                'SELECT id FROM users WHERE username = $1 OR email = $2',
                [user.username, user.email]
            );

            if (existing.rows.length > 0) {
                console.log(`✓ User ${user.username} already exists`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Create user
            await pool.query(
                'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
                [user.username, user.email, hashedPassword]
            );

            console.log(`✓ Created user: ${user.username} (${user.email})`);
        }

        console.log('\n✅ Test users created successfully!');
        console.log('\nYou can now login with:');
        console.log('  Username: testuser1, Password: password123');
        console.log('  Username: testuser2, Password: password123');
        console.log('  Username: testuser3, Password: password123');

        process.exit(0);
    } catch (error) {
        console.error('Error creating test users:', error);
        process.exit(1);
    }
}

createTestUsers();
