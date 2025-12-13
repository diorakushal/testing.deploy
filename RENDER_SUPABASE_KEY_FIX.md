# 🔧 Fix: Backend "Invalid API key" Error

## The Problem

Backend is getting this error when fetching payment requests:
```
Error fetching payment requests: {
  message: 'Invalid API key',
  hint: 'Double check the provided API key for typos. This API key might also be owned by another Supabase project.'
}
```

## Root Cause

The backend's `SUPABASE_ANON_KEY` in Render might be:
1. ❌ Not set
2. ❌ Wrong/incorrect key
3. ❌ From a different Supabase project
4. ❌ Truncated or has extra spaces

## The Fix

### Step 1: Get the Correct Key from Supabase

1. Go to: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd
2. Click **Settings** → **API**
3. Scroll to **"Project API keys"** section
4. Find the **"anon"** key (starts with `eyJ...`)
5. Copy the FULL key

### Step 2: Update Render Environment Variable

1. Go to Render Dashboard → Your Backend Service → Environment
2. Find `SUPABASE_ANON_KEY`
3. Click **Edit**
4. Replace with the JWT format key:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw
   ```
5. **Save**

### Step 3: Verify All Supabase Variables

Make sure these are set correctly in Render:
- ✅ `SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co`
- ✅ `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full JWT key)

### Step 4: Redeploy

After updating the environment variable:
1. Render will auto-redeploy, OR
2. Manually trigger a redeploy: Render Dashboard → Your Service → Manual Deploy

## Verify It's Working

After redeploy, check Render logs. You should see:
- ✅ No more "Invalid API key" errors
- ✅ Payment requests fetching successfully
- ✅ Authentication working

## Why This Happens

The backend uses Supabase client to:
1. Verify authentication tokens (`supabase.auth.getUser(token)`)
2. Query payment requests (`supabase.from('payment_requests')`)

If the `SUPABASE_ANON_KEY` is wrong, both will fail.

---

**Update `SUPABASE_ANON_KEY` in Render with the correct JWT format key!** 🔑

