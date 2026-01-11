import pool from '../config/database';
import { CreateSnapshotDTO, Snapshot, Platform } from '../types/index';
import { CodeforcesService } from './platforms/codeforces.service';
import { LeetCodeService } from './platforms/leetcode.service';

export class SnapshotService {
    /**
     * Create a new snapshot
     */
    static async createSnapshot(data: CreateSnapshotDTO): Promise<Snapshot | null> {
        try {
            const result = await pool.query<Snapshot>(
                `INSERT INTO snapshots (user_id, platform, timestamp, rating, total_solved, topic_breakdown)
         VALUES ($1, $2, NOW(), $3, $4, $5)
         ON CONFLICT (user_id, platform, timestamp) DO NOTHING
         RETURNING *`,
                [data.user_id, data.platform, data.rating, data.total_solved, JSON.stringify(data.topic_breakdown)]
            );

            return result.rows[0] || null;
        } catch (error: any) {
            console.error('Create snapshot error:', error);
            return null;
        }
    }

    /**
     * Backfill Codeforces rating history (last 90 days)
     */
    static async backfillCodeforcesHistory(userId: number, handle: string): Promise<number> {
        try {
            const ratingHistory = await CodeforcesService.getRatingHistory(handle);
            if (ratingHistory.length === 0) return 0;

            // Filter last 90 days
            const ninetyDaysAgo = Date.now() / 1000 - (90 * 24 * 60 * 60);
            const recentChanges = ratingHistory.filter(
                change => change.ratingUpdateTimeSeconds >= ninetyDaysAgo
            );

            // Get topic breakdown once
            const topicBreakdown = await CodeforcesService.getTopicBreakdown(handle);

            let snapshotsCreated = 0;

            for (const change of recentChanges) {
                const timestamp = new Date(change.ratingUpdateTimeSeconds * 1000);

                await pool.query(
                    `INSERT INTO snapshots (user_id, platform, timestamp, rating, total_solved, topic_breakdown)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, platform, timestamp) DO NOTHING`,
                    [userId, 'codeforces', timestamp, change.newRating, 0, JSON.stringify(topicBreakdown)]
                );

                snapshotsCreated++;
            }

            // Create current snapshot
            const userInfo = await CodeforcesService.getUserInfo(handle);
            if (userInfo) {
                await this.createSnapshot({
                    user_id: userId,
                    platform: 'codeforces',
                    rating: userInfo.rating,
                    total_solved: 0, // Will be updated by submission count
                    topic_breakdown: topicBreakdown
                });
                snapshotsCreated++;
            }

            console.log(`Backfilled ${snapshotsCreated} Codeforces snapshots for user ${userId}`);
            return snapshotsCreated;
        } catch (error: any) {
            console.error('Backfill CF history error:', error);
            return 0;
        }
    }

    /**
     * Create initial LeetCode snapshot (no backfill possible)
     */
    static async createLeetCodeSnapshot(userId: number, username: string): Promise<Snapshot | null> {
        try {
            const stats = await LeetCodeService.getUserStats(username);
            const topicBreakdown = await LeetCodeService.getTopicBreakdown(username);

            if (!stats) return null;

            return await this.createSnapshot({
                user_id: userId,
                platform: 'leetcode',
                rating: stats.ranking,
                total_solved: stats.totalSolved,
                topic_breakdown: topicBreakdown
            });
        } catch (error: any) {
            console.error('Create LC snapshot error:', error);
            return null;
        }
    }

    /**
     * Get snapshots for a user
     */
    static async getUserSnapshots(
        userId: number,
        platform: Platform | 'overall',
        days: number = 90
    ): Promise<Snapshot[]> {
        try {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - days);

            let query = `
        SELECT * FROM snapshots
        WHERE user_id = $1 AND timestamp >= $2
      `;
            const params: any[] = [userId, daysAgo];

            if (platform !== 'overall') {
                query += ` AND platform = $3`;
                params.push(platform);
            }

            query += ` ORDER BY timestamp ASC`;

            const result = await pool.query<Snapshot>(query, params);
            return result.rows;
        } catch (error: any) {
            console.error('Get user snapshots error:', error);
            return [];
        }
    }

    /**
     * Get latest snapshot for a user
     */
    static async getLatestSnapshot(userId: number, platform: Platform): Promise<Snapshot | null> {
        try {
            const result = await pool.query<Snapshot>(
                `SELECT * FROM snapshots
         WHERE user_id = $1 AND platform = $2
         ORDER BY timestamp DESC
         LIMIT 1`,
                [userId, platform]
            );

            return result.rows[0] || null;
        } catch (error: any) {
            console.error('Get latest snapshot error:', error);
            return null;
        }
    }
}
