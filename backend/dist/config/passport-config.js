"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const database_1 = __importDefault(require("./database"));
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth credentials not configured. Google sign-in will not work.');
}
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const displayName = profile.displayName;
        const profilePicture = profile.photos?.[0]?.value;
        if (!email) {
            return done(new Error('No email provided by Google'), undefined);
        }
        // Check if user exists with this Google ID
        let result = await database_1.default.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
        let user;
        if (result.rows.length > 0) {
            // Existing Google user - update profile picture if changed
            user = result.rows[0];
            if (user.profile_picture !== profilePicture) {
                await database_1.default.query('UPDATE users SET profile_picture = $1 WHERE id = $2', [profilePicture, user.id]);
                user.profile_picture = profilePicture;
            }
        }
        else {
            // Check if user exists with this email (email/password signup)
            result = await database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
            if (result.rows.length > 0) {
                // Link Google account to existing email/password account
                user = result.rows[0];
                await database_1.default.query('UPDATE users SET google_id = $1, email_verified = TRUE, profile_picture = $2 WHERE id = $3', [googleId, profilePicture, user.id]);
                user.google_id = googleId;
                user.email_verified = true;
                user.profile_picture = profilePicture;
            }
            else {
                // Create new user WITHOUT username - they'll set it on setup page
                const insertResult = await database_1.default.query(`INSERT INTO users (email, google_id, email_verified, profile_picture) 
                             VALUES ($1, $2, TRUE, $3) 
                             RETURNING *`, [email, googleId, profilePicture]);
                user = insertResult.rows[0];
            }
        }
        return done(null, user);
    }
    catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, undefined);
    }
}));
// Serialize user for session (not used but required by Passport)
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
// Deserialize user from session (not used but required by Passport)
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const result = await database_1.default.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    }
    catch (error) {
        done(error, null);
    }
});
exports.default = passport_1.default;
