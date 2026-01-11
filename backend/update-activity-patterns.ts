// Quick script to add varied activity patterns to MOCK users only (preserves real accounts)
import pool from './src/config/database';

async function updateActivityData() {
    try {
        console.log('Updating mock user activity patterns (preserving real accounts)...\n');

        // Define mock user emails to update (exclude real accounts like touristtt)
        const mockUserEmails = [
            'alice@example.com',
            'bob@example.com',
            'steve@example.com',
            'william@example.com',
            'joe@example.com',
            'virat@example.com'
        ];

        // Get mock users only
        const usersResult = await pool.query(
            'SELECT id, username, email FROM users WHERE email = ANY($1) ORDER BY id',
            [mockUserEmails]
        );
        const users = usersResult.rows;

        if (users.length === 0) {
            console.log('No mock users found.');
            return;
        }

        console.log(`Found ${users.length} mock users to update. Real accounts will be preserved.\n`);

        // Delete snapshots only for these mock users
        const userIds = users.map(u => u.id);
        await pool.query('DELETE FROM snapshots WHERE user_id = ANY($1)', [userIds]);

        // Activity probability for each user (different consistency levels)
        const activityProbabilities = [0.70, 0.55, 0.75, 0.45, 0.80, 0.85];

        const allSnapshots: any[] = [];

        for (let userIdx = 0; userIdx < users.length; userIdx++) {
            const user = users[userIdx];
            const activityProb = activityProbabilities[userIdx % activityProbabilities.length];

            // Get user's handles
            const handlesResult = await pool.query(
                'SELECT platform, current_rating FROM platform_handles WHERE user_id = $1',
                [user.id]
            );

            if (handlesResult.rows.length === 0) continue;

            console.log(`  ${user.username}: ~${Math.round(activityProb * 91)} active days (${Math.round(activityProb * 100)}% consistency)`);

            // Use seeded random for consistent randomness per user
            let seed = user.id * 1000;
            function seededRandom() {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            }

            for (let i = 180; i >= 0; i--) {
                // Skip days based on activity probability
                if (seededRandom() > activityProb) {
                    continue;
                }

                const date = new Date();
                date.setDate(date.getDate() - i);
                const progress = (180 - i) / 180;

                // Generate snapshot for each platform
                for (const handle of handlesResult.rows) {
                    const baseRating = handle.current_rating;
                    const startRating = Math.round(baseRating * 0.75);
                    const rating = Math.round(startRating + (baseRating - startRating) * progress + (Math.random() - 0.5) * 30);
                    const solved = Math.round(100 + progress * 200 + Math.random() * 20);

                    allSnapshots.push([
                        user.id,
                        handle.platform,
                        date,
                        rating,
                        solved,
                        JSON.stringify({
                            'Arrays': Math.floor(solved * 0.25),
                            'Dynamic Programming': Math.floor(solved * 0.15),
                            'Graphs': Math.floor(solved * 0.12),
                            'Math': Math.floor(solved * 0.18),
                            'Greedy': Math.floor(solved * 0.10),
                            'Trees': Math.floor(solved * 0.08)
                        })
                    ]);
                }
            }
        }

        console.log(`\nInserting ${allSnapshots.length} snapshots for mock users...`);
        for (const snapshot of allSnapshots) {
            await pool.query(
                `INSERT INTO snapshots (user_id, platform, timestamp, rating, total_solved, topic_breakdown) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                snapshot
            );
        }

        console.log('\n✅ Mock user activity data updated! Real accounts preserved.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

updateActivityData();
