# Troubleshoot: Still Getting Invalid API Key

## Step 1: Check Browser Console for Config

**What does the console show?** Look for these lines:

```
[Supabase Config] URL: ...
[Supabase Config] Key: ...
```

**What key does it show?**
- Still showing `sb_publishable_...`? → Variable not updated
- Showing `eyJ...`? → Variable is correct, different issue
- Showing `undefined` or `MISSING`? → Variable not loaded

---

## Step 2: Verify Vercel Deployment Finished

1. Go to Vercel Dashboard → Deployments
2. Check if the latest deployment shows **"Ready"** (green checkmark)
3. Is it still "Building" or "Deploying"? → Wait for it to finish

---

## Step 3: Verify Environment Variable Updated

1. Go to Vercel → Settings → Environment Variables
2. Click on `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click the eye icon to reveal the value
4. Does it show the JWT token (`eyJ...`)? 
   - ✅ Yes → Variable is correct
   - ❌ No, still shows `sb_publishable_...` → Update it!

---

## Step 4: Clear Browser Cache

The browser might be using a cached version:

1. **Hard refresh:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
2. **Or clear cache:** 
   - Chrome: Settings → Privacy → Clear browsing data → Cached images
   - Select "Cached images and files"
   - Clear data

---

## Step 5: Check You're on the Right URL

Make sure you're testing on:
- ✅ Your **production Vercel URL** (e.g., `https://your-app.vercel.app`)
- ❌ NOT `localhost:3000` (that uses local `.env.local`)

---

## Step 6: Manual Redeploy (Nuclear Option)

If nothing works:

1. Go to Vercel → Deployments
2. Click the **3 dots (⋯)** on latest deployment
3. Click **"Redeploy"**
4. Wait for it to complete
5. Clear browser cache
6. Hard refresh

---

## Quick Diagnosis

**Share what you see in browser console:**
1. Open DevTools (F12) → Console
2. Look for `[Supabase Config] Key: ...`
3. Tell me what it shows:
   - `sb_publishable_...` → Variable not updated in Vercel
   - `eyJ...` → Variable is correct, might be cache issue
   - `undefined` or `MISSING` → Variable not being loaded

---

## Most Common Issues

### Issue 1: Deployment Not Finished
- ✅ Wait for deployment to show "Ready" status

### Issue 2: Browser Cache
- ✅ Hard refresh or clear cache

### Issue 3: Wrong Environment Variable Value
- ✅ Double-check value in Vercel matches the JWT token

### Issue 4: Variable Not Set for Production
- ✅ Make sure "Production" environment is selected for the variable

---

## Verify Correct Value

The correct value should be:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw
```

- Starts with: `eyJ`
- Ends with: `KMUw`
- Very long string (should be on one line)

