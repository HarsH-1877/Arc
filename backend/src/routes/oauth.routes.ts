import { Router } from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport-config';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));

// Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed`
    }),
    (req, res) => {
        try {
            const user = req.user as any;
            console.log('========== OAUTH CALLBACK ==========');
            console.log('User object:', user);

            if (!user) {
                console.log('No user found, redirecting to login');
                return res.redirect(`${FRONTEND_URL}/login?error=no_user`);
            }

            // Generate JWT token (same as email/password login)
            const secret = JWT_SECRET as jwt.Secret;
            // @ts-ignore - TypeScript overload resolution issue with jwt.sign, code is correct
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    emailVerified: user.email_verified,
                    username: user.username || null
                },
                secret,
                { expiresIn: JWT_EXPIRES_IN }
            );

            console.log('Generated JWT token for user:', user.email);
            console.log('Token payload includes username:', user.username || null);

            // Check if user is new (created within last 30 seconds)
            const isNewUser = (new Date().getTime() - new Date(user.created_at).getTime()) < 30000;
            const redirectUrl = `${FRONTEND_URL}/auth/callback?token=${token}${!isNewUser ? '&existing=true' : ''}`;

            console.log('Redirecting to:', redirectUrl);
            console.log('====================================');

            // Redirect to frontend with token
            // Additional 'existing' param if user was not just created
            res.redirect(redirectUrl);
        } catch (error: any) {
            console.error('OAuth callback error:', error);
            res.redirect(`${FRONTEND_URL}/login?error=token_generation_failed`);
        }
    }
);

export default router;
