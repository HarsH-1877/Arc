import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './database';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth credentials not configured. Google sign-in will not work.');
}

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const googleId = profile.id;
                const displayName = profile.displayName;
                const profilePicture = profile.photos?.[0]?.value;

                if (!email) {
                    return done(new Error('No email provided by Google'), undefined);
                }

                // Check if user exists with this Google ID
                let result = await pool.query(
                    'SELECT * FROM users WHERE google_id = $1',
                    [googleId]
                );

                let user;

                if (result.rows.length > 0) {
                    // Existing Google user - update profile picture if changed
                    user = result.rows[0];
                    if (user.profile_picture !== profilePicture) {
                        await pool.query(
                            'UPDATE users SET profile_picture = $1 WHERE id = $2',
                            [profilePicture, user.id]
                        );
                        user.profile_picture = profilePicture;
                    }
                } else {
                    // Check if user exists with this email (email/password signup)
                    result = await pool.query(
                        'SELECT * FROM users WHERE email = $1',
                        [email]
                    );

                    if (result.rows.length > 0) {
                        // Link Google account to existing email/password account
                        user = result.rows[0];
                        await pool.query(
                            'UPDATE users SET google_id = $1, email_verified = TRUE, profile_picture = $2 WHERE id = $3',
                            [googleId, profilePicture, user.id]
                        );
                        user.google_id = googleId;
                        user.email_verified = true;
                        user.profile_picture = profilePicture;
                    } else {
                        // Create new user WITHOUT username - they'll set it on setup page
                        const insertResult = await pool.query(
                            `INSERT INTO users (email, google_id, email_verified, profile_picture) 
                             VALUES ($1, $2, TRUE, $3) 
                             RETURNING *`,
                            [email, googleId, profilePicture]
                        );
                        user = insertResult.rows[0];
                    }
                }

                return done(null, user);
            } catch (error: any) {
                console.error('Google OAuth error:', error);
                return done(error, undefined);
            }
        }
    )
);

// Serialize user for session (not used but required by Passport)
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

// Deserialize user from session (not used but required by Passport)
passport.deserializeUser(async (id: number, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
