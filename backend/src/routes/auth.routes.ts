import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import pool from '../config/database';
import { SignupCredentials, LoginCredentials, AuthTokenPayload, ApiResponse, User } from '../types';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/profile-pictures/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Signup
router.post('/signup', async (req, res: Response<ApiResponse>) => {
    try {
        const { username, email, password }: SignupCredentials = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username, email, and password are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        // Check if user exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'User with this email or username already exists'
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query<User>(
            'INSERT INTO users (username, email, password_hash, email_verified) VALUES ($1, $2, $3, FALSE) RETURNING id, username, email, email_verified, created_at',
            [username, email, password_hash]
        );

        const user = result.rows[0];

        // Generate JWT
        const secret = (process.env.JWT_SECRET || 'your_jwt_secret') as jwt.Secret;
        // @ts-ignore - TypeScript overload resolution issue with jwt.sign, code is correct
        const token = jwt.sign(
            { userId: user.id, email: user.email, username: user.username || null } as AuthTokenPayload,
            secret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                token
            },
            message: 'User created successfully'
        });
    } catch (error: any) {
        console.error('==================== SIGNUP ERROR ====================');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error:', error);
        console.error('====================================================');
        res.status(500).json({
            success: false,
            error: 'Server error during signup'
        });
    }
});

// Login
router.post('/login', async (req, res: Response<ApiResponse>) => {
    try {
        const { email, password }: LoginCredentials = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Validate email format
        // Validate format (if it looks like an email)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.includes('@') && !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }

        // Find user by email or username
        const result = await pool.query<User>(
            'SELECT * FROM users WHERE email = $1 OR username = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username/email or password'
            });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate JWT
        const secret = (process.env.JWT_SECRET || 'your_jwt_secret') as jwt.Secret;
        // @ts-ignore - TypeScript overload resolution issue with jwt.sign, code is correct
        const token = jwt.sign(
            { userId: user.id, email: user.email, username: user.username || null } as AuthTokenPayload,
            secret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                token
            },
            message: 'Login successful'
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});

// Get current user
// @ts-ignore - Express middleware type conflict
router.get('/me', authenticate, async (req, res: Response<ApiResponse>) => {
    try {
        const authReq = req as AuthRequest;
        const result = await pool.query<User>(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [authReq.user!.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user: result.rows[0] }
        });
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Update username
// @ts-ignore - Express middleware type conflict
router.put('/update-username', authenticate, async (req, res: Response<ApiResponse>) => {
    try {
        const authReq = req as AuthRequest;
        const { username } = req.body;

        // Validation
        if (!username || username.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Username must be at least 3 characters'
            });
        }

        // Check if username is already taken
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1 AND id != $2',
            [username, authReq.user!.userId]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Username is already taken'
            });
        }

        // Update username
        const result = await pool.query<User>(
            'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email, email_verified, created_at',
            [username, authReq.user!.userId]
        );

        res.json({
            success: true,
            data: { user: result.rows[0] },
            message: 'Username updated successfully'
        });
    } catch (error: any) {
        console.error('Update username error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Delete account
// @ts-ignore - Express middleware type conflict
router.delete('/delete-account', authenticate, async (req, res: Response<ApiResponse>) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        // Delete user's data in correct order (respecting foreign key constraints)
        await pool.query('BEGIN');

        try {
            // Delete snapshots (rating history)
            await pool.query('DELETE FROM snapshots WHERE user_id = $1', [userId]);


            // Delete platform handles
            await pool.query('DELETE FROM platform_handles WHERE user_id = $1', [userId]);

            // Delete friend requests (both directions)
            await pool.query('DELETE FROM friend_requests WHERE sender_id = $1 OR receiver_id = $1', [userId]);

            // Delete friendships (both directions)
            await pool.query('DELETE FROM friends WHERE user_id = $1 OR friend_id = $1', [userId]);

            // Finally delete the user
            await pool.query('DELETE FROM users WHERE id = $1', [userId]);

            await pool.query('COMMIT');

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error: any) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete account'
        });
    }
});

// @ts-ignore
router.post('/profile-picture', authenticate, upload.single('profilePicture'), async (req: AuthRequest, res: Response<ApiResponse>) => {
    try {
        const userId = req.user?.userId;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // Generate the URL path for the uploaded file
        const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;

        // Update user's profile picture URL in database
        await pool.query(
            'UPDATE users SET profile_picture_url = $1 WHERE id = $2',
            [profilePictureUrl, userId]
        );

        res.json({
            success: true,
            data: { profile_picture_url: profilePictureUrl }
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload profile picture'
        });
    }
});

export default router;
