# Fix: Wrong API Key Type

## Issue Found

✅ **URL is correct:** `https://robjixmkmrmryrqzivdd.supabase.co`
❌ **Key is wrong type:** Using `sb_publishable_...` instead of JWT token

The `sb_publishable_...` key doesn't work for authentication. You need the **anon public JWT token**.

---

## Fix: Update to Correct Key

### Step 1: Get the Correct Key from Supabase

1. Go to: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd/settings/api
2. Scroll to **"Project API keys"** section
3. Find the **"anon public"** key
4. It should look like:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw
   ```
5. Click **"Reveal"** or **"Copy"** to get the full key
6. **Copy the ENTIRE key** (it's a very long string)

### Step 2: Update Vercel Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click to edit it
4. **Replace** the value with the full JWT token from Step 1
5. Make sure it's the **full key** (starts with `eyJ` and is very long)
6. Click **Save**

**OR** if you don't have `NEXT_PUBLIC_SUPABASE_ANON_KEY` set:
- Update `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` with the JWT token instead
- But better to use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for clarity

### Step 3: Redeploy

1. Go to Vercel → Deployments
2. Click **Redeploy** on latest deployment
3. Wait for deployment to complete

---

## Key Types Explained

### ❌ `sb_publishable_...` Key
- Format: `sb_publishable_XXXXXXXXX`
- Used for: Some Supabase integrations
- **Does NOT work for authentication**

### ✅ `anon public` JWT Key
- Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long)
- Used for: **Authentication, database queries, API calls**
- **This is what you need!**

---

## Verify After Fix

After redeploying, check browser console again:

**Should see:**
```
[Supabase Config] URL: https://robjixmkmrmryrqzivdd.supabase.co
[Supabase Config] Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The key should now start with `eyJ` (JWT token format), not `sb_`.

---

## Quick Checklist

- [ ] Go to Supabase dashboard → API settings
- [ ] Copy the **"anon public"** key (JWT token)
- [ ] Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel with JWT token
- [ ] Verify it starts with `eyJ` (not `sb_`)
- [ ] Redeploy Vercel
- [ ] Test login/signup
- [ ] Check console - should show JWT token now

---

## Summary

**The Problem:** Using `sb_publishable_...` key which doesn't work for auth.

**The Fix:** Replace with `anon public` JWT token (`eyJ...`).

**Time:** ~2 minutes to update variable + redeploy time.

