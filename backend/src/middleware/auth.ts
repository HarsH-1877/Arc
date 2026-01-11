import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../types';

export interface AuthRequest extends Request {
    user?: AuthTokenPayload;
}

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
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

        const decoded = jwt.verify(token, secret) as AuthTokenPayload;
        req.user = decoded;

        next();
    } catch (error: any) {
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
