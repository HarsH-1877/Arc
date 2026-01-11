"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
// Setup account for OAuth users (set username and optional password)
// @ts-ignore - Express middleware type conflict
router.post('/setup-account', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username, password } = req.body;
        if (!username || username.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Username must be at least 3 characters'
            });
        }
        // Check if username is already taken
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, userId]);
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
            const password_hash = await bcryptjs_1.default.hash(password, 10);
            updateQuery = 'UPDATE users SET username = $1, password_hash = $2 WHERE id = $3 RETURNING id, username, email';
            queryParams = [username, password_hash, userId];
        }
        else {
            updateQuery = 'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email';
            queryParams = [username, userId];
        }
        const result = await database_1.default.query(updateQuery, queryParams);
        res.json({
            success: true,
            data: {
                user: result.rows[0]
            },
            message: 'Account setup complete'
        });
    }
    catch (error) {
        console.error('Setup account error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});
exports.default = router;
