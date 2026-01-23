# Arc Deployment Guide

This guide walks you through deploying the Arc platform to production.

## Quick Deploy (Recommended)

### 1. Database (Railway)
1. Go to [Railway](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Provision PostgreSQL"
4. Copy the `DATABASE_URL` from the "Connect" tab
5. In the "Data" tab, use the Query tool to run the SQL from `backend/database/schema.sql`

### 2. Backend (Railway)
1. In Railway, click "New" → "GitHub Repo" → Select your Arc repository
2. Select the `backend` folder as root directory
3. Add environment variables (see `.env.production.example`):
   - `DATABASE_URL` (from step 1)
   - `JWT_SECRET` (generate a random string)
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (your existing values)
   - `GOOGLE_CALLBACK_URL` (will be `https://your-service.railway.app/api/auth/google/callback`)
   - `FRONTEND_URL` (will be your Vercel URL)
   - `NODE_ENV=production`
4. Railway will auto-deploy
5. Copy your backend URL

### 3. Frontend (Vercel)
1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure project:
   - Framework: Next.js
   - Root Directory: `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` (your Railway backend URL from step 2)
5. Deploy
6. Copy your Vercel URL

### 4. Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins**:
   - Your Vercel URL
4. Add to **Authorized redirect URIs**:
   - `https://your-backend.railway.app/api/auth/google/callback`

### 5. Update Backend Environment
Go back to Railway backend and update `FRONTEND_URL` with your Vercel URL, then redeploy.

## Verification

Test these endpoints:
- Backend health: `https://your-backend.railway.app/health`
- Frontend: `https://your-app.vercel.app`
- Try signup/login
- Test platform linking

## Troubleshooting

### CORS Issues
Make sure `FRONTEND_URL` in backend matches your Vercel deployment URL exactly (no trailing slash).

### Database Connection Failed
Verify `DATABASE_URL` is correctly set in Railway backend environment variables.

### OAuth Not Working
1. Check Google OAuth callback URL matches in both Google Console and backend env
2. Verify authorized origins include your Vercel domain

## Alternative: Render (Backend)

If you prefer Render over Railway:
1. Create account at [Render](https://render.com)
2. New Web Service → Connect GitHub
3. Select repository, root: `backend`
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Add same environment variables as Railway

## Costs

All services have generous free tiers:
- **Railway**: $5/month credit (hobby projects stay free)
- **Vercel**: Unlimited personal projects
- Total: **$0/month** for your usage level

---

## Local Development Setup

```bash
# Database
psql -U postgres -c "CREATE DATABASE arc_db"
psql -U postgres -d arc_db -f backend/database/schema.sql

# Backend
cd backend
npm install
cp .env.example .env  # Fill in your values
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`
