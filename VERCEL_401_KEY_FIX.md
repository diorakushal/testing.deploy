# 🔧 Fix: 401 Invalid API Key Error

## The Problem

You're getting:
```
Failed to load resource: the server responded with a status of 401
AuthApiError: Invalid API key
```

This means:
- ✅ The key is being sent to Supabase
- ❌ Supabase is rejecting it (401 = Unauthorized)

## Root Cause

Your backend uses the **JWT format key** (`eyJ...`) and it works. The `sb_publishable_...` key might be:
1. Wrong/incorrect
2. From a different project
3. Not compatible with your Supabase SDK version

## Solution: Use JWT Format Key

### Step 1: Get the Correct Key from Supabase

1. Go to: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd
2. Click **Settings** → **API**
3. Scroll to **"Project API keys"** section
4. Find the **"anon"** key (starts with `eyJ...`)
5. Copy the FULL key

### Step 2: Update Vercel

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Edit**
4. Replace the value with the JWT format key:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw
   ```
5. **Save**
6. **Redeploy**

### Step 3: Also Add the New Variable Name (Optional)

1. Add a new variable:
   - **Name:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - **Value:** Same JWT key as above
   - **Scope:** All Environments
2. **Save**
3. **Redeploy**

## Why This Works

- Your backend uses this JWT key and it works ✅
- The JWT format is the standard format that all Supabase SDK versions support
- The `sb_publishable_...` format is newer and might have compatibility issues

## After Redeploy

1. Open your site
2. Press **F12** → **Console** tab
3. Look for:
   ```
   [Supabase Config] URL: https://robjixmkmrmryrqzivdd.supabase.co
   [Supabase Config] Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Try logging in again

## If Still Not Working

1. **Verify key in Supabase Dashboard:**
   - Settings → API → Project API keys
   - Make sure the "anon" key matches what you put in Vercel

2. **Check for typos:**
   - No extra spaces
   - No line breaks
   - Full key copied

3. **Check project URL matches:**
   - Must be: `https://robjixmkmrmryrqzivdd.supabase.co`
   - Key must be from the SAME project

---

**Use the JWT format key that your backend uses - it's proven to work!** ✅


