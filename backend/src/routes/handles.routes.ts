import { Router, Response } from 'express';
import pool from '../config/database';
import { AuthRequest, authenticate } from '../middleware/auth';
import { ApiResponse, PlatformHandle, Platform } from '../types';
import { CodeforcesService } from '../services/platforms/codeforces.service';
import { LeetCodeService } from '../services/platforms/leetcode.service';
import { SnapshotService } from '../services/snapshot.service';
import crypto from 'crypto';

const router = Router();

// Link a platform handle (simplified - no verification required)
// @ts-ignore - Express middleware type conflict
router.post('/link', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const { platform, handle }: { platform: Platform; handle: string } = req.body;
        const userId = req.user!.userId;

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
        const existing = await pool.query(
            'SELECT id FROM platform_handles WHERE user_id = $1 AND platform = $2',
            [userId, platform]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: `You have already linked a ${platform} handle`
            });
        }

        // Verify handle exists on platform and get initial data
        let currentRating: number | null = null;

        if (platform === 'codeforces') {
            const userInfo = await CodeforcesService.getUserInfo(handle);
            if (!userInfo) {
                return res.status(404).json({
                    success: false,
                    error: 'Codeforces handle not found'
                });
            }
            currentRating = userInfo.rating;

            // Insert handle as verified immediately
            await pool.query(
                `INSERT INTO platform_handles (user_id, platform, handle, is_verified, current_rating)
                 VALUES ($1, $2, $3, TRUE, $4)`,
                [userId, platform, handle, currentRating]
            );

            // Backfill historical data in the background
            SnapshotService.backfillCodeforcesHistory(userId, handle).catch(err =>
                console.error('Background backfill error:', err)
            );

        } else if (platform === 'leetcode') {
            const userProfile = await LeetCodeService.getUserProfile(handle);
            if (!userProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'LeetCode username not found'
                });
            }

            const stats = await LeetCodeService.getUserStats(handle);
            currentRating = stats?.ranking || null;

            // Insert handle as verified immediately
            await pool.query(
                `INSERT INTO platform_handles (user_id, platform, handle, is_verified, current_rating)
                 VALUES ($1, $2, $3, TRUE, $4)`,
                [userId, platform, handle, currentRating]
            );

            // Create initial snapshot in the background
            SnapshotService.createLeetCodeSnapshot(userId, handle).catch(err =>
                console.error('Background snapshot error:', err)
            );
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
    } catch (error: any) {
        console.error('Link handle error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Verify handle ownership
// @ts-ignore - Express middleware type conflict
router.post('/verify', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const { platform }: { platform: Platform } = req.body;
        const userId = req.user!.userId;

        if (!platform) {
            return res.status(400).json({
                success: false,
                error: 'Platform is required'
            });
        }

        // Get handle info
        const result = await pool.query<PlatformHandle>(
            'SELECT * FROM platform_handles WHERE user_id = $1 AND platform = $2',
            [userId, platform]
        );

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
            isVerified = await CodeforcesService.verifyBioToken(
                platformHandle.handle,
                platformHandle.verification_token!
            );
        } else if (platform === 'leetcode') {
            isVerified = await LeetCodeService.verifyProfileToken(
                platformHandle.handle,
                platformHandle.verification_token!
            );
        }

        if (!isVerified) {
            return res.status(400).json({
                success: false,
                error: 'Verification token not found in your profile'
            });
        }

        // Mark as verified and fetch current rating
        let currentRating: number | null = null;
        if (platform === 'codeforces') {
            const userInfo = await CodeforcesService.getUserInfo(platformHandle.handle);
            currentRating = userInfo?.rating || null;

            // Backfill historical data
            await SnapshotService.backfillCodeforcesHistory(userId, platformHandle.handle);
        } else if (platform === 'leetcode') {
            const stats = await LeetCodeService.getUserStats(platformHandle.handle);
            currentRating = stats?.ranking || null;

            // Create initial snapshot
            await SnapshotService.createLeetCodeSnapshot(userId, platformHandle.handle);
        }

        await pool.query(
            'UPDATE platform_handles SET is_verified = TRUE, current_rating = $1 WHERE id = $2',
            [currentRating, platformHandle.id]
        );

        res.json({
            success: true,
            data: {
                platform,
                handle: platformHandle.handle,
                current_rating: currentRating
            },
            message: 'Handle verified successfully!'
        });
    } catch (error: any) {
        console.error('Verify handle error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Get my linked handles
// @ts-ignore - Express middleware type conflict
router.get('/me', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.userId;

        const result = await pool.query<PlatformHandle>(
            `SELECT id, platform, handle, is_verified, current_rating, created_at
       FROM platform_handles
       WHERE user_id = $1`,
            [userId]
        );

        res.json({
            success: true,
            data: { handles: result.rows }
        });
    } catch (error: any) {
        console.error('Get handles error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Manual refresh (fetch latest data)
// @ts-ignore - Express middleware type conflict
router.post('/refresh', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const { platform }: { platform: Platform } = req.body;
        const userId = req.user!.userId;

        if (!platform) {
            return res.status(400).json({
                success: false,
                error: 'Platform is required'
            });
        }

        const result = await pool.query<PlatformHandle>(
            'SELECT * FROM platform_handles WHERE user_id = $1 AND platform = $2 AND is_verified = TRUE',
            [userId, platform]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No verified handle found for this platform'
            });
        }

        const handle = result.rows[0];

        // Create new snapshot
        if (platform === 'codeforces') {
            const userInfo = await CodeforcesService.getUserInfo(handle.handle);
            const topicBreakdown = await CodeforcesService.getTopicBreakdown(handle.handle);

            if (userInfo) {
                await SnapshotService.createSnapshot({
                    user_id: userId,
                    platform,
                    rating: userInfo.rating,
                    total_solved: 0,
                    topic_breakdown: topicBreakdown
                });

                await pool.query(
                    'UPDATE platform_handles SET current_rating = $1 WHERE id = $2',
                    [userInfo.rating, handle.id]
                );
            }
        } else if (platform === 'leetcode') {
            const snapshot = await SnapshotService.createLeetCodeSnapshot(userId, handle.handle);
            if (snapshot) {
                await pool.query(
                    'UPDATE platform_handles SET current_rating = $1 WHERE id = $2',
                    [snapshot.rating, handle.id]
                );
            }
        }

        res.json({
            success: true,
            message: 'Data refreshed successfully'
        });
    } catch (error: any) {
        console.error('Refresh handle error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Unlink/delete a platform handle
// @ts-ignore - Express middleware type conflict
router.delete('/unlink/:platform', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const platform = req.params.platform as Platform;
        const userId = req.user!.userId;

        if (platform !== 'codeforces' && platform !== 'leetcode') {
            return res.status(400).json({
                success: false,
                error: 'Platform must be either "codeforces" or "leetcode"'
            });
        }

        // Check if handle exists for this user
        const result = await pool.query(
            'SELECT id FROM platform_handles WHERE user_id = $1 AND platform = $2',
            [userId, platform]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No linked account found for this platform'
            });
        }

        // Delete the handle and all associated snapshots
        await pool.query(
            'DELETE FROM snapshots WHERE user_id = $1 AND platform = $2',
            [userId, platform]
        );

        await pool.query(
            'DELETE FROM platform_handles WHERE user_id = $1 AND platform = $2',
            [userId, platform]
        );

        res.json({
            success: true,
            message: `${platform} account unlinked successfully`
        });
    } catch (error: any) {
        console.error('Unlink handle error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

export default router;
