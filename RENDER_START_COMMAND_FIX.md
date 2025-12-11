# 🔧 Fix: "Application exited early" - Start Command Issue

## Problem

Your deployment logs show:
```
==> Deploying...
==> Running 'npm install'  ← WRONG! Should be 'npm start'
==> Application exited early
```

**Render is running `npm install` instead of `npm start`!**

## Root Cause

The **Start Command** in Render is either:
1. Not set correctly
2. Set to `npm install` (wrong)
3. Empty or missing

## Solution

### Step 1: Check Start Command in Render

1. Go to your Render dashboard
2. Click on your service: `block-book-api`
3. Go to **Settings** tab (or scroll to the service configuration)
4. Find **"Start Command"** field
5. **It should be:** `npm start`
6. **It should NOT be:**
   - `npm install` ❌
   - `yarn start` ❌
   - `$ yarn start` ❌
   - Empty ❌

### Step 2: Fix Start Command

If the Start Command is wrong:

1. Click in the **"Start Command"** field
2. **Delete** whatever is there
3. Type exactly: `npm start`
4. **Do NOT include:**
   - `$` prefix
   - `yarn` (use `npm` instead)
   - Any other commands

### Step 3: Verify Build Command

While you're there, also check **Build Command**:

1. Find **"Build Command"** field
2. It should be: `npm install`
3. If it's wrong, fix it to: `npm install`

### Step 4: Verify Root Directory

Also check **Root Directory**:

1. Find **"Root Directory"** field
2. It should be: `backend`
3. This tells Render where your `package.json` is located

### Step 5: Save and Redeploy

1. Click **"Save Changes"** (or the save button)
2. Go to **Manual Deploy** → **Deploy latest commit**
3. Watch the logs - you should now see:
   ```
   ==> Running 'npm start'
   > opinion-market-backend@1.0.0 start
   > node server.js
   Server running on port 5000
   ```

## Expected Logs (Correct)

When Start Command is correct, you'll see:
```
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'  ← CORRECT!
> opinion-market-backend@1.0.0 start
> node server.js
Server running on port 5000
```

## Current Logs (Wrong)

What you're seeing now:
```
==> Build successful 🎉
==> Deploying...
==> Running 'npm install'  ← WRONG!
==> Application exited early
```

## Quick Checklist

Before redeploying, verify:

- [ ] **Root Directory** = `backend`
- [ ] **Build Command** = `npm install`
- [ ] **Start Command** = `npm start` (NOT `npm install` or `yarn start`)
- [ ] All 6 environment variables are set
- [ ] No `$` prefix in commands
- [ ] Using `npm` not `yarn`

## Why This Happens

Render might default to `npm install` if:
- Start Command is empty
- Start Command has a typo
- Service was created with wrong defaults
- Configuration wasn't saved properly

## Alternative: Check via Render API/CLI

If you can't find the Start Command in the UI:

1. Check the service settings page
2. Look for "Runtime" or "Commands" section
3. The Start Command should be visible there

---

**Once Start Command is set to `npm start`, your service will start correctly!** 🚀

