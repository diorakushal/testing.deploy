# 🔧 Fix: Module Not Found - Root Directory Configuration

## Problem

Even though `npm install` runs successfully, modules aren't found at runtime:
```
Error: Cannot find module 'express-validator'
```

This happens because Render's build and deploy phases handle directories differently.

## Root Cause

When you use `cd backend && npm install` in the build command:
- Build phase: Installs to `backend/node_modules` ✅
- Deploy phase: Runs from a different context, can't find `node_modules` ❌

## Solution: Use Root Directory Properly

### Option 1: Set Root Directory (Recommended)

**In Render Settings:**

1. **Root Directory:** Set to `backend`
2. **Build Command:** Change to `npm install` (remove `cd backend &&`)
3. **Start Command:** Change to `npm start` (remove `cd backend &&`)

**Why this works:**
- Render automatically runs all commands from the Root Directory
- `node_modules` will be in the right place
- No need for `cd` commands

### Option 2: Keep Current Setup + Add Pre-Deploy Command

If Root Directory doesn't work, add a Pre-Deploy Command:

1. **Root Directory:** Leave empty
2. **Build Command:** `cd backend && npm install`
3. **Pre-Deploy Command:** `cd backend && npm install` (install again before start)
4. **Start Command:** `cd backend && npm start`

**Why this works:**
- Pre-Deploy runs before Start Command
- Ensures dependencies are installed in the deploy environment
- `node_modules` will be available when `npm start` runs

## Step-by-Step Fix (Option 1 - Recommended)

### Step 1: Update Render Settings

1. Go to Render → Your service → **Settings**
2. Find **"Root Directory"** field
3. Set it to: `backend`
4. Save

### Step 2: Update Build Command

1. Find **"Build Command"** field
2. Change from: `cd backend && npm install`
3. Change to: `npm install`
4. Save

### Step 3: Update Start Command

1. Find **"Start Command"** field
2. Change from: `cd backend && npm start`
3. Change to: `npm start`
4. Save

### Step 4: Redeploy

1. Go to **Manual Deploy** → **Deploy latest commit**
2. Watch the logs - should work now!

## Step-by-Step Fix (Option 2 - Alternative)

### Step 1: Add Pre-Deploy Command

1. Go to Render → Your service → **Settings** → **Advanced**
2. Find **"Pre-Deploy Command"** field
3. Set it to: `cd backend && npm install`
4. Save

### Step 2: Keep Current Commands

- **Root Directory:** (leave empty)
- **Build Command:** `cd backend && npm install` (keep as is)
- **Start Command:** `cd backend && npm start` (keep as is)

### Step 3: Redeploy

1. Go to **Manual Deploy** → **Deploy latest commit**
2. Watch the logs - dependencies should install before start

## Why This Happens

Render's deployment process:
1. **Build Phase:** Runs build command → Creates build artifact
2. **Deploy Phase:** Extracts artifact → Runs start command

If `node_modules` aren't in the build artifact or the working directory is different, modules won't be found.

## Expected Logs (After Fix)

**With Root Directory:**
```
==> Running build command 'npm install'...
added 186 packages...
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
> node server.js
Server running on port 10000  ← Should work!
```

**With Pre-Deploy Command:**
```
==> Running build command 'cd backend && npm install'...
added 186 packages...
==> Build successful 🎉
==> Deploying...
==> Running pre-deploy command 'cd backend && npm install'...
added 186 packages...
==> Running 'cd backend && npm start'
> node server.js
Server running on port 10000  ← Should work!
```

## Quick Checklist

**Option 1 (Root Directory):**
- [ ] Root Directory = `backend`
- [ ] Build Command = `npm install` (no `cd backend &&`)
- [ ] Start Command = `npm start` (no `cd backend &&`)

**Option 2 (Pre-Deploy):**
- [ ] Root Directory = (empty)
- [ ] Build Command = `cd backend && npm install`
- [ ] Pre-Deploy Command = `cd backend && npm install`
- [ ] Start Command = `cd backend && npm start`

---

**Try Option 1 first (Root Directory) - it's cleaner and more reliable!**


