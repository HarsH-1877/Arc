import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import passport from './config/passport-config';
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import setupRoutes from './routes/setup.routes';
import handleRoutes from './routes/handles.routes';
import analyticsRoutes from './routes/analytics.routes';
import friendsRoutes from './routes/friends.routes';
import compareRoutes from './routes/compare.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Initialize Passport
app.use(passport.initialize());

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Arc API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes); // OAuth routes (Google)
app.use('/api/auth', setupRoutes); // Account setup routes
app.use('/api/handles', handleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/compare', compareRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Arc API server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
