// Run migration to create daily_submissions table
import pool from './src/config/database';

async function createDailySubmissionsTable() {
    try {
        console.log('🔧 Creating daily_submissions table...\n');

        // Create table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_submissions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                platform VARCHAR(20) NOT NULL CHECK (platform IN ('codeforces', 'leetcode')),
                date DATE NOT NULL,
                submission_count INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, platform, date)
            );
        `);
        console.log('✅ Table created successfully');

        // Create index
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_daily_submissions_user_platform 
            ON daily_submissions(user_id, platform, date);
        `);
        console.log('✅ Index created successfully');

        // Verify
        const result = await pool.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_name = 'daily_submissions';
        `);

        if (result.rows[0].count === '1') {
            console.log('\n✅ Migration successful! Table daily_submissions is ready.\n');
        } else {
            console.log('\n⚠️  Table may not have been created properly.\n');
        }

    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        await pool.end();
    }
}

createDailySubmissionsTable();
