"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }
        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || 'your_jwt_secret';
        console.log('AUTH MIDDLEWARE: Verifying token with secret:', secret.substring(0, 10) + '...');
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('========== AUTH MIDDLEWARE ERROR ==========');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Token received:', req.headers.authorization?.substring(7, 50) + '...');
        console.error('==========================================');
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};
exports.authenticate = authenticate;
