import cron from 'node-cron';
import pool from '../config/database';
import { CodeforcesService } from './platforms/codeforces.service';
import { LeetCodeService } from './platforms/leetcode.service';
import { SnapshotService } from './snapshot.service';

/**
 * Daily cron job to refresh data for all verified platform handles
 * Runs at 2:00 AM every day
 */
export class SnapshotCronService {
    private static isRunning = false;

    /**
     * Initialize and start the cron job
     */
    static start() {
        // Run at 2:00 AM every day (0 2 * * *)
        cron.schedule('0 2 * * *', async () => {
            if (this.isRunning) {
                console.log('⏭️ Skipping daily refresh - previous job still running');
                return;
            }

            console.log('🔄 Starting daily data refresh...');
            this.isRunning = true;

            try {
                await this.refreshAllUsers();
            } catch (error) {
                console.error('❌ Daily refresh error:', error);
            } finally {
                this.isRunning = false;
                console.log('✅ Daily refresh completed');
            }
        });

        console.log('⏰ Daily data refresh cron job scheduled (2:00 AM)');
    }

    /**
     * Refresh data for all verified handles
     */
    private static async refreshAllUsers() {
        try {
            // Get all verified handles
            const handlesResult = await pool.query(
                'SELECT user_id, platform, handle FROM platform_handles WHERE is_verified = true'
            );

            const handles = handlesResult.rows;
            console.log(`📊 Found ${handles.length} verified handles to refresh`);

            let successCount = 0;
            let errorCount = 0;

            // Process each handle with delay to respect rate limits
            for (const handle of handles) {
                try {
                    await this.refreshHandle(handle.user_id, handle.platform, handle.handle);
                    successCount++;

                    // Add delay between requests to respect API rate limits
                    // Codeforces: 1 req per 2 seconds, LeetCode: more lenient
                    await this.sleep(2000); // 2 second delay
                } catch (error) {
                    console.error(`❌ Error refreshing ${handle.platform}:${handle.handle}:`, error);
                    errorCount++;
                }
            }

            console.log(`✅ Refresh complete - Success: ${successCount}, Errors: ${errorCount}`);
        } catch (error) {
            console.error('❌ Error fetching handles:', error);
            throw error;
        }
    }

    /**
     * Refresh a single handle
     */
    private static async refreshHandle(userId: number, platform: string, handle: string) {
        try {
            if (platform === 'codeforces') {
                const userInfo = await CodeforcesService.getUserInfo(handle);
                const topicBreakdown = await CodeforcesService.getTopicBreakdown(handle);

                if (!userInfo) {
                    throw new Error('Failed to fetch Codeforces user info');
                }

                // Update current rating
                await pool.query(
                    'UPDATE platform_handles SET current_rating = $1 WHERE user_id = $2 AND platform = $3',
                    [userInfo.rating, userId, platform]
                );

                // Create new snapshot
                await SnapshotService.createSnapshot({
                    user_id: userId,
                    platform: platform as any,
                    rating: userInfo.rating,
                    total_solved: 0,
                    topic_breakdown: topicBreakdown
                });

                console.log(`✓ Refreshed Codeforces for user ${userId}`);
            } else if (platform === 'leetcode') {
                const snapshot = await SnapshotService.createLeetCodeSnapshot(userId, handle);

                if (snapshot) {
                    // Update current rating
                    await pool.query(
                        'UPDATE platform_handles SET current_rating = $1 WHERE user_id = $2 AND platform = $3',
                        [snapshot.rating, userId, platform]
                    );

                    console.log(`✓ Refreshed LeetCode for user ${userId}`);
                } else {
                    throw new Error('Failed to create LeetCode snapshot');
                }
            }
        } catch (error) {
            console.error(`Error refreshing ${platform} for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Sleep helper for rate limiting
     */
    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
