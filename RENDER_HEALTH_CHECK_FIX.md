# 🔧 Fix: Health Check Failing - Port Configuration Issue

## Current Status ✅❌

**Good News:**
- ✅ Build successful
- ✅ Server started: `Server running on port 5000`
- ✅ Application is running and processing tasks

**Problem:**
- ❌ Render's health check is failing
- ❌ Waiting for response at: `block-book-api.onrender.com:10000/health`
- ❌ Deployment stuck in "In Progress"

## Root Cause

Render automatically sets the `PORT` environment variable to `10000` (or another port) for its internal routing. However, you have `PORT=5000` set in your environment variables, which overrides Render's automatic port assignment.

**What's happening:**
1. Render expects your app to listen on port `10000` (or whatever it assigns)
2. Your app is listening on port `5000` (because `PORT=5000` is set)
3. Render's health check tries to reach port `10000` → fails
4. Deployment gets stuck waiting for health check

## Solution

### Option 1: Remove PORT Environment Variable (Recommended)

**Render automatically sets PORT - you don't need to set it manually!**

1. Go to Render dashboard → Your service → **Environment** tab
2. Find the `PORT` environment variable
3. **Delete it** (click the X or edit icon)
4. Save changes
5. Redeploy

**Why this works:**
- Render will automatically set `PORT` to the correct value (usually `10000`)
- Your server code already uses `process.env.PORT || 5000`, so it will use Render's port
- Health checks will work correctly

### Option 2: Keep PORT but Verify Health Check Path

If you need to keep `PORT=5000` for some reason:

1. Make sure **Health Check Path** is set to `/health` (in Advanced settings)
2. Verify your `/health` endpoint is working
3. Note: This might still cause issues with Render's internal routing

**But Option 1 is strongly recommended!**

## Step-by-Step Fix

### Step 1: Remove PORT Variable

1. Go to Render → `block-book-api` → **Environment** tab
2. Find `PORT` in the list
3. Click the **edit/delete icon** (pencil or X)
4. **Delete** the `PORT` variable
5. Click **Save Changes**

### Step 2: Verify Other Settings

While you're there, make sure:
- ✅ `SUPABASE_URL` is set
- ✅ `SUPABASE_ANON_KEY` is set
- ✅ `DATABASE_URL` is set
- ✅ `ALLOWED_ORIGINS` is set
- ✅ `NODE_ENV` = `production`
- ❌ `PORT` should be **removed** (not set)

### Step 3: Redeploy

1. Go to **Manual Deploy** → **Deploy latest commit**
2. Watch the logs
3. You should see:
   ```
   Server running on port 10000  ← Different port now!
   ```
4. Health check should pass
5. Service should become "Live"

## Expected Logs (After Fix)

```
==> Running 'npm start'
> opinion-market-backend@1.0.0 start
> node server.js
Server running on port 10000  ← Render's assigned port
```

Then health check will succeed:
```
==> Health check passed
==> Your service is live at https://block-book-api.onrender.com
```

## Why This Happens

Render's architecture:
- **External URL**: `https://block-book-api.onrender.com` (port 443/80)
- **Internal routing**: Uses port `10000` (or similar) for health checks
- **Your app**: Should listen on `process.env.PORT` (which Render sets automatically)

When you set `PORT=5000` manually:
- Your app listens on port `5000`
- Render's health check looks for port `10000`
- Mismatch → health check fails

## Your Server Code (Already Correct!)

Your `server.js` already handles this correctly:
```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

This means:
- If `PORT` is set (by Render) → use that port ✅
- If `PORT` is not set (local dev) → use 5000 ✅

**So just remove the `PORT` environment variable and let Render set it automatically!**

## Quick Checklist

- [ ] Remove `PORT` environment variable from Render
- [ ] Keep all other 5 environment variables
- [ ] Health Check Path = `/health` (in Advanced settings)
- [ ] Redeploy
- [ ] Verify logs show server running on Render's assigned port
- [ ] Health check should pass

---

**Once you remove the `PORT` variable, Render will automatically assign the correct port and health checks will work!** 🚀


