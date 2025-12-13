# 🔧 Fix: "Invalid API key" Error on Vercel

## Problem

Your frontend shows:
```
AuthApiError: Invalid API key
```

This means the Supabase API key in Vercel environment variables is either:
- ❌ Missing
- ❌ Incorrect
- ❌ Not set for the right environment

## Solution: Verify Environment Variables in Vercel

### Step 1: Go to Vercel Environment Variables

1. Go to your Vercel dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Check These Variables

Verify these **exact** variable names and values:

#### Variable 1: Supabase URL
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://robjixmkmrmryrqzivdd.supabase.co`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development (check all)

#### Variable 2: Supabase Anon Key
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development (check all)

**Important:** Make sure the value is **exactly** this (no extra spaces, no typos)

### Step 3: Common Issues

**Issue 1: Variable Not Added**
- If you don't see `NEXT_PUBLIC_SUPABASE_ANON_KEY`, add it

**Issue 2: Wrong Value**
- The value must be exactly: `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
- Check for typos or extra spaces

**Issue 3: Wrong Environment**
- Make sure it's enabled for **Production** environment
- Also enable for Preview and Development if you want

**Issue 4: Variable Name Typo**
- Must be exactly: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (case-sensitive)
- Not: `SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_KEY`

### Step 4: Redeploy After Fixing

After updating environment variables:

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger auto-deploy

**Important:** Environment variable changes require a redeploy to take effect!

## Verify Supabase Key is Correct

If you're not sure about the key, get it from Supabase:

1. Go to https://supabase.com/dashboard
2. Select your project: `robjixmkmrmryrqzivdd`
3. Go to **Settings** → **API**
4. Find **"Project API keys"**
5. Copy the **"anon"** or **"public"** key
6. It should start with `sb_publishable_` or `eyJ...`

## Quick Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set to `https://robjixmkmrmryrqzivdd.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set to `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
- [ ] Both variables are enabled for **Production** environment
- [ ] Variable names are exact (case-sensitive, no typos)
- [ ] No extra spaces in values
- [ ] Redeployed after setting variables

## Expected Result

After fixing and redeploying:
- ✅ Login page loads without errors
- ✅ Email OTP sends successfully
- ✅ Authentication works
- ✅ No "Invalid API key" errors

---

**Check your Vercel environment variables and make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly!** 🔑


