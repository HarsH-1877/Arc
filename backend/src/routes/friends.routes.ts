import { Router, Response } from 'express';
import pool from '../config/database';
import { AuthRequest, authenticate } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

// Get all friends
// @ts-ignore - Express middleware type conflict
router.get('/', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.userId;

        const result = await pool.query(
            `SELECT 
                u.id, 
                u.username, 
                u.email,
                f.created_at as friend_since
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = $1
            ORDER BY f.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: { friends: result.rows }
        });
    } catch (error: any) {
        console.error('Get friends error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Search users by username
// @ts-ignore - Express middleware type conflict
router.get('/search', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const { query } = req.query;
        const userId = req.user!.userId;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        const result = await pool.query(
            `SELECT 
                u.id, 
                u.username, 
                u.email,
                CASE 
                    WHEN EXISTS (SELECT 1 FROM friends WHERE (user_id = $1 AND friend_id = u.id) OR (user_id = u.id AND friend_id = $1)) THEN 'friend'
                    WHEN EXISTS (SELECT 1 FROM friend_requests WHERE sender_id = $1 AND receiver_id = u.id AND status = 'pending') THEN 'request_sent'
                    WHEN EXISTS (SELECT 1 FROM friend_requests WHERE sender_id = u.id AND receiver_id = $1 AND status = 'pending') THEN 'request_received'
                    ELSE 'none'
                END as relation_status
            FROM users u
            WHERE u.username ILIKE $2 AND u.id != $1
            LIMIT 10`,
            [userId, `%${query}%`]
        );

        res.json({
            success: true,
            data: { users: result.rows }
        });
    } catch (error: any) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Send friend request
// @ts-ignore - Express middleware type conflict
router.post('/request', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user!.userId;

        if (!receiverId) {
            return res.status(400).json({
                success: false,
                error: 'Receiver ID is required'
            });
        }

        if (senderId === receiverId) {
            return res.status(400).json({
                success: false,
                error: 'Cannot send friend request to yourself'
            });
        }

        // Check if receiver exists
        const userExists = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [receiverId]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if already friends
        const alreadyFriends = await pool.query(
            'SELECT id FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [senderId, receiverId]
        );

        if (alreadyFriends.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Already friends'
            });
        }

        // Check for existing request
        const existingRequest = await pool.query(
            'SELECT id, status FROM friend_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
            [senderId, receiverId]
        );

        if (existingRequest.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Friend request already exists'
            });
        }

        // Create friend request
        await pool.query(
            'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES ($1, $2, $3)',
            [senderId, receiverId, 'pending']
        );

        res.json({
            success: true,
            message: 'Friend request sent'
        });
    } catch (error: any) {
        console.error('Send friend request error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Get pending friend requests (received)
// @ts-ignore - Express middleware type conflict
router.get('/requests/pending', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.userId;

        const result = await pool.query(
            `SELECT 
                fr.id as request_id,
                u.id as sender_id,
                u.username,
                u.email,
                fr.created_at
            FROM friend_requests fr
            JOIN users u ON fr.sender_id = u.id
            WHERE fr.receiver_id = $1 AND fr.status = 'pending'
            ORDER BY fr.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: { requests: result.rows }
        });
    } catch (error: any) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Accept friend request
// @ts-ignore - Express middleware type conflict
router.post('/request/:requestId/accept', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const { requestId } = req.params;
        const userId = req.user!.userId;

        // Get request details
        const requestResult = await pool.query(
            'SELECT sender_id, receiver_id FROM friend_requests WHERE id = $1 AND receiver_id = $2 AND status = $3',
            [requestId, userId, 'pending']
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Friend request not found'
            });
        }

        const { sender_id, receiver_id } = requestResult.rows[0];

        // Create bidirectional friendship
        await pool.query('BEGIN');

        await pool.query(
            'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)',
            [sender_id, receiver_id]
        );

        await pool.query(
            'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)',
            [receiver_id, sender_id]
        );

        // Update request status
        await pool.query(
            'UPDATE friend_requests SET status = $1 WHERE id = $2',
            ['accepted', requestId]
        );

        await pool.query('COMMIT');

        res.json({
            success: true,
            message: 'Friend request accepted'
        });
    } catch (error: any) {
        await pool.query('ROLLBACK');
        console.error('Accept friend request error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Reject friend request
// @ts-ignore - Express middleware type conflict
router.post('/request/:requestId/reject', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const { requestId } = req.params;
        const userId = req.user!.userId;

        const result = await pool.query(
            'UPDATE friend_requests SET status = $1 WHERE id = $2 AND receiver_id = $3 AND status = $4 RETURNING id',
            ['rejected', requestId, userId, 'pending']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Friend request not found'
            });
        }

        res.json({
            success: true,
            message: 'Friend request rejected'
        });
    } catch (error: any) {
        console.error('Reject friend request error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

//Remove friend
// @ts-ignore - Express middleware type conflict
router.delete('/:friendId', authenticate, async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const { friendId } = req.params;
        const userId = req.user!.userId;

        const result = await pool.query(
            'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1) RETURNING id',
            [userId, friendId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Friendship not found'
            });
        }

        res.json({
            success: true,
            message: 'Friend removed'
        });
    } catch (error: any) {
        console.error('Remove friend error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

export default router;
