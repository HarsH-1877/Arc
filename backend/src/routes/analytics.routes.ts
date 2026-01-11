import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// Utility function to normalize ratings to 0-100 scale (percentile-based)
const normalizeRating = (rating: number, platform: string): number => {
    // Typical rating ranges for each platform
    const ranges: { [key: string]: { min: number; max: number } } = {
        codeforces: { min: 800, max: 3500 },
        leetcode: { min: 1000, max: 3000 }
    };

    const range = ranges[platform] || { min: 0, max: 5000 };
    const normalized = ((rating - range.min) / (range.max - range.min)) * 100;
    return Math.max(0, Math.min(100, normalized)); // Clamp between 0-100
};

// Utility to get Date object from various formats
const parseDate = (d: any) => new Date(d);

// Generate array of last N days (as YYYY-MM-DD strings for easy lookup)
const getLastNDays = (n: number) => {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
};

// Helper to interpolate history (Forward Fill)
const interpolateHistory = (snapshots: any[], allDates: string[]) => {
    // Sort snapshots by time
    const sorted = [...snapshots].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let lastKnownRating = 0;
    let hasData = false;

    return allDates.map(dateStr => {
        const dateObj = new Date(dateStr);

        // Find latest snapshot on or before this date
        const relevantSnaps = sorted.filter(s => new Date(s.timestamp).toISOString().split('T')[0] <= dateStr);

        if (relevantSnaps.length > 0) {
            lastKnownRating = relevantSnaps[relevantSnaps.length - 1].rating;
            hasData = true;
        }

        return {
            rating: hasData ? lastKnownRating : null,
            snapshot_date: dateObj.toISOString(),
            raw_date: dateStr
        };
    });
};

// Normalize rating helper
const normalizeRatingVal = (rating: number, plat: string) => {
    // Standardize max ratings for normalization (Same as before)
    const MAX_RATINGS: { [key: string]: number } = { 'codeforces': 3500, 'leetcode': 3000 };
    const max = MAX_RATINGS[plat] || 3500;
    return Math.min(100, (rating / max) * 100);
};

// Get rating history for a user (for charts)
// @ts-ignore - Express middleware type conflict
router.get('/rating-history', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { platform, mode } = req.query; // mode can be 'friends-avg' or 'friends'

        // 1. Get user's top 4 friends
        let friendsQuery, friendsParams;

        if (platform && platform !== 'overall') {
            friendsQuery = `
                SELECT DISTINCT
                    CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END as friend_id,
                    u.username as name,
                    ph.current_rating
                FROM friends f
                JOIN users u ON (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END = u.id)
                LEFT JOIN platform_handles ph ON u.id = ph.user_id AND ph.platform = $2
                WHERE f.user_id = $1 OR f.friend_id = $1
                ORDER BY ph.current_rating DESC NULLS LAST
                LIMIT 4
            `;
            friendsParams = [userId, platform];
        } else {
            friendsQuery = `
                SELECT DISTINCT
                    CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END as friend_id,
                    u.username as name,
                    COALESCE(ROUND(AVG(ph.current_rating)), 0) as avg_rating
                FROM friends f
                JOIN users u ON (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END = u.id)
                LEFT JOIN platform_handles ph ON u.id = ph.user_id
                WHERE f.user_id = $1 OR f.friend_id = $1
                GROUP BY friend_id, u.username
                ORDER BY avg_rating DESC NULLS LAST
                LIMIT 4
            `;
            friendsParams = [userId];
        }

        const friendsResult = await pool.query(friendsQuery, friendsParams);
        const friendIds = friendsResult.rows.map(r => r.friend_id);
        const allUserIds = [userId, ...friendIds];

        // 2. Fetch ALL snapshots for these users (Last 100 days to ensure we have a starting point)
        const backfillDaysAgo = new Date();
        backfillDaysAgo.setDate(backfillDaysAgo.getDate() - 100);

        let snapshotsQuery = `
            SELECT user_id, platform, timestamp, rating 
            FROM snapshots 
            WHERE user_id = ANY($1) AND timestamp >= $2
            ORDER BY timestamp ASC
        `;
        let snapshotsParams: any[] = [allUserIds, backfillDaysAgo];

        if (platform && platform !== 'overall') {
            snapshotsQuery = `
                SELECT user_id, platform, timestamp, rating 
                FROM snapshots 
                WHERE user_id = ANY($1) AND platform = $2 AND timestamp >= $3
                ORDER BY timestamp ASC
            `;
            snapshotsParams = [allUserIds, platform, backfillDaysAgo];
        }

        const snapshotsResult = await pool.query(snapshotsQuery, snapshotsParams);

        // 3. Group snapshots by User -> Platform
        const userSnaps: { [uid: number]: { [plat: string]: any[] } } = {};
        allUserIds.forEach(uid => userSnaps[uid] = { codeforces: [], leetcode: [] });

        snapshotsResult.rows.forEach(s => {
            if (!userSnaps[s.user_id]) userSnaps[s.user_id] = { codeforces: [], leetcode: [] };
            if (userSnaps[s.user_id][s.platform]) userSnaps[s.user_id][s.platform].push(s);
        });

        // 4. Generate Master Date List (Last 90 days)
        const dateList = getLastNDays(90);

        // 5. Interpolate History for Every User
        // Structure: result[userId][dateIndex] = { rating, normalized }
        const interpolatedData: { [uid: number]: any[] } = {};

        allUserIds.forEach(uid => {
            // Get interpolated streams for both platforms
            const cfStream = interpolateHistory(userSnaps[uid].codeforces, dateList);
            const lcStream = interpolateHistory(userSnaps[uid].leetcode, dateList);

            // Combine based on requested view
            interpolatedData[uid] = dateList.map((dateStr, idx) => {
                const cfRating = cfStream[idx]?.rating;
                const lcRating = lcStream[idx]?.rating;

                let finalRating: number | null = null;

                if (platform === 'codeforces') {
                    finalRating = cfRating;
                } else if (platform === 'leetcode') {
                    finalRating = lcRating;
                } else {
                    // Overall Logic with Normalization
                    if (cfRating !== null || lcRating !== null) {
                        const cfNorm = (cfRating !== null && cfRating > 0) ? normalizeRatingVal(cfRating, 'codeforces') : 0;
                        const lcNorm = (lcRating !== null && lcRating > 0) ? normalizeRatingVal(lcRating, 'leetcode') : 0;

                        if (cfRating !== null && cfRating > 0 && lcRating !== null && lcRating > 0) {
                            finalRating = (cfNorm + lcNorm) / 2;
                        } else {
                            finalRating = cfNorm || lcNorm;
                        }
                    }
                }

                return {
                    rating: finalRating !== null ? Math.round(finalRating) : null,
                    snapshot_date: cfStream[idx].snapshot_date
                };
            });
        });

        // Find the first index where the main user has valid data
        let startIndex = 0;
        for (let i = 0; i < interpolatedData[userId].length; i++) {
            if (interpolatedData[userId][i].rating !== null) {
                startIndex = i;
                break;
            }
        }

        // Trim all arrays from startIndex to maintain alignment
        const trimmedDateList = dateList.slice(startIndex);
        Object.keys(interpolatedData).forEach(uid => {
            interpolatedData[Number(uid)] = interpolatedData[Number(uid)].slice(startIndex);
        });

        // 6. Construct Final Response
        const myHistory = interpolatedData[userId];
        let responseData: any = {
            history: myHistory,
            friends_avg: [],
            friends: []
        };

        // Calculate Friends Average
        if (mode === 'friends-avg' || !mode) {
            responseData.friends_avg = myHistory.map((item, idx) => {
                let total = 0;
                let count = 0;
                friendIds.forEach(fid => {
                    const r = interpolatedData[fid][idx]?.rating;
                    if (r !== null && r > 0) {
                        total += r;
                        count++;
                    }
                });
                return {
                    rating: count > 0 ? Math.round(total / count) : null,
                    snapshot_date: item.snapshot_date
                };
            });
        }

        // Individual Friends Data
        if (mode === 'friends') {
            responseData.friends = friendsResult.rows.map(f => ({
                id: f.friend_id,
                name: f.name,
                history: interpolatedData[f.friend_id]
            }));
        }

        res.json({
            success: true,
            data: responseData
        });

    } catch (error: any) {
        console.error('Rating history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rating history'
        });
    }
});

// Get topic breakdown (question counts per topic)
// @ts-ignore - Express middleware type conflict
router.get('/topic-breakdown', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { platform } = req.query;

        // Build query to get latest snapshot with topic_breakdown
        let snapshotsQuery;
        let queryParams;

        if (platform && platform !== 'overall') {
            // Get latest snapshot for specific platform
            snapshotsQuery = `
                SELECT topic_breakdown 
                FROM snapshots 
                WHERE user_id = $1 AND platform = $2 AND topic_breakdown IS NOT NULL
                ORDER BY timestamp DESC
                LIMIT 1
            `;
            queryParams = [userId, platform];
        } else {
            // Get latest snapshots from all platforms
            snapshotsQuery = `
                SELECT topic_breakdown, platform
                FROM snapshots 
                WHERE user_id = $1 AND topic_breakdown IS NOT NULL
                AND timestamp IN (
                    SELECT MAX(timestamp) 
                    FROM snapshots 
                    WHERE user_id = $1 
                    GROUP BY platform
                )
            `;
            queryParams = [userId];
        }

        const snapshotsResult = await pool.query(snapshotsQuery, queryParams);

        let allTopics: { topic_name: string; question_count: number }[] = [];

        // Process topic breakdowns
        for (const row of snapshotsResult.rows) {
            const topicBreakdown = row.topic_breakdown;

            if (topicBreakdown && typeof topicBreakdown === 'object') {
                Object.entries(topicBreakdown).forEach(([topic, count]) => {
                    const existingTopic = allTopics.find(t => t.topic_name === topic);
                    if (existingTopic) {
                        existingTopic.question_count += count as number;
                    } else {
                        allTopics.push({ topic_name: topic, question_count: count as number });
                    }
                });
            }
        }

        // Sort by question count descending
        allTopics.sort((a, b) => b.question_count - a.question_count);

        res.json({
            success: true,
            data: {
                topics: allTopics
            }
        });
    } catch (error: any) {
        console.error('Topic breakdown error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch topic breakdown'
        });
    }
});

// Get growth statistics
// @ts-ignore - Express middleware type conflict
router.get('/growth-stats', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { platform } = req.query;

        // Fetch actual ratings from database
        const handlesQuery = platform && platform !== 'overall'
            ? `SELECT platform, current_rating FROM platform_handles WHERE user_id = $1 AND platform = $2 AND is_verified = true`
            : `SELECT platform, current_rating FROM platform_handles WHERE user_id = $1 AND is_verified = true`;

        const params = platform && platform !== 'overall' ? [userId, platform] : [userId];
        const handlesResult = await pool.query(handlesQuery, params);

        // Format current ratings
        const current_ratings = handlesResult.rows.map(row => ({
            platform: row.platform,
            current_rating: row.current_rating || 0
        }));

        // Mock data for other stats (to be implemented later)
        const mockStats = {
            current_ratings,
            rating_change: 147,
            percentile: 78,
            friends_count: 4
        };

        res.json({
            success: true,
            data: mockStats
        });
    } catch (error: any) {
        console.error('Growth stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch growth statistics'
        });
    }
});

// Get friends leaderboard
// @ts-ignore - Express middleware type conflict
router.get('/friends-leaderboard', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { platform } = req.query;

        // Get user's friends
        const friendsResult = await pool.query(
            `SELECT DISTINCT
                CASE 
                    WHEN f.user_id = $1 THEN f.friend_id
                    ELSE f.user_id
                END as friend_id
             FROM friends f
             WHERE f.user_id = $1 OR f.friend_id = $1`,
            [userId]
        );

        const friendIds = friendsResult.rows.map(r => r.friend_id);

        // Include the current user in the leaderboard
        const allUserIds = [userId, ...friendIds];

        if (allUserIds.length === 0) {
            return res.json({
                success: true,
                data: { leaderboard: [] }
            });
        }

        // Build query to get users with their ratings
        let ratingsQuery;
        let queryParams;

        if (platform && platform !== 'overall') {
            // Get platform-specific rating
            ratingsQuery = `
                SELECT 
                    u.id,
                    u.username,
                    ph.platform,
                    ph.current_rating,
                    COALESCE((
                        SELECT s2.rating - s1.rating
                        FROM snapshots s1
                        JOIN snapshots s2 ON s1.user_id = s2.user_id AND s1.platform = s2.platform
                        WHERE s1.user_id = u.id 
                        AND s1.platform = $2
                        AND s1.timestamp >= NOW() - INTERVAL '30 days'
                        ORDER BY s1.timestamp ASC, s2.timestamp DESC
                        LIMIT 1
                    ), 0) as rating_change
                FROM users u
                LEFT JOIN platform_handles ph ON u.id = ph.user_id AND ph.platform = $2
                WHERE u.id = ANY($1)
                ORDER BY ph.current_rating DESC NULLS LAST
            `;
            queryParams = [allUserIds, platform];
        } else {
            // Overall: get average of all platform ratings
            ratingsQuery = `
                SELECT 
                    u.id,
                    u.username,
                    'overall' as platform,
                    COALESCE(ROUND(AVG(ph.current_rating)), 0) as current_rating,
                    0 as rating_change
                FROM users u
                LEFT JOIN platform_handles ph ON u.id = ph.user_id
                WHERE u.id = ANY($1)
                GROUP BY u.id, u.username
                ORDER BY current_rating DESC NULLS LAST
            `;
            queryParams = [allUserIds];
        }

        const leaderboardResult = await pool.query(ratingsQuery, queryParams);

        const leaderboard = leaderboardResult.rows.map(row => ({
            id: row.id,
            username: row.username,
            platform: row.platform,
            current_rating: row.current_rating || 0,
            rating_change: row.rating_change || 0
        }));

        res.json({
            success: true,
            data: {
                leaderboard
            }
        });
    } catch (error: any) {
        console.error('Friends leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch friends leaderboard'
        });
    }
});

export default router;
