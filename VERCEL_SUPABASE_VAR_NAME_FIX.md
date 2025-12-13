# 🔧 Fix: Supabase Variable Name Mismatch

## The Problem

Supabase's "Connect to your project" UI suggests:
```
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9
```

But your code was looking for:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## The Fix

I've updated `frontend/lib/supabase.ts` to support **both** variable names for compatibility.

## Update Vercel Environment Variables

You have two options:

### Option 1: Add the New Variable (Recommended)
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Click **Add New**
3. Add:
   - **Name:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - **Value:** `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
   - **Scope:** All Environments
4. **Save**
5. **Redeploy**

### Option 2: Rename Existing Variable
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Edit**
4. Change the name to: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
5. Keep the same value: `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
6. **Save**
7. **Redeploy**

## Why This Matters

Supabase's newer setup uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` as the standard name. While the code now supports both, using the recommended name ensures compatibility with future Supabase updates.

## After Redeploy

Check browser console (F12) for:
```
[Supabase Config] URL: https://robjixmkmrmryrqzivdd.supabase.co
[Supabase Config] Key: sb_publishable_Y8B7C3AhTRonpnMNd0...
```

Then try logging in again!

---

**The code now supports both variable names, but use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` as Supabase recommends!** ✅


