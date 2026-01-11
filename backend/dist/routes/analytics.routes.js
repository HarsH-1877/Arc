"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Utility function to normalize ratings to 0-100 scale (percentile-based)
const normalizeRating = (rating, platform) => {
    // Typical rating ranges for each platform
    const ranges = {
        codeforces: { min: 800, max: 3500 },
        leetcode: { min: 1000, max: 3000 }
    };
    const range = ranges[platform] || { min: 0, max: 5000 };
    const normalized = ((rating - range.min) / (range.max - range.min)) * 100;
    return Math.max(0, Math.min(100, normalized)); // Clamp between 0-100
};
// Get rating history for a user (for charts)
// @ts-ignore - Express middleware type conflict
router.get('/rating-history', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { platform, mode } = req.query; // mode can be 'friends-avg' or 'friends'
        // Get user's top 4 friends by rating
        let friendsQuery, friendsParams;
        if (platform && platform !== 'overall') {
            // Get top 4 friends by platform-specific rating
            friendsQuery = `
                SELECT DISTINCT
                    CASE 
                        WHEN f.user_id = $1 THEN f.friend_id
                        ELSE f.user_id
                    END as friend_id,
                    u.username as name,
                    ph.current_rating
                 FROM friends f
                 JOIN users u ON (
                    CASE 
                        WHEN f.user_id = $1 THEN f.friend_id
                        ELSE f.user_id
                    END = u.id
                 )
                 LEFT JOIN platform_handles ph ON u.id = ph.user_id AND ph.platform = $2
                 WHERE f.user_id = $1 OR f.friend_id = $1
                 ORDER BY ph.current_rating DESC NULLS LAST
                 LIMIT 4
            `;
            friendsParams = [userId, platform];
        }
        else {
            // Get top 4 friends by average rating across platforms
            friendsQuery = `
                SELECT DISTINCT
                    CASE 
                        WHEN f.user_id = $1 THEN f.friend_id
                        ELSE f.user_id
                    END as friend_id,
                    u.username as name,
                    COALESCE(ROUND(AVG(ph.current_rating)), 0) as avg_rating
                 FROM friends f
                 JOIN users u ON (
                    CASE 
                        WHEN f.user_id = $1 THEN f.friend_id
                        ELSE f.user_id
                    END = u.id
                 )
                 LEFT JOIN platform_handles ph ON u.id = ph.user_id
                 WHERE f.user_id = $1 OR f.friend_id = $1
                 GROUP BY friend_id, u.username
                 ORDER BY avg_rating DESC NULLS LAST
                 LIMIT 4
            `;
            friendsParams = [userId];
        }
        const friendsResult = await database_1.default.query(friendsQuery, friendsParams);
        const friendIds = friendsResult.rows.map(r => r.friend_id);
        const allUserIds = [userId, ...friendIds];
        // Get snapshots for user and friends from last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        let snapshotsQuery;
        let snapshotsParams;
        if (platform && platform !== 'overall') {
            snapshotsQuery = `
                SELECT user_id, platform, timestamp, rating, total_solved
                FROM snapshots
                WHERE user_id = ANY($1) AND platform = $2 AND timestamp >= $3
                ORDER BY timestamp ASC
            `;
            snapshotsParams = [allUserIds, platform, ninetyDaysAgo];
        }
        else {
            snapshotsQuery = `
                SELECT user_id, platform, timestamp, rating, total_solved
                FROM snapshots
                WHERE user_id = ANY($1) AND timestamp >= $2
                ORDER BY timestamp ASC
            `;
            snapshotsParams = [allUserIds, ninetyDaysAgo];
        }
        const snapshotsResult = await database_1.default.query(snapshotsQuery, snapshotsParams);
        // Organize snapshots by user and platform
        const userSnapshots = {};
        snapshotsResult.rows.forEach(snap => {
            if (!userSnapshots[snap.user_id]) {
                userSnapshots[snap.user_id] = {};
            }
            if (!userSnapshots[snap.user_id][snap.platform]) {
                userSnapshots[snap.user_id][snap.platform] = [];
            }
            userSnapshots[snap.user_id][snap.platform].push(snap);
        });
        // Helper function to normalize ratings
        const normalizeRating = (rating, plat) => {
            if (plat === 'codeforces') {
                return Math.min(100, (rating / 3500) * 100);
            }
            else if (plat === 'leetcode') {
                return Math.min(100, (rating / 3500) * 100);
            }
            return 0;
        };
        // Build response based on platform
        let responseData = {};
        if (platform === 'codeforces' || platform === 'leetcode') {
            // Single platform mode
            const userHistory = userSnapshots[userId]?.[platform] || [];
            responseData.history = userHistory.map(snap => ({
                rating: snap.rating,
                snapshot_date: snap.timestamp,
                platform
            }));
            // Friends average
            if (mode === 'friends-avg' || !mode) {
                const friendsAvg = [];
                const historyLength = userHistory.length;
                for (let i = 0; i < historyLength; i++) {
                    let totalRating = 0;
                    let count = 0;
                    friendIds.forEach(friendId => {
                        const friendHistory = userSnapshots[friendId]?.[platform] || [];
                        if (friendHistory[i]) {
                            totalRating += friendHistory[i].rating;
                            count++;
                        }
                    });
                    if (count > 0) {
                        friendsAvg.push({
                            rating: totalRating / count,
                            snapshot_date: userHistory[i].timestamp
                        });
                    }
                }
                responseData.friends_avg = friendsAvg;
            }
            // Individual friends
            if (mode === 'friends') {
                responseData.friends = friendsResult.rows.map(friend => ({
                    id: friend.friend_id,
                    name: friend.name,
                    history: (userSnapshots[friend.friend_id]?.[platform] || []).map(snap => ({
                        rating: snap.rating,
                        snapshot_date: snap.timestamp
                    }))
                }));
            }
        }
        else {
            // Overall mode - combined normalized data
            const userCfHistory = userSnapshots[userId]?.['codeforces'] || [];
            const userLcHistory = userSnapshots[userId]?.['leetcode'] || [];
            // Combine and normalize
            const combinedHistory = [];
            const maxLength = Math.max(userCfHistory.length, userLcHistory.length);
            for (let i = 0; i < maxLength; i++) {
                const cfSnap = userCfHistory[i];
                const lcSnap = userLcHistory[i];
                if (cfSnap || lcSnap) {
                    const cfNorm = cfSnap ? normalizeRating(cfSnap.rating, 'codeforces') : 0;
                    const lcNorm = lcSnap ? normalizeRating(lcSnap.rating, 'leetcode') : 0;
                    const combined = cfSnap && lcSnap ? (cfNorm + lcNorm) / 2 : (cfNorm || lcNorm);
                    combinedHistory.push({
                        rating: combined,
                        snapshot_date: cfSnap?.timestamp || lcSnap?.timestamp
                    });
                }
            }
            responseData.history = combinedHistory;
            // Friends average for overall
            if (mode === 'friends-avg' || !mode) {
                const friendsAvg = [];
                for (let i = 0; i < combinedHistory.length; i++) {
                    let totalRating = 0;
                    let count = 0;
                    friendIds.forEach(friendId => {
                        const friendCf = userSnapshots[friendId]?.['codeforces']?.[i];
                        const friendLc = userSnapshots[friendId]?.['leetcode']?.[i];
                        if (friendCf || friendLc) {
                            const cfNorm = friendCf ? normalizeRating(friendCf.rating, 'codeforces') : 0;
                            const lcNorm = friendLc ? normalizeRating(friendLc.rating, 'leetcode') : 0;
                            const combined = friendCf && friendLc ? (cfNorm + lcNorm) / 2 : (cfNorm || lcNorm);
                            totalRating += combined;
                            count++;
                        }
                    });
                    if (count > 0) {
                        friendsAvg.push({
                            rating: totalRating / count,
                            snapshot_date: combinedHistory[i].snapshot_date
                        });
                    }
                }
                responseData.friends_avg = friendsAvg;
            }
            // Individual friends for overall
            if (mode === 'friends') {
                responseData.friends = friendsResult.rows.map(friend => {
                    const friendCfHistory = userSnapshots[friend.friend_id]?.['codeforces'] || [];
                    const friendLcHistory = userSnapshots[friend.friend_id]?.['leetcode'] || [];
                    const maxLen = Math.max(friendCfHistory.length, friendLcHistory.length);
                    const combinedFriendHistory = [];
                    for (let i = 0; i < maxLen; i++) {
                        const cfSnap = friendCfHistory[i];
                        const lcSnap = friendLcHistory[i];
                        if (cfSnap || lcSnap) {
                            const cfNorm = cfSnap ? normalizeRating(cfSnap.rating, 'codeforces') : 0;
                            const lcNorm = lcSnap ? normalizeRating(lcSnap.rating, 'leetcode') : 0;
                            const combined = cfSnap && lcSnap ? (cfNorm + lcNorm) / 2 : (cfNorm || lcNorm);
                            combinedFriendHistory.push({
                                rating: combined,
                                snapshot_date: cfSnap?.timestamp || lcSnap?.timestamp
                            });
                        }
                    }
                    return {
                        id: friend.friend_id,
                        name: friend.name,
                        history: combinedFriendHistory
                    };
                });
            }
        }
        res.json({
            success: true,
            data: responseData
        });
    }
    catch (error) {
        console.error('Rating history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rating history'
        });
    }
});
// Get topic breakdown (question counts per topic)
// @ts-ignore - Express middleware type conflict
router.get('/topic-breakdown', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
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
        }
        else {
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
        const snapshotsResult = await database_1.default.query(snapshotsQuery, queryParams);
        let allTopics = [];
        // Process topic breakdowns
        for (const row of snapshotsResult.rows) {
            const topicBreakdown = row.topic_breakdown;
            if (topicBreakdown && typeof topicBreakdown === 'object') {
                Object.entries(topicBreakdown).forEach(([topic, count]) => {
                    const existingTopic = allTopics.find(t => t.topic_name === topic);
                    if (existingTopic) {
                        existingTopic.question_count += count;
                    }
                    else {
                        allTopics.push({ topic_name: topic, question_count: count });
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
    }
    catch (error) {
        console.error('Topic breakdown error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch topic breakdown'
        });
    }
});
// Get growth statistics
// @ts-ignore - Express middleware type conflict
router.get('/growth-stats', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { platform } = req.query;
        // Fetch actual ratings from database
        const handlesQuery = platform && platform !== 'overall'
            ? `SELECT platform, current_rating FROM platform_handles WHERE user_id = $1 AND platform = $2 AND is_verified = true`
            : `SELECT platform, current_rating FROM platform_handles WHERE user_id = $1 AND is_verified = true`;
        const params = platform && platform !== 'overall' ? [userId, platform] : [userId];
        const handlesResult = await database_1.default.query(handlesQuery, params);
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
    }
    catch (error) {
        console.error('Growth stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch growth statistics'
        });
    }
});
// Get friends leaderboard
// @ts-ignore - Express middleware type conflict
router.get('/friends-leaderboard', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { platform } = req.query;
        // Get user's friends
        const friendsResult = await database_1.default.query(`SELECT DISTINCT
                CASE 
                    WHEN f.user_id = $1 THEN f.friend_id
                    ELSE f.user_id
                END as friend_id
             FROM friends f
             WHERE f.user_id = $1 OR f.friend_id = $1`, [userId]);
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
        }
        else {
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
        const leaderboardResult = await database_1.default.query(ratingsQuery, queryParams);
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
    }
    catch (error) {
        console.error('Friends leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch friends leaderboard'
        });
    }
});
exports.default = router;
