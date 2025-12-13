# Verify Vercel Environment Variables

## Still Getting "Invalid API key" Error?

Let's verify your Vercel environment variables are correct.

---

## Step 1: Check Current Variable Values

Go to Vercel Dashboard → Settings → Environment Variables

### Verify These Exact Values:

#### 1. `NEXT_PUBLIC_SUPABASE_URL`
**Should be:**
```
https://robjixmkmrmryrqzivdd.supabase.co
```
- ✅ Must start with `https://`
- ✅ Must end with `.supabase.co` (no trailing slash)
- ❌ NOT `http://` (must be HTTPS)
- ❌ NOT have trailing slash

#### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Should be:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw
```
- ✅ Must start with `eyJ` (JWT token)
- ✅ Must be the FULL token (very long string)
- ❌ NOT truncated or cut off
- ❌ NO spaces before/after

#### 3. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (Alternative)
**If using this instead:**
```
sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9
```
- ✅ This is a valid alternative
- ✅ Code checks for this OR `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2: Verify in Browser Console

After redeploying, check browser console:

1. Open your Vercel deployment
2. Open DevTools (F12) → Console tab
3. Look for these logs:
   ```
   [Supabase Config] URL: https://robjixmkmrmryrqzivdd.supabase.co
   [Supabase Config] Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**If you see:**
- `[Supabase Config] URL: undefined` → Variable not set
- `[Supabase Config] Key: MISSING` → Variable not set
- `[Supabase Config] Key: undefined` → Variable not set

**Then the variables aren't being picked up!**

---

## Step 3: Double-Check Variable Names

Variable names are **case-sensitive** and must be EXACT:

✅ **Correct:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

❌ **Wrong:**
- `NEXT_PUBLIC_SUPABASE_URLS` (extra S)
- `NEXT_PUBLIC_SUPABASE_ANON` (missing `_KEY`)
- `next_public_supabase_url` (lowercase)
- `SUPABASE_ANON_KEY` (missing `NEXT_PUBLIC_` prefix)

---

## Step 4: Verify Environment Scope

Make sure variables are set for **ALL environments**:

1. In Vercel → Environment Variables
2. For each variable, check the "Environments" dropdown
3. Should show: **Production, Preview, Development** all selected
4. If only one is selected, the variable won't work in other environments

---

## Step 5: Force Clear Build Cache

If variables still aren't working:

1. Go to Vercel → Settings → General
2. Scroll to **"Clear Build Cache"**
3. Click **"Clear Build Cache"**
4. Then redeploy

---

## Step 6: Verify Deployment Logs

Check if variables are loaded during build:

1. Go to Vercel → Deployments
2. Click on your latest deployment
3. Check the build logs
4. Look for environment variables being loaded (they won't show values, but you can see if they're present)

---

## Common Mistakes

### ❌ Wrong: Copying with Extra Characters
```
NEXT_PUBLIC_SUPABASE_URL = https://robjixmkmrmryrqzivdd.supabase.co
```
Should NOT have spaces around `=`

### ❌ Wrong: Truncated API Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Must be the FULL key, not truncated

### ❌ Wrong: Wrong Domain
```
https://supabase.co/project/robjixmkmrmryrqzivdd
```
Should be the direct Supabase URL, not dashboard URL

### ✅ Correct Format:
```
https://robjixmkmrmryrqzivdd.supabase.co
```

---

## Quick Test

Try this in your browser console after redeploying:

```javascript
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30));
```

If these show `undefined`, the variables aren't loaded.

---

## Nuclear Option: Re-add Variables

If nothing works:

1. **Delete** all Supabase environment variables in Vercel
2. **Re-add** them one by one, double-checking:
   - Exact variable name
   - Exact value (copy-paste from Supabase dashboard)
   - All environments selected
3. **Save** each one
4. **Clear build cache**
5. **Redeploy**

---

## Get Fresh Values from Supabase

To verify your API key is correct:

1. Go to: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd/settings/api
2. Under **"Project API keys"**
3. Copy the **"anon public"** key
4. Compare with what's in Vercel
5. Should match exactly

---

## Still Not Working?

If after all this it still doesn't work:

1. Check browser console for the exact error
2. Check Network tab → Request to `/auth/v1/otp` → See response headers
3. Verify Supabase project is active (not paused)
4. Check Supabase dashboard → Settings → API → Rate limits (might be hitting limits)

---

## Summary Checklist

- [ ] Variable names are EXACT (case-sensitive)
- [ ] Values are correct (no typos, full API key)
- [ ] All environments selected (Production, Preview, Development)
- [ ] No extra spaces in values
- [ ] Redeployed after adding variables
- [ ] Cleared build cache
- [ ] Checked browser console logs
- [ ] Verified values match Supabase dashboard

