import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import { ApiResponse } from '../types';

const router = Router();

// Setup account for OAuth users (set username and optional password)
// @ts-ignore - Express middleware type conflict
router.post('/setup-account', authenticate, async (req, res: Response<ApiResponse>) => {
    try {
        const userId = (req as AuthRequest).user!.userId;
        const { username, password } = req.body;

        if (!username || username.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Username must be at least 3 characters'
            });
        }

        // Check if username is already taken
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND id != $2',
            [username, userId]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Username already taken'
            });
        }

        // Update username and optionally password
        let updateQuery;
        let queryParams;

        if (password && password.length >= 6) {
            // Hash the password
            const password_hash = await bcrypt.hash(password, 10);
            updateQuery = 'UPDATE users SET username = $1, password_hash = $2 WHERE id = $3 RETURNING id, username, email';
            queryParams = [username, password_hash, userId];
        } else {
            updateQuery = 'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email';
            queryParams = [username, userId];
        }

        const result = await pool.query(updateQuery, queryParams);

        res.json({
            success: true,
            data: {
                user: result.rows[0]
            },
            message: 'Account setup complete'
        });
    } catch (error: any) {
        console.error('Setup account error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

export default router;
