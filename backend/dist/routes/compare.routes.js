"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get comparison overview data between user and friend
// @ts-ignore - Express middleware type conflict
router.get('/:friendId/overview', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const friendId = parseInt(req.params.friendId);
        const platform = req.query.platform || 'overall'; // overall, codeforces, or leetcode
        // Verify friendship exists
        const friendCheck = await database_1.default.query('SELECT id FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)', [userId, friendId]);
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
        }
        else {
            // Get snapshots from specific platform
            snapshotsQuery = `SELECT user_id, platform, timestamp, rating, total_solved
                              FROM snapshots
                              WHERE user_id IN ($1, $2) AND platform = $3 AND timestamp >= $4
                              ORDER BY timestamp ASC`;
            queryParams = [userId, friendId, platform, ninetyDaysAgo];
        }
        const snapshotsResult = await database_1.default.query(snapshotsQuery, queryParams);
        // Get user info
        const usersResult = await database_1.default.query(`SELECT u.id, u.username, u.email FROM users u WHERE u.id IN ($1, $2)`, [userId, friendId]);
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
        }
        else {
            currentRatingQuery = `SELECT user_id, platform, current_rating
                                   FROM platform_handles
                                   WHERE user_id IN ($1, $2) AND platform = $3 AND current_rating IS NOT NULL`;
            ratingQueryParams = [userId, friendId, platform];
        }
        const ratingsResult = await database_1.default.query(currentRatingQuery, ratingQueryParams);
        // Organize data by user and platform
        const userData = {
            snapshots: [],
            current_ratings: {},
            rating_changes: {},
            problems_solved: 0
        };
        const friendData = {
            snapshots: [],
            current_ratings: {},
            rating_changes: {},
            problems_solved: 0
        };
        // Process current ratings
        ratingsResult.rows.forEach(row => {
            if (row.user_id === userId) {
                userData.current_ratings[row.platform] = row.current_rating;
            }
            else {
                friendData.current_ratings[row.platform] = row.current_rating;
            }
        });
        // Process snapshots
        snapshotsResult.rows.forEach(s => {
            if (s.user_id === userId) {
                userData.snapshots.push(s);
            }
            else {
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
        const latestSnapshotsResult = await database_1.default.query(latestSnapshotsQuery, latestParams);
        // Process latest snapshots for accurate problem counts
        const latestUserData = {};
        const latestFriendData = {};
        latestSnapshotsResult.rows.forEach(row => {
            if (row.user_id === userId) {
                if (platform === 'overall') {
                    latestUserData[row.platform] = row.total_solved || 0;
                }
                else {
                    latestUserData.total = row.total_solved || 0;
                }
            }
            else {
                if (platform === 'overall') {
                    latestFriendData[row.platform] = row.total_solved || 0;
                }
                else {
                    latestFriendData.total = row.total_solved || 0;
                }
            }
        });
        if (platform === 'overall') {
            // Group by platform for rating changes
            ['codeforces', 'leetcode'].forEach(p => {
                const userPlatformSnaps = userData.snapshots.filter((s) => s.platform === p);
                const friendPlatformSnaps = friendData.snapshots.filter((s) => s.platform === p);
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
        }
        else {
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
                    snapshots: userData.snapshots.map((s) => ({
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
                    snapshots: friendData.snapshots.map((s) => ({
                        platform: s.platform,
                        timestamp: s.timestamp,
                        rating: s.rating,
                        total_solved: s.total_solved
                    }))
                }
            }
        });
    }
    catch (error) {
        console.error('Compare overview error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
// Get topic comparison between user and friend
// @ts-ignore - Express middleware type conflict
router.get('/:friendId/topics', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const friendId = parseInt(req.params.friendId);
        // Verify friendship exists
        const friendCheck = await database_1.default.query('SELECT id FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)', [userId, friendId]);
        if (friendCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Not friends with this user'
            });
        }
        // Get latest topic breakdown for both users from ALL platforms
        const topicsResult = await database_1.default.query(`WITH latest_snapshots AS (
                SELECT DISTINCT ON (user_id, platform) user_id, platform, topic_breakdown
                FROM snapshots
                WHERE user_id IN ($1, $2) AND topic_breakdown IS NOT NULL
                ORDER BY user_id, platform, timestamp DESC
            )
            SELECT user_id, platform, topic_breakdown
            FROM latest_snapshots`, [userId, friendId]);
        // Aggregate topics across all platforms for each user
        const userTopicsMap = {};
        const friendTopicsMap = {};
        topicsResult.rows.forEach(row => {
            const topicBreakdown = row.topic_breakdown;
            const targetMap = row.user_id === userId ? userTopicsMap : friendTopicsMap;
            if (topicBreakdown && typeof topicBreakdown === 'object') {
                Object.entries(topicBreakdown).forEach(([topic, count]) => {
                    targetMap[topic] = (targetMap[topic] || 0) + count;
                });
            }
        });
        // Get usernames
        const usersResult = await database_1.default.query('SELECT id, username FROM users WHERE id IN ($1, $2)', [userId, friendId]);
        const userMap = new Map(usersResult.rows.map(u => [u.id, u.username]));
        res.json({
            success: true,
            data: {
                you: {
                    username: userMap.get(userId),
                    topics: Object.entries(userTopicsMap).map(([topic, count]) => ({
                        topic_name: topic,
                        count: count
                    }))
                },
                friend: {
                    username: userMap.get(friendId),
                    topics: Object.entries(friendTopicsMap).map(([topic, count]) => ({
                        topic_name: topic,
                        count: count
                    }))
                }
            }
        });
    }
    catch (error) {
        console.error('Compare topics error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
exports.default = router;
