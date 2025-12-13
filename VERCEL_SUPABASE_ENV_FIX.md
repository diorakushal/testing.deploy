# Fix: Invalid API Key Error on Vercel

## Problem
```
AuthApiError: Invalid API key
```

**Cause:** Supabase environment variables are missing in Vercel.

---

## Quick Fix: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select your frontend project
3. Click **Settings** → **Environment Variables**

### Step 2: Add These 3 Variables

Add each variable with these exact values:

#### Variable 1: `NEXT_PUBLIC_SUPABASE_URL`
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://robjixmkmrmryrqzivdd.supabase.co`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

#### Variable 2: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

#### Variable 3: `NEXT_PUBLIC_API_URL` (if not already set)
- **Key:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://your-backend-service.onrender.com/api`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**
- **Replace with your actual Render backend URL!**

### Step 3: Redeploy
1. After adding all variables, go to **Deployments** tab
2. Click the **3 dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. OR Vercel may auto-redeploy when you save variables

---

## Complete List of Required Vercel Environment Variables

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw

# Backend API (REQUIRED)
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com/api

# Optional: If you have any other NEXT_PUBLIC_* variables
```

---

## Verify It's Working

After redeploying:
1. Go to your Vercel deployment URL
2. Try to log in or sign up
3. Check browser console - should NOT see "Invalid API key" error
4. Should see successful authentication

---

## Troubleshooting

### Still Getting "Invalid API Key"?
1. ✅ Verify variable names are EXACT (case-sensitive):
   - `NEXT_PUBLIC_SUPABASE_URL` (not `NEXT_PUBLIC_SUPABASE_URLS`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)
2. ✅ Verify values are copied exactly (no extra spaces)
3. ✅ Make sure you selected all environments (Production, Preview, Development)
4. ✅ Redeploy after adding variables
5. ✅ Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Variables Not Updating?
- Vercel caches environment variables during build
- You MUST redeploy after adding/updating variables
- Changes only apply to NEW deployments

---

## Quick Checklist

- [ ] Added `NEXT_PUBLIC_SUPABASE_URL` to Vercel
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel
- [ ] Added `NEXT_PUBLIC_API_URL` to Vercel (with your Render backend URL)
- [ ] Selected all environments for each variable
- [ ] Redeployed the application
- [ ] Tested login/signup - no errors

---

## Summary

**The issue:** Vercel doesn't have access to your Supabase credentials.

**The fix:** Add the 3 environment variables above to Vercel and redeploy.

**Time:** ~2 minutes to add variables + redeploy time.

