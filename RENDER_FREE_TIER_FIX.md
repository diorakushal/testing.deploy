# 🔧 Fix: Module Not Found - Free Tier Solution (No Pre-Deploy)

## Problem

- Pre-Deploy Command is **not available on free tier**
- Dependencies install during build but aren't available at runtime
- Error: `Cannot find module 'express-validator'`

## Solution: Don't Use Root Directory

Render's free tier has limitations. Instead of using Root Directory, use full paths in commands.

### Step 1: Remove Root Directory

1. Go to Render → Settings
2. Find **"Root Directory"** field
3. **Clear it** (set to empty)
4. Save

### Step 2: Update Build Command

1. Find **"Build Command"** field
2. Change to: `cd backend && npm install`
3. Save

### Step 3: Update Start Command

1. Find **"Start Command"** field
2. Change to: `cd backend && npm start`
3. Save

### Step 4: Redeploy

1. Go to **Manual Deploy** → **Deploy latest commit**
2. Watch the logs

## Why This Works

When Root Directory is set, Render's build process might not preserve `node_modules` correctly. By using `cd backend &&` in commands, you ensure:
- Build runs from the correct directory
- Dependencies install in the right location
- Start command runs from the same directory
- `node_modules` are accessible

## Alternative: Check Build Artifact

If the above doesn't work, the issue might be that Render isn't including `node_modules` in the build artifact. Try:

### Option A: Modify Build Command

Change Build Command to:
```
cd backend && npm ci --production
```

This uses `npm ci` which is faster and more reliable for CI/CD, and `--production` only installs production dependencies (excludes devDependencies).

### Option B: Ensure package-lock.json is Committed

Make sure `backend/package-lock.json` is committed to git:

```bash
cd backend
git add package-lock.json
git commit -m "Ensure package-lock.json is committed"
git push
```

This ensures Render uses the exact same dependency versions.

## Expected Logs (After Fix)

```
==> Running build command 'cd backend && npm install'...
added 186 packages...
==> Build successful 🎉
==> Deploying...
==> Running 'cd backend && npm start'
> node server.js
Server running on port 10000  ← Should work!
```

## Quick Checklist

- [ ] **Root Directory** = (empty/cleared)
- [ ] **Build Command** = `cd backend && npm install`
- [ ] **Start Command** = `cd backend && npm start`
- [ ] `package-lock.json` is committed to git
- [ ] Redeploy

## If Still Not Working

If modules still aren't found, try:

1. **Check if node_modules is in .gitignore** (it should be, but Render should install it)
2. **Try `npm ci` instead of `npm install`** in build command
3. **Verify package.json is correct** (we already checked - it's fine)
4. **Contact Render support** - this might be a platform issue

---

**Try removing Root Directory first - this is the most likely fix for free tier!**

