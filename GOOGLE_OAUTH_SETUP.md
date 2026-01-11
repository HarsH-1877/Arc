# Google OAuth Setup Guide

## Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. Configure the consent screen if prompted:
   - User Type: External
   - App name: Arc - CP Analytics
   - Support email: your email
   - Developer contact: your email
5. Application type: **Web application**
6. Add authorized redirect URIs:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Step 2: Update Backend Environment Variables

Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

## Step 3: Run Database Migration

Run the migration to add Google OAuth support to your database:

```bash
# Option 1: Using psql (if installed)
cd backend
psql -U postgres -d arc_db -f database/migrations/add_google_oauth.sql

# Option 2: Using pgAdmin or any PostgreSQL client
# Open database/migrations/add_google_oauth.sql and execute it
```

## Step 4: Restart Backend Server

```bash
cd backend
npm run dev
```

## Step 5: Test Google OAuth

1. Go to http://localhost:3000/login
2. Click **"Continue with Google"**
3. Sign in with your Google account
4. You should be redirected back to Arc and automatically logged in!

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Google Cloud Console exactly matches: `http://localhost:5000/api/auth/google/callback`

### "OAuth callback error"
- Check backend console for errors
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set correctly

### Database migration fails
- Make sure PostgreSQL is running
- Check that you're connected to the correct database (`arc_db`)

## For Production Deployment

When deploying to production, add these redirect URIs in Google Cloud Console:

```
https://your-domain.com/api/auth/google/callback
```

And update your production `.env`:

```env
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
FRONTEND_URL=https://your-domain.com
```
