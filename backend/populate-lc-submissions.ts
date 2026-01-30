// Check and populate LeetCode daily submissions
import pool from './src/config/database';
import { LeetCodeService } from './src/services/platforms/leetcode.service';

async function populateLCSubmissions() {
    try {
        console.log('🔍 Checking LeetCode data for touristtt...\n');

        const userId = 8;

        // Get LC handle
        const handleResult = await pool.query(
            'SELECT handle FROM platform_handles WHERE user_id = $1 AND platform = $2',
            [userId, 'leetcode']
        );

        if (handleResult.rows.length === 0) {
            console.log('❌ No LC handle found');
            return;
        }

        const handle = handleResult.rows[0].handle;
        console.log(`✅ Found LC handle: ${handle}\n`);

        // Fetch daily submissions from LC API
        console.log('📡 Fetching LC daily submissions...');
        const dailyCounts = await LeetCodeService.getDailySubmissions(handle);
        console.log(`   Found ${dailyCounts.size} days with submissions\n`);

        if (dailyCounts.size === 0) {
            console.log('⚠️  No daily submission data from LC API');
            return;
        }

        // Delete existing LC data
        await pool.query(
            'DELETE FROM daily_submissions WHERE user_id = $1 AND platform = $2',
            [userId, 'leetcode']
        );
        console.log('✅ Cleared old LC data');

        // Insert new data
        let inserted = 0;
        for (const [date, count] of dailyCounts.entries()) {
            await pool.query(
                `INSERT INTO daily_submissions (user_id, platform, date, submission_count)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, platform, date) 
                 DO UPDATE SET submission_count = $4`,
                [userId, 'leetcode', date, count]
            );
            inserted++;
        }

        console.log(`✅ Inserted ${inserted} days of LC submissions\n`);

        // Verify
        const verifyResult = await pool.query(
            `SELECT platform, COUNT(*) as days, SUM(submission_count) as total
             FROM daily_submissions 
             WHERE user_id = $1
             GROUP BY platform`,
            [userId]
        );

        console.log('📊 Verification:');
        verifyResult.rows.forEach(row => {
            console.log(`   ${row.platform}: ${row.days} days, ${row.total} total submissions`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

populateLCSubmissions();
