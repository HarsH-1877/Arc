"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
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
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'User with this email or username already exists'
            });
        }
        // Hash password
        const password_hash = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const result = await database_1.default.query('INSERT INTO users (username, email, password_hash, email_verified) VALUES ($1, $2, $3, FALSE) RETURNING id, username, email, email_verified, created_at', [username, email, password_hash]);
        const user = result.rows[0];
        // Generate JWT
        const secret = (process.env.JWT_SECRET || 'your_jwt_secret');
        // @ts-ignore - TypeScript overload resolution issue with jwt.sign, code is correct
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, username: user.username || null }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
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
    }
    catch (error) {
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
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
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
        // Find user by email or username
        const result = await database_1.default.query('SELECT * FROM users WHERE email = $1 OR username = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username/email or password'
            });
        }
        const user = result.rows[0];
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        // Generate JWT
        const secret = (process.env.JWT_SECRET || 'your_jwt_secret');
        // @ts-ignore - TypeScript overload resolution issue with jwt.sign, code is correct
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, username: user.username || null }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});
// Get current user
// @ts-ignore - Express middleware type conflict
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const authReq = req;
        const result = await database_1.default.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [authReq.user.userId]);
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
exports.default = router;
