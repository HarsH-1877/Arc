"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const codeforces_service_1 = require("../services/platforms/codeforces.service");
const leetcode_service_1 = require("../services/platforms/leetcode.service");
const snapshot_service_1 = require("../services/snapshot.service");
const router = (0, express_1.Router)();
// Link a platform handle (simplified - no verification required)
// @ts-ignore - Express middleware type conflict
router.post('/link', auth_1.authenticate, async (req, res) => {
    try {
        const { platform, handle } = req.body;
        const userId = req.user.userId;
        if (!platform || !handle) {
            return res.status(400).json({
                success: false,
                error: 'Platform and handle are required'
            });
        }
        if (platform !== 'codeforces' && platform !== 'leetcode') {
            return res.status(400).json({
                success: false,
                error: 'Platform must be either "codeforces" or "leetcode"'
            });
        }
        // Check if handle already exists for this user
        const existing = await database_1.default.query('SELECT id FROM platform_handles WHERE user_id = $1 AND platform = $2', [userId, platform]);
        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: `You have already linked a ${platform} handle`
            });
        }
        // Verify handle exists on platform and get initial data
        let currentRating = null;
        if (platform === 'codeforces') {
            const userInfo = await codeforces_service_1.CodeforcesService.getUserInfo(handle);
            if (!userInfo) {
                return res.status(404).json({
                    success: false,
                    error: 'Codeforces handle not found'
                });
            }
            currentRating = userInfo.rating;
            // Insert handle as verified immediately
            await database_1.default.query(`INSERT INTO platform_handles (user_id, platform, handle, is_verified, current_rating)
                 VALUES ($1, $2, $3, TRUE, $4)`, [userId, platform, handle, currentRating]);
            // Backfill historical data in the background
            snapshot_service_1.SnapshotService.backfillCodeforcesHistory(userId, handle).catch(err => console.error('Background backfill error:', err));
        }
        else if (platform === 'leetcode') {
            const userProfile = await leetcode_service_1.LeetCodeService.getUserProfile(handle);
            if (!userProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'LeetCode username not found'
                });
            }
            const stats = await leetcode_service_1.LeetCodeService.getUserStats(handle);
            currentRating = stats?.ranking || null;
            // Insert handle as verified immediately
            await database_1.default.query(`INSERT INTO platform_handles (user_id, platform, handle, is_verified, current_rating)
                 VALUES ($1, $2, $3, TRUE, $4)`, [userId, platform, handle, currentRating]);
            // Create initial snapshot in the background
            snapshot_service_1.SnapshotService.createLeetCodeSnapshot(userId, handle).catch(err => console.error('Background snapshot error:', err));
        }
        res.json({
            success: true,
            data: {
                platform,
                handle,
                current_rating: currentRating,
                is_verified: true
            },
            message: 'Handle linked successfully!'
        });
    }
    catch (error) {
        console.error('Link handle error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
// Verify handle ownership
// @ts-ignore - Express middleware type conflict
router.post('/verify', auth_1.authenticate, async (req, res) => {
    try {
        const { platform } = req.body;
        const userId = req.user.userId;
        if (!platform) {
            return res.status(400).json({
                success: false,
                error: 'Platform is required'
            });
        }
        // Get handle info
        const result = await database_1.default.query('SELECT * FROM platform_handles WHERE user_id = $1 AND platform = $2', [userId, platform]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No handle found for this platform'
            });
        }
        const platformHandle = result.rows[0];
        if (platformHandle.is_verified) {
            return res.status(400).json({
                success: false,
                error: 'Handle already verified'
            });
        }
        // Verify token
        let isVerified = false;
        if (platform === 'codeforces') {
            isVerified = await codeforces_service_1.CodeforcesService.verifyBioToken(platformHandle.handle, platformHandle.verification_token);
        }
        else if (platform === 'leetcode') {
            isVerified = await leetcode_service_1.LeetCodeService.verifyProfileToken(platformHandle.handle, platformHandle.verification_token);
        }
        if (!isVerified) {
            return res.status(400).json({
                success: false,
                error: 'Verification token not found in your profile'
            });
        }
        // Mark as verified and fetch current rating
        let currentRating = null;
        if (platform === 'codeforces') {
            const userInfo = await codeforces_service_1.CodeforcesService.getUserInfo(platformHandle.handle);
            currentRating = userInfo?.rating || null;
            // Backfill historical data
            await snapshot_service_1.SnapshotService.backfillCodeforcesHistory(userId, platformHandle.handle);
        }
        else if (platform === 'leetcode') {
            const stats = await leetcode_service_1.LeetCodeService.getUserStats(platformHandle.handle);
            currentRating = stats?.ranking || null;
            // Create initial snapshot
            await snapshot_service_1.SnapshotService.createLeetCodeSnapshot(userId, platformHandle.handle);
        }
        await database_1.default.query('UPDATE platform_handles SET is_verified = TRUE, current_rating = $1 WHERE id = $2', [currentRating, platformHandle.id]);
        res.json({
            success: true,
            data: {
                platform,
                handle: platformHandle.handle,
                current_rating: currentRating
            },
            message: 'Handle verified successfully!'
        });
    }
    catch (error) {
        console.error('Verify handle error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
// Get my linked handles
// @ts-ignore - Express middleware type conflict
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await database_1.default.query(`SELECT id, platform, handle, is_verified, current_rating, created_at
       FROM platform_handles
       WHERE user_id = $1`, [userId]);
        res.json({
            success: true,
            data: { handles: result.rows }
        });
    }
    catch (error) {
        console.error('Get handles error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
// Manual refresh (fetch latest data)
// @ts-ignore - Express middleware type conflict
router.post('/refresh', auth_1.authenticate, async (req, res) => {
    try {
        const { platform } = req.body;
        const userId = req.user.userId;
        if (!platform) {
            return res.status(400).json({
                success: false,
                error: 'Platform is required'
            });
        }
        const result = await database_1.default.query('SELECT * FROM platform_handles WHERE user_id = $1 AND platform = $2 AND is_verified = TRUE', [userId, platform]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No verified handle found for this platform'
            });
        }
        const handle = result.rows[0];
        // Check cooldown - 5 minutes (300 seconds)
        const COOLDOWN_SECONDS = 300;
        const lastRefreshResult = await database_1.default.query('SELECT timestamp FROM snapshots WHERE user_id = $1 AND platform = $2 ORDER BY timestamp DESC LIMIT 1', [userId, platform]);
        if (lastRefreshResult.rows.length > 0) {
            const lastRefresh = new Date(lastRefreshResult.rows[0].timestamp);
            const now = new Date();
            const secondsSinceRefresh = (now.getTime() - lastRefresh.getTime()) / 1000;
            if (secondsSinceRefresh < COOLDOWN_SECONDS) {
                const remainingSeconds = Math.ceil(COOLDOWN_SECONDS - secondsSinceRefresh);
                return res.status(429).json({
                    success: false,
                    error: `Please wait ${Math.ceil(remainingSeconds / 60)} minute(s) before refreshing again`
                });
            }
        }
        // Create new snapshot
        if (platform === 'codeforces') {
            const userInfo = await codeforces_service_1.CodeforcesService.getUserInfo(handle.handle);
            const topicBreakdown = await codeforces_service_1.CodeforcesService.getTopicBreakdown(handle.handle);
            if (userInfo) {
                await snapshot_service_1.SnapshotService.createSnapshot({
                    user_id: userId,
                    platform,
                    rating: userInfo.rating,
                    total_solved: 0,
                    topic_breakdown: topicBreakdown
                });
                await database_1.default.query('UPDATE platform_handles SET current_rating = $1 WHERE id = $2', [userInfo.rating, handle.id]);
            }
        }
        else if (platform === 'leetcode') {
            const snapshot = await snapshot_service_1.SnapshotService.createLeetCodeSnapshot(userId, handle.handle);
            if (snapshot) {
                await database_1.default.query('UPDATE platform_handles SET current_rating = $1 WHERE id = $2', [snapshot.rating, handle.id]);
            }
        }
        res.json({
            success: true,
            message: 'Data refreshed successfully'
        });
    }
    catch (error) {
        console.error('Refresh handle error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
// Unlink/delete a platform handle
// @ts-ignore - Express middleware type conflict
router.delete('/unlink/:platform', auth_1.authenticate, async (req, res) => {
    try {
        const platform = req.params.platform;
        const userId = req.user.userId;
        if (platform !== 'codeforces' && platform !== 'leetcode') {
            return res.status(400).json({
                success: false,
                error: 'Platform must be either "codeforces" or "leetcode"'
            });
        }
        // Check if handle exists for this user
        const result = await database_1.default.query('SELECT id FROM platform_handles WHERE user_id = $1 AND platform = $2', [userId, platform]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No linked account found for this platform'
            });
        }
        // Delete the handle and all associated snapshots
        await database_1.default.query('DELETE FROM snapshots WHERE user_id = $1 AND platform = $2', [userId, platform]);
        await database_1.default.query('DELETE FROM platform_handles WHERE user_id = $1 AND platform = $2', [userId, platform]);
        res.json({
            success: true,
            message: `${platform} account unlinked successfully`
        });
    }
    catch (error) {
        console.error('Unlink handle error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
exports.default = router;
