// Test overall mode query to verify it combines platforms
import pool from './src/config/database';

async function testOverallQuery() {
    try {
        const userId = 8;
        const friendId = 1; // Alice
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
        const platform = 'overall';

        console.log('🔍 Testing overall mode query...\n');

        // Query as endpoint does it
        let dailyQuery = `
            SELECT user_id, date::text as date_str, SUM(submission_count) as count
            FROM daily_submissions
            WHERE user_id IN ($1, $2) AND date >= $3`;

        const dailyParams: any[] = [userId, friendId, sixMonthsAgo];

        if (platform !== 'overall') {
            dailyQuery += ` AND platform = $4`;
            dailyParams.push(platform);
        }

        dailyQuery += ` GROUP BY user_id, date ORDER BY date ASC LIMIT 10`;

        const result = await pool.query(dailyQuery, dailyParams);

        console.log(`Found ${result.rows.length} rows (showing first 10):`);
        result.rows.forEach(row => {
            console.log(`   User ${row.user_id}, Date: ${row.date_str}, Count: ${row.count}`);
        });

        // Also check a specific date to see breakdown
        console.log('\n🔍 Checking breakdown for a specific date...\n');
        const breakdownResult = await pool.query(
            `SELECT platform, date::text, submission_count
             FROM daily_submissions
             WHERE user_id = $1 AND date = (
                 SELECT date FROM daily_submissions WHERE user_id = $1 LIMIT 1
             )`,
            [userId]
        );

        console.log('Breakdown:');
        breakdownResult.rows.forEach(row => {
            console.log(`   ${row.platform}: ${row.date} - ${row.submission_count} submissions`);
        });

        const total = breakdownResult.rows.reduce((sum, row) => sum + parseInt(row.submission_count), 0);
        console.log(`   TOTAL: ${total} submissions (this should match the combined count)`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

testOverallQuery();
