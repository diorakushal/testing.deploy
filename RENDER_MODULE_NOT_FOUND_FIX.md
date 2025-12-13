# 🔧 Fix: "Cannot find module 'express-validator'" Error

## Problem

Your deployment shows:
```
Error: Cannot find module 'express-validator'
Require stack:
- /opt/render/project/src/backend/server.js
```

**The module exists in package.json, but Node.js can't find it at runtime.**

## Root Cause

Render is running `npm install` during the deploy phase, but it might be:
1. Running from the wrong directory (root instead of `backend`)
2. Not preserving `node_modules` from build phase
3. Installing dependencies in a different location than where `npm start` runs

## Solution

### Step 1: Verify Root Directory Setting

1. Go to Render dashboard → Your service → **Settings**
2. Check **"Root Directory"** field
3. It should be exactly: `backend`
4. If it's empty or wrong, update it to: `backend`

### Step 2: Verify Build Command

1. In the same Settings page, check **"Build Command"**
2. It should be: `npm install`
3. If it's wrong, update it to: `npm install`

### Step 3: Verify Start Command

1. Check **"Start Command"**
2. It should be: `npm start`
3. Make sure it's NOT: `cd backend && npm start` (if Root Directory is set)

### Step 4: Reinstall Dependencies Locally (Optional)

If the issue persists, try regenerating package-lock.json:

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Regenerate package-lock.json"
git push
```

### Step 5: Alternative - Use Full Path in Build Command

If Root Directory isn't working, try:

**Build Command:**
```
cd backend && npm install
```

**Start Command:**
```
cd backend && npm start
```

**Root Directory:** (leave empty)

## Why This Happens

Render's deployment process:
1. **Build Phase**: Runs build command → installs dependencies
2. **Deploy Phase**: Runs `npm install` again → then runs start command

If Root Directory isn't set correctly, the deploy phase `npm install` might run from the wrong directory, and `node_modules` won't be in the right place.

## Quick Checklist

- [ ] **Root Directory** = `backend` (in Settings)
- [ ] **Build Command** = `npm install` (not `cd backend && npm install` if Root Directory is set)
- [ ] **Start Command** = `npm start` (not `cd backend && npm start` if Root Directory is set)
- [ ] `package.json` exists in `backend/` folder
- [ ] `express-validator` is in `package.json` dependencies

## Expected Logs (After Fix)

```
==> Running build command 'npm install'...
added 186 packages...
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
> opinion-market-backend@1.0.0 start
> node server.js
Server running on port 10000  ← Should work now!
```

---

**Most likely fix: Verify Root Directory is set to `backend` in Render settings!**


