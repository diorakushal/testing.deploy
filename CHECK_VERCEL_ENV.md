# Verify Vercel Environment Variable Was Updated

## Issue: Still Showing Old Key

The console still shows:
```
[Supabase Config] Key: sb_publishable_Y8B7C3AhTRonpnM...
```

This means the environment variable hasn't been updated yet OR the deployment hasn't picked it up.

---

## Step 1: Verify Variable is Updated in Vercel

**IMPORTANT:** Did you actually update the variable in Vercel's dashboard?

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click on it to view/edit
6. **Check the value** - does it show:
   - ❌ `sb_publishable_Y8B7C3AhTRonpnM...` (old, wrong)
   - ✅ `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (new, correct JWT)

**If it still shows the old `sb_publishable_` value:**
- You need to update it manually in Vercel dashboard
- Replace with the JWT token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw`
- Click **Save**
- Then redeploy

---

## Step 2: Clear Browser Cache

Even if the variable is updated, your browser might be caching the old build:

1. **Hard refresh:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
2. **Or clear cache:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Clear cache for the last hour

---

## Step 3: Check Deployment Status

1. Go to Vercel → Deployments
2. Check if the latest deployment is **complete** (green checkmark)
3. Make sure it was deployed **AFTER** you updated the environment variable
4. If deployment is still in progress, wait for it to finish

---

## Step 4: Force New Deployment After Updating Variable

**After updating the environment variable in Vercel:**

1. Go to **Deployments** tab
2. Click the **3 dots (⋯)** on the latest deployment
3. Click **Redeploy**
4. Wait for it to complete

**OR** push another commit:
```bash
git commit --allow-empty -m "Redeploy after env var update"
git push
```

---

## Quick Checklist

- [ ] Verified `NEXT_PUBLIC_SUPABASE_ANON_KEY` value in Vercel dashboard
- [ ] Value shows JWT token (`eyJ...`) not `sb_publishable_...`
- [ ] Updated variable if it was wrong
- [ ] Saved the variable
- [ ] Cleared browser cache / hard refresh
- [ ] Redeployed after updating variable
- [ ] Waited for deployment to complete
- [ ] Checked console again - should show JWT token now

---

## If Still Not Working

1. **Double-check variable name:**
   - Must be exactly: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Case-sensitive!
   - No typos

2. **Check all environments:**
   - Make sure variable is set for **All Environments** (Production, Preview, Development)
   - Or at least for the environment you're testing (Production)

3. **Verify full JWT token:**
   - Copy the ENTIRE token from Render
   - Make sure no spaces before/after
   - Should be one continuous string

4. **Clear Vercel build cache:**
   - Settings → General → Clear Build Cache
   - Then redeploy

---

## Summary

**The key issue:** The variable value needs to be updated **in Vercel's dashboard**, not just in your local code or Render.

**Action required:**
1. ✅ Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel dashboard
2. ✅ Replace with JWT token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. ✅ Save
4. ✅ Redeploy
5. ✅ Clear browser cache
6. ✅ Test again

