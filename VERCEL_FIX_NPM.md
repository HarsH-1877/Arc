# Fix Vercel npm Install Error

## The Problem
Error: `Command "cd frontend && npm install" exited with 1`

This error means Vercel is trying to run `cd frontend && npm install` which is **WRONG** because Root Directory is already set to `frontend`.

## SOLUTION: Fix Vercel Project Settings

### Step 1: Check Root Directory Setting
1. Go to Vercel Project → **Settings** → **General**
2. Find **"Root Directory"** 
3. It should be set to: `frontend`
4. If not, click Edit and set it to `frontend`, then Save

### Step 2: Fix Install Command
1. Still in Settings → Go to **"Build & Development Settings"**
2. Find **"Install Command"**
3. Click **"Override"** 
4. Clear any existing command
5. Enter: `npm install`
6. Click **Save**

### Step 3: Verify Build Command
1. In the same section, find **"Build Command"**
2. Click **"Override"** if not already
3. Enter: `npm run build`
4. Click **Save**

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Click "..." menu on the latest failed deployment
3. Click **"Redeploy"**
4. Wait for build to complete

## Alternative: Use Vercel CLI (Easier!)

If the above is confusing, you can deploy via CLI:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Go to frontend directory
cd E:/Projects/Arc/frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project: Yes
# - Which scope: Your account
# - Link to HarsH-1877/Arc: Yes
# - Override settings: No

# For production deployment
vercel --prod
```

This will automatically detect the correct settings!

## What We Fixed
- Added `.nvmrc` file to specify Node 20
- This ensures Vercel uses the correct Node version

## Expected Outcome
After redeploying, you should see:
```
✓ Installing dependencies...
✓ Building...
✓ Deployment ready
```

Then your site will be live!
