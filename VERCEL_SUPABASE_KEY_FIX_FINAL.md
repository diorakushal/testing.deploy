# 🔧 Fix: Invalid Supabase API Key Error

## Current Issue
- Error: `AuthApiError: Invalid API key`
- Key format in Vercel: `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
- Backend uses: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT format)

## Step 1: Check Browser Console

After redeploy, open your site and press **F12** → **Console** tab.

Look for these debug logs:
```
[Supabase Config] URL: https://robjixmkmrmryrqzivdd.supabase.co
[Supabase Config] Key: sb_publishable_Y8B7C3AhTRonpnMNd0...
```

**What to check:**
- ✅ If you see `Key: sb_publishable_...` → Key is loaded, but might be wrong
- ❌ If you see `Key: MISSING` → Variable not in build
- ❌ If you see `Key: undefined` → Variable not set

## Step 2: Verify Key in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd
2. Click **Settings** (gear icon) → **API**
3. Look for **"Publishable key"** (anon key)
4. Check if it matches what's in Vercel

**Important:** Supabase shows BOTH formats:
- **Publishable key** (`sb_publishable_...`) - New format
- **anon key** (`eyJ...`) - Legacy JWT format

## Step 3: Try JWT Format Key

If the `sb_publishable_...` key doesn't work, try the JWT format:

### Get JWT Key from Supabase:
1. Supabase Dashboard → Settings → API
2. Scroll to **"Project API keys"**
3. Find **"anon"** key (starts with `eyJ...`)
4. Copy the FULL key

### Update Vercel:
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Edit**
4. Replace with the JWT format key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw`
5. **Save**
6. **Redeploy** (Deployments → ... → Redeploy)

## Step 4: Verify Key Matches Backend

Your backend uses this key (from `backend/update_env_pooler.sh`):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw
```

**Frontend should use the SAME key!**

## Step 5: Common Issues

### Issue 1: Key is Truncated
- Make sure you copy the ENTIRE key
- No spaces before/after
- No line breaks

### Issue 2: Wrong Project
- Verify Supabase URL matches: `https://robjixmkmrmryrqzivdd.supabase.co`
- Key must be from the SAME project

### Issue 3: Key Format Mismatch
- If `sb_publishable_...` doesn't work → Use JWT format
- Some Supabase SDK versions prefer JWT format

## Quick Fix: Use JWT Key

**Update Vercel environment variable:**

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw
```

Then **redeploy**.

---

**Most likely fix:** Use the JWT format key that your backend uses! 🔑


