// Populate daily submissions data for touristtt (or any real user)
import pool from './src/config/database';
import { CodeforcesService } from './src/services/platforms/codeforces.service';
import { LeetCodeService } from './src/services/platforms/leetcode.service';

async function populateDailySubmissions() {
    try {
        console.log('📊 Fetching daily submissions for touristtt...\n');

        // Get touristtt's user ID and handles
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

        // Get platform handles
        const handlesResult = await pool.query(
            'SELECT platform, handle FROM platform_handles WHERE user_id = $1',
            [user.id]
        );

        if (handlesResult.rows.length === 0) {
            console.log('No platform handles found');
            return;
        }

        let totalInserted = 0;

        for (const handleRow of handlesResult.rows) {
            const { platform, handle } = handleRow;
            console.log(`\n📡 Fetching ${platform} submissions for handle: ${handle}...`);

            try {
                let dailyCounts: Map<string, number>;

                if (platform === 'codeforces') {
                    dailyCounts = await CodeforcesService.getDailySubmissions(handle, 365);
                } else if (platform === 'leetcode') {
                    dailyCounts = await LeetCodeService.getDailySubmissions(handle);
                } else {
                    continue;
                }

                console.log(`   Found ${dailyCounts.size} days with submissions`);

                // Insert into database
                for (const [date, count] of dailyCounts.entries()) {
                    await pool.query(
                        `INSERT INTO daily_submissions (user_id, platform, date, submission_count)
                         VALUES ($1, $2, $3, $4)
                         ON CONFLICT (user_id, platform, date) 
                         DO UPDATE SET submission_count = $4, updated_at = CURRENT_TIMESTAMP`,
                        [user.id, platform, date, count]
                    );
                }

                totalInserted += dailyCounts.size;
                console.log(`   ✅ Inserted/updated ${dailyCounts.size} days`);

            } catch (error) {
                console.error(`   ❌ Error fetching ${platform}:`, error);
            }
        }

        console.log(`\n✅ Total: ${totalInserted} days of submissions populated!`);

        // Verify
        const verifyResult = await pool.query(
            'SELECT COUNT(*) as count FROM daily_submissions WHERE user_id = $1',
            [user.id]
        );
        console.log(`\n📊 Database verification: ${verifyResult.rows[0].count} records for touristtt\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

populateDailySubmissions();
