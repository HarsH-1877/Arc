import cron from 'node-cron';
import pool from '../config/database';
import axios from 'axios';

// Daily refresh job - runs at 2:00 AM IST every day
export function startDailyRefreshJob() {
    // Cron expression: "0 2 * * *" at 2:00 AM
    // IST is UTC+5:30, so we need to adjust the schedule
    // 2:00 AM IST = 8:30 PM UTC (previous day)
    // Using timezone option to handle IST properly

    cron.schedule('30 20 * * *', async () => {
        console.log('🔄 [Daily Refresh] Starting automated snapshot refresh...');

        try {
            // Get all users with verified platform handles
            const usersResult = await pool.query(`
                SELECT DISTINCT ph.user_id, u.username, ph.platform, ph.handle
                FROM platform_handles ph
                JOIN users u ON ph.user_id = u.id
                WHERE ph.is_verified = true
                ORDER BY ph.user_id
            `);

            const users = usersResult.rows;
            console.log(`📊 [Daily Refresh] Found ${users.length} platform handles to refresh`);

            let successCount = 0;
            let errorCount = 0;

            // Process each user's platform handle
            for (const userHandle of users) {
                try {
                    console.log(`  → Refreshing ${userHandle.platform} for user ${userHandle.username}...`);

                    let currentRating = null;
                    let totalSolved = null;
                    let topicBreakdown = null;

                    if (userHandle.platform === 'codeforces') {
                        // Fetch Codeforces data
                        const cfResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${userHandle.handle}`);

                        if (cfResponse.data.status === 'OK' && cfResponse.data.result.length > 0) {
                            const cfUser = cfResponse.data.result[0];
                            currentRating = cfUser.rating || 0;

                            // Fetch submission count
                            const submissionsResponse = await axios.get(`https://codeforces.com/api/user.status?handle=${userHandle.handle}&from=1&count=10000`);

                            if (submissionsResponse.data.status === 'OK') {
                                const acceptedSubmissions = submissionsResponse.data.result.filter(
                                    (s: any) => s.verdict === 'OK'
                                );

                                totalSolved = new Set(acceptedSubmissions.map((s: any) =>
                                    `${s.problem.contestId}-${s.problem.index}`
                                )).size;

                                // Build topic breakdown
                                const topicCounts: { [key: string]: number } = {};
                                acceptedSubmissions.forEach((s: any) => {
                                    (s.problem.tags || []).forEach((tag: string) => {
                                        topicCounts[tag] = (topicCounts[tag] || 0) + 1;
                                    });
                                });
                                topicBreakdown = topicCounts;
                            }
                        }
                    } else if (userHandle.platform === 'leetcode') {
                        // Fetch LeetCode data
                        const lcResponse = await axios.post('https://leetcode.com/graphql', {
                            query: `
                                query getUserProfile($username: String!) {
                                    matchedUser(username: $username) {
                                        username
                                        profile {
                                            ranking
                                            reputation
                                        }
                                        submitStats {
                                            acSubmissionNum {
                                                difficulty
                                                count
                                            }
                                        }
                                    }
                                    userContestRanking(username: $username) {
                                        rating
                                    }
                                }
                            `,
                            variables: { username: userHandle.handle }
                        });

                        const lcUser = lcResponse.data?.data?.matchedUser;
                        const contestRanking = lcResponse.data?.data?.userContestRanking;

                        if (lcUser) {
                            currentRating = Math.round(contestRanking?.rating || 0);

                            const acStats = lcUser.submitStats?.acSubmissionNum || [];
                            totalSolved = acStats.reduce((sum: number, stat: any) => sum + stat.count, 0);

                            // LeetCode doesn't provide topic breakdown easily, so we'll use difficulty levels
                            topicBreakdown = {
                                'Easy': acStats.find((s: any) => s.difficulty === 'Easy')?.count || 0,
                                'Medium': acStats.find((s: any) => s.difficulty === 'Medium')?.count || 0,
                                'Hard': acStats.find((s: any) => s.difficulty === 'Hard')?.count || 0
                            };
                        }
                    }

                    if (currentRating !== null) {
                        // Update platform handle
                        await pool.query(
                            `UPDATE platform_handles 
                             SET current_rating = $1, updated_at = NOW() 
                             WHERE user_id = $2 AND platform = $3`,
                            [currentRating, userHandle.user_id, userHandle.platform]
                        );

                        // Create snapshot
                        await pool.query(
                            `INSERT INTO snapshots (user_id, platform, timestamp, rating, total_solved, topic_breakdown)
                             VALUES ($1, $2, NOW(), $3, $4, $5)`,
                            [userHandle.user_id, userHandle.platform, currentRating, totalSolved, JSON.stringify(topicBreakdown)]
                        );

                        console.log(`    ✓ Refreshed ${userHandle.platform} for ${userHandle.username}: ${currentRating} rating`);
                        successCount++;
                    } else {
                        console.log(`    ⚠ Failed to fetch data for ${userHandle.username} (${userHandle.platform})`);
                        errorCount++;
                    }

                    // Rate limiting: wait 1 second between API calls
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error: any) {
                    console.error(`    ✗ Error refreshing ${userHandle.platform} for ${userHandle.username}:`, error.message);
                    errorCount++;
                }
            }

            console.log(`✅ [Daily Refresh] Completed: ${successCount} successful, ${errorCount} errors`);

        } catch (error) {
            console.error('❌ [Daily Refresh] Fatal error during automated refresh:', error);
        }
    }, {
        timezone: "Asia/Kolkata" // IST timezone
    });

    console.log('⏰ Daily refresh job scheduled for 2:00 AM IST');
}
