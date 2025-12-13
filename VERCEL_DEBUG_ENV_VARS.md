# 🔍 Debug: Environment Variables Not Working

## Problem

Even though `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in Vercel, you're still getting:
```
AuthApiError: Invalid API key
POST https://robjixmkmrmryrqzivdd.supabase.co/auth/v1/otp 401 (Unauthorized)
```

## Debugging Steps

### Step 1: Verify Variable is in Build

Add a temporary debug log to see what value is actually being used:

1. Edit `frontend/lib/supabase.ts`
2. Add this temporarily:
```typescript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

3. Commit and push
4. Check browser console on your live site
5. See what values are actually being used

### Step 2: Check Browser Console

1. Open your deployed site
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for the debug logs
5. Verify the key matches what's in Vercel

### Step 3: Verify Key in Supabase

1. Go to https://supabase.com/dashboard
2. Select project: `robjixmkmrmryrqzivdd`
3. Go to **Settings** → **API**
4. Check the **"Publishable key"** (anon key)
5. Make sure it matches: `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`

### Step 4: Check for Key Rotation

If Supabase rotated the key:
1. Go to Supabase Dashboard → Settings → API
2. Check if there's a "Regenerate" button or new key
3. If key changed, update Vercel with the new key
4. Redeploy

### Step 5: Verify All Required Variables

Make sure ALL these are set in Vercel:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://robjixmkmrmryrqzivdd.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
- ✅ `NEXT_PUBLIC_API_URL` = `https://block-book-api.onrender.com/api`
- ✅ `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` = `6e4a1dcc02a0169ec9f4e7ffe7a34810`

### Step 6: Force Clear Cache

Sometimes browsers cache old builds:

1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or clear browser cache completely
3. Try in incognito/private window

## Common Issues

### Issue 1: Deployment Used Old Build

**Solution:** Redeploy after adding variables
- Go to Vercel → Deployments → Redeploy latest

### Issue 2: Key Was Regenerated

**Solution:** Get the latest key from Supabase
- Supabase Dashboard → Settings → API → Copy new key
- Update Vercel
- Redeploy

### Issue 3: Wrong Key Type

**Solution:** Make sure you're using the **"Publishable key"** (anon key)
- NOT the "Secret key" or "Service role key"
- The publishable key starts with `sb_publishable_` or `eyJ...`

### Issue 4: Key Has Extra Spaces

**Solution:** Check for hidden spaces
- Copy the key directly from Supabase
- Paste into Vercel
- Don't add any spaces before/after

## Quick Test

Add this to a page temporarily to debug:

```typescript
// In any page component
useEffect(() => {
  console.log('ENV CHECK:');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30));
}, []);
```

This will show you what values are actually available at runtime.

---

**Add debug logs to see what key is actually being used in the browser!** 🔍


