# 🔄 Fix: Environment Variable Not Working - Redeploy Required

## Problem

You've added the environment variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel, but you're still getting:
```
AuthApiError: Invalid API key
```

## Root Cause

**Environment variables require a redeploy to take effect!**

When you add or update environment variables in Vercel:
- ✅ The variable is saved
- ❌ **Existing deployments don't automatically use the new variable**
- ✅ **You must redeploy** for the variable to be available

## Solution: Redeploy Your Project

### Option 1: Manual Redeploy (Recommended)

1. Go to Vercel Dashboard → Your Project
2. Go to **Deployments** tab
3. Find the latest deployment
4. Click the **"..."** (three dots) menu
5. Click **"Redeploy"**
6. Confirm the redeploy

### Option 2: Trigger New Deployment

1. Make a small change to your code (add a comment, etc.)
2. Commit and push to GitHub
3. Vercel will auto-deploy with the new environment variables

### Option 3: Force Redeploy from Settings

1. Go to **Settings** → **Environment Variables**
2. After adding/updating variables, Vercel might show a "Redeploy" button
3. Click it to redeploy immediately

## Verify After Redeploy

After redeploying:

1. Wait for deployment to complete (2-3 minutes)
2. Visit your site
3. Try logging in again
4. The "Invalid API key" error should be gone

## Why This Happens

Vercel builds your app at deployment time:
- Environment variables are **baked into the build**
- If you add a variable after deployment, the old build still has the old (missing) values
- A new build is needed to include the new variables

## Quick Checklist

- [ ] Environment variable is added in Vercel ✅ (you've done this)
- [ ] Variable name is correct: `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- [ ] Variable value is correct: `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9` ✅
- [ ] **Redeployed after adding the variable** ⚠️ (do this now!)

---

**Redeploy your project in Vercel to apply the environment variable changes!** 🔄


