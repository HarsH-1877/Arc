import { Router, Response } from 'express';
import pool from '../config/database';
import { AuthRequest, authenticate } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

// Get comparison overview data between user and friend
// @ts-ignore - Express middleware type conflict
router.get('/:friendId/overview', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall'; // overall, codeforces, or leetcode

        // Verify friendship exists
        const friendCheck = await pool.query(
            'SELECT id FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [userId, friendId]
        );

        if (friendCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Not friends with this user'
            });
        }

        // Get snapshots for last 90 days for both users
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        let snapshotsQuery;
        let queryParams;

        if (platform === 'overall') {
            // Get snapshots from both platforms
            snapshotsQuery = `SELECT user_id, platform, timestamp, rating, total_solved
                              FROM snapshots
                              WHERE user_id IN ($1, $2) AND timestamp >= $3
                              ORDER BY timestamp ASC`;
            queryParams = [userId, friendId, ninetyDaysAgo];
        } else {
            // Get snapshots from specific platform
            snapshotsQuery = `SELECT user_id, platform, timestamp, rating, total_solved
                              FROM snapshots
                              WHERE user_id IN ($1, $2) AND platform = $3 AND timestamp >= $4
                              ORDER BY timestamp ASC`;
            queryParams = [userId, friendId, platform, ninetyDaysAgo];
        }

        const snapshotsResult = await pool.query(snapshotsQuery, queryParams);

        // Get user info
        const usersResult = await pool.query(
            `SELECT u.id, u.username, u.email FROM users u WHERE u.id IN ($1, $2)`,
            [userId, friendId]
        );

        const userMap = new Map(usersResult.rows.map(u => [u.id, u]));
        const currentUser = userMap.get(userId);
        const friend = userMap.get(friendId);

        // Get current ratings from platform_handles
        let currentRatingQuery;
        let ratingQueryParams;

        if (platform === 'overall') {
            currentRatingQuery = `SELECT user_id, platform, current_rating
                                   FROM platform_handles
                                   WHERE user_id IN ($1, $2) AND current_rating IS NOT NULL`;
            ratingQueryParams = [userId, friendId];
        } else {
            currentRatingQuery = `SELECT user_id, platform, current_rating
                                   FROM platform_handles
                                   WHERE user_id IN ($1, $2) AND platform = $3 AND current_rating IS NOT NULL`;
            ratingQueryParams = [userId, friendId, platform];
        }

        const ratingsResult = await pool.query(currentRatingQuery, ratingQueryParams);

        // Organize data by user and platform
        const userData: any = {
            snapshots: [] as any[],
            current_ratings: {} as any,
            rating_changes: {} as any,
            problems_solved: 0
        };

        const friendData: any = {
            snapshots: [] as any[],
            current_ratings: {} as any,
            rating_changes: {} as any,
            problems_solved: 0
        };

        // Process current ratings
        ratingsResult.rows.forEach(row => {
            if (row.user_id === userId) {
                userData.current_ratings[row.platform] = row.current_rating;
            } else {
                friendData.current_ratings[row.platform] = row.current_rating;
            }
        });

        // Process snapshots
        snapshotsResult.rows.forEach(s => {
            if (s.user_id === userId) {
                userData.snapshots.push(s);
            } else {
                friendData.snapshots.push(s);
            }
        });

        // Calculate rating changes and problems solved by platform
        // For rating changes, use the 90-day window data
        // For problems_solved, get the LATEST snapshot regardless of time window
        const latestSnapshotsQuery = platform === 'overall'
            ? `SELECT DISTINCT ON (user_id, platform) user_id, platform, total_solved
               FROM snapshots
               WHERE user_id IN ($1, $2)
               ORDER BY user_id, platform, timestamp DESC`
            : `SELECT DISTINCT ON (user_id) user_id, total_solved
               FROM snapshots
               WHERE user_id IN ($1, $2) AND platform = $3
               ORDER BY user_id, timestamp DESC`;

        const latestParams = platform === 'overall' ? [userId, friendId] : [userId, friendId, platform];
        const latestSnapshotsResult = await pool.query(latestSnapshotsQuery, latestParams);

        // Process latest snapshots for accurate problem counts
        const latestUserData: any = {};
        const latestFriendData: any = {};

        latestSnapshotsResult.rows.forEach(row => {
            if (row.user_id === userId) {
                if (platform === 'overall') {
                    latestUserData[row.platform] = row.total_solved || 0;
                } else {
                    latestUserData.total = row.total_solved || 0;
                }
            } else {
                if (platform === 'overall') {
                    latestFriendData[row.platform] = row.total_solved || 0;
                } else {
                    latestFriendData.total = row.total_solved || 0;
                }
            }
        });

        if (platform === 'overall') {
            // Group by platform for rating changes
            ['codeforces', 'leetcode'].forEach(p => {
                const userPlatformSnaps = userData.snapshots.filter((s: any) => s.platform === p);
                const friendPlatformSnaps = friendData.snapshots.filter((s: any) => s.platform === p);

                if (userPlatformSnaps.length >= 2) {
                    userData.rating_changes[p] = userPlatformSnaps[userPlatformSnaps.length - 1].rating - userPlatformSnaps[0].rating;
                }
                if (friendPlatformSnaps.length >= 2) {
                    friendData.rating_changes[p] = friendPlatformSnaps[friendPlatformSnaps.length - 1].rating - friendPlatformSnaps[0].rating;
                }
            });

            // Total problems solved - use latest snapshots from each platform
            userData.problems_solved = (latestUserData.codeforces || 0) + (latestUserData.leetcode || 0);
            friendData.problems_solved = (latestFriendData.codeforces || 0) + (latestFriendData.leetcode || 0);
        } else {
            // Single platform
            if (userData.snapshots.length >= 2) {
                userData.rating_changes[platform] = userData.snapshots[userData.snapshots.length - 1].rating - userData.snapshots[0].rating;
            }
            if (friendData.snapshots.length >= 2) {
                friendData.rating_changes[platform] = friendData.snapshots[friendData.snapshots.length - 1].rating - friendData.snapshots[0].rating;
            }

            // Use latest snapshot data for accurate problem counts
            userData.problems_solved = latestUserData.total || 0;
            friendData.problems_solved = latestFriendData.total || 0;
        }

        res.json({
            success: true,
            data: {
                you: {
                    id: currentUser?.id,
                    username: currentUser?.username,
                    current_ratings: userData.current_ratings,
                    rating_changes: userData.rating_changes,
                    problems_solved: userData.problems_solved,
                    snapshots: userData.snapshots.map((s: any) => ({
                        platform: s.platform,
                        timestamp: s.timestamp,
                        rating: s.rating,
                        total_solved: s.total_solved
                    }))
                },
                friend: {
                    id: friend?.id,
                    username: friend?.username,
                    current_ratings: friendData.current_ratings,
                    rating_changes: friendData.rating_changes,
                    problems_solved: friendData.problems_solved,
                    snapshots: friendData.snapshots.map((s: any) => ({
                        platform: s.platform,
                        timestamp: s.timestamp,
                        rating: s.rating,
                        total_solved: s.total_solved
                    }))
                }
            }
        });
    } catch (error: any) {
        console.error('Compare overview error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Get topic comparison between user and friend
// @ts-ignore - Express middleware type conflict
router.get('/:friendId/topics', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall';

        // Verify friendship exists
        const friendCheck = await pool.query(
            'SELECT id FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [userId, friendId]
        );

        if (friendCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Not friends with this user'
            });
        }

        // Get latest topic breakdown for both users from ALL platforms
        const topicsResult = await pool.query(
            `WITH latest_snapshots AS (
                SELECT DISTINCT ON (user_id, platform) user_id, platform, topic_breakdown
                FROM snapshots
                WHERE user_id IN ($1, $2) AND topic_breakdown IS NOT NULL
                ORDER BY user_id, platform, timestamp DESC
            )
            SELECT user_id, platform, topic_breakdown
            FROM latest_snapshots
            WHERE $3 = 'overall' OR platform = $3`,
            [userId, friendId, platform]
        );

        // Aggregate topics across all platforms for each user
        const userTopicsMap: { [topic: string]: number } = {};
        const friendTopicsMap: { [topic: string]: number } = {};

        topicsResult.rows.forEach(row => {
            const topicBreakdown = row.topic_breakdown;
            const targetMap = row.user_id === userId ? userTopicsMap : friendTopicsMap;

            if (topicBreakdown && typeof topicBreakdown === 'object') {
                Object.entries(topicBreakdown).forEach(([topic, count]) => {
                    targetMap[topic] = (targetMap[topic] || 0) + (count as number);
                });
            }
        });

        // Get usernames
        const usersResult = await pool.query(
            'SELECT id, username FROM users WHERE id IN ($1, $2)',
            [userId, friendId]
        );
        const userMap = new Map(usersResult.rows.map(u => [u.id, u.username]));

        res.json({
            success: true,
            data: {
                you: {
                    username: userMap.get(userId),
                    topics: Object.entries(userTopicsMap).map(([topic, count]) => ({
                        topic_name: topic,
                        count: count as number
                    }))
                },
                friend: {
                    username: userMap.get(friendId),
                    topics: Object.entries(friendTopicsMap).map(([topic, count]) => ({
                        topic_name: topic,
                        count: count as number
                    }))
                }
            }
        });
    } catch (error: any) {
        console.error('Compare topics error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Get consistency comparison between user and friend
// @ts-ignore - Express middleware type conflict
router.get('/:friendId/consistency', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = (req.query.platform as string) || 'overall';

        // Verify friendship exists
        const friendCheck = await pool.query(
            'SELECT id FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [userId, friendId]
        );

        if (friendCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Not friends with this user'
            });
        }

        // Get snapshots for last 180 days (6 months) for both users
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

        // Build snapshot query with optional platform filtering
        let snapshotsQuery = `
            SELECT DISTINCT user_id, DATE(timestamp) as date
            FROM snapshots
            WHERE user_id IN ($1, $2) AND timestamp >= $3`;

        const snapshotsParams: any[] = [userId, friendId, sixMonthsAgo];

        if (platform !== 'overall') {
            snapshotsQuery += ` AND platform = $4`;
            snapshotsParams.push(platform);
        }

        snapshotsQuery += `
            GROUP BY user_id, DATE(timestamp)
            ORDER BY user_id, date ASC`;

        const snapshotsResult = await pool.query(snapshotsQuery, snapshotsParams);


        // Get usernames
        const usersResult = await pool.query(
            'SELECT id, username FROM users WHERE id IN ($1, $2)',
            [userId, friendId]
        );
        const userMap = new Map(usersResult.rows.map(u => [u.id, u.username]));

        // Helper function to calculate activity metrics
        const calculateMetrics = (dailyData: Map<string, number>) => {
            const sortedDates = Array.from(dailyData.keys()).sort();
            let currentStreak = 0;
            let longestStreak = 0;
            let tempStreak = 0;

            // Calculate streaks
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check current streak (working backwards from today)
            let checkDate = new Date(today);
            let foundToday = false;

            for (let i = 0; i < 180; i++) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (dailyData.has(dateStr)) {
                    if (!foundToday) foundToday = true;
                    currentStreak++;
                } else if (foundToday) {
                    break;
                }
                checkDate.setDate(checkDate.getDate() - 1);
            }

            // Calculate longest streak
            let prevDate: Date | null = null;
            for (const dateStr of sortedDates) {
                const currentDate = new Date(dateStr);

                if (prevDate) {
                    const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (dayDiff === 1) {
                        tempStreak++;
                    } else {
                        longestStreak = Math.max(longestStreak, tempStreak);
                        tempStreak = 1;
                    }
                } else {
                    tempStreak = 1;
                }
                prevDate = currentDate;
            }
            longestStreak = Math.max(longestStreak, tempStreak);

            // Calculate active days
            const activeDays = dailyData.size;
            const activeDaysPercentage = (activeDays / 180) * 100;

            // Calculate average gap
            let totalGap = 0;
            let gapCount = 0;
            for (let i = 1; i < sortedDates.length; i++) {
                const prevDate = new Date(sortedDates[i - 1]);
                const currDate = new Date(sortedDates[i]);
                const gap = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                totalGap += gap;
                gapCount++;
            }
            const avgGap = gapCount > 0 ? totalGap / gapCount : 0;

            return {
                current_streak: currentStreak,
                longest_streak: longestStreak,
                active_days: activeDays,
                active_days_percentage: Math.round(activeDaysPercentage * 10) / 10,
                avg_gap_days: Math.round(avgGap * 10) / 10
            };
        };


        // Process data for each user
        const userDailyActivity = new Map<string, number>();
        const friendDailyActivity = new Map<string, number>();

        // Define mock user emails (these get random data, real accounts get actual activity count)
        const mockUserEmails = [
            'alice@example.com',
            'bob@example.com',
            'steve@example.com',
            'william@example.com',
            'joe@example.com',
            'virat@example.com'
        ];

        // Check if users are mock users
        const userEmailResult = await pool.query(
            'SELECT id, email FROM users WHERE id IN ($1, $2)',
            [userId, friendId]
        );
        const emailMap = new Map(userEmailResult.rows.map(u => [u.id, u.email]));

        const isUserMock = mockUserEmails.includes(emailMap.get(userId) || '');
        const isFriendMock = mockUserEmails.includes(emailMap.get(friendId) || '');

        // Create seeded random function for consistent randomness per user
        const createSeededRandom = (seed: number) => {
            let current = seed;
            return () => {
                const x = Math.sin(current++) * 10000;
                return x - Math.floor(x);
            };
        };

        const userRandom = createSeededRandom(userId * 12345);
        const friendRandom = createSeededRandom(friendId * 12345);

        snapshotsResult.rows.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];

            // For mock users: random submissions (1-8). For real users: just mark as active (1)
            const isMock = row.user_id === userId ? isUserMock : isFriendMock;
            const random = row.user_id === userId ? userRandom() : friendRandom();
            const count = isMock ? Math.floor(random * 8) + 1 : 1;

            if (row.user_id === userId) {
                userDailyActivity.set(dateStr, count);
            } else {
                friendDailyActivity.set(dateStr, count);
            }
        });

        // Calculate metrics for both users
        const userMetrics = calculateMetrics(userDailyActivity);
        const friendMetrics = calculateMetrics(friendDailyActivity);

        // Convert daily activity to array format
        const userActivityArray = Array.from(userDailyActivity.entries()).map(([date, count]) => ({
            date,
            count
        }));

        const friendActivityArray = Array.from(friendDailyActivity.entries()).map(([date, count]) => ({
            date,
            count
        }));

        res.json({
            success: true,
            data: {
                you: {
                    username: userMap.get(userId),
                    daily_activity: userActivityArray,
                    ...userMetrics
                },
                friend: {
                    username: userMap.get(friendId),
                    daily_activity: friendActivityArray,
                    ...friendMetrics
                }
            }
        });
    } catch (error: any) {
        console.error('Compare consistency error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

export default router;
