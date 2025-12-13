# Fix: Vercel Environment Variables Not Working

## Status Check

✅ **Environment Variables in Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL` - ✅ Set
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - ✅ Set
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - ✅ Set (this works too!)
- `NEXT_PUBLIC_API_URL` - ✅ Set
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - ✅ Set

✅ **Backend on Render:**
- ✅ Deployed successfully
- ✅ Running at: `https://block-book-api.onrender.com`
- ✅ Server running on port 10000

---

## The Issue

Even though variables are set, **Vercel needs to redeploy** for changes to take effect. Environment variables are only injected during the build process.

---

## Solution: Force a Redeploy

### Option 1: Trigger Redeploy via Dashboard (Recommended)

1. Go to Vercel Dashboard → Your Project
2. Go to **Deployments** tab
3. Find your latest deployment
4. Click the **3 dots (⋯)** menu
5. Click **Redeploy**
6. Wait for deployment to complete (~2-5 minutes)

### Option 2: Push Empty Commit to Trigger Redeploy

```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push
```

### Option 3: Make a Small Change

Make any small change to a file (like adding a comment) and push:

```bash
# Edit any file, then:
git add .
git commit -m "Trigger redeploy"
git push
```

---

## Verify After Redeploy

1. **Check Browser Console:**
   - Open your Vercel deployment
   - Open DevTools (F12) → Console
   - Look for: `[Supabase Config] URL:` and `[Supabase Config] Key:`
   - Should show your Supabase URL and key (first 30 chars)

2. **Test Login/Signup:**
   - Try logging in or signing up
   - Should NOT see "Invalid API key" error
   - Should successfully send OTP email

3. **Check Network Tab:**
   - Open DevTools → Network
   - Look for request to `robjixmkmrmryrqzivdd.supabase.co/auth/v1/otp`
   - Should return 200 (success), not 401 (unauthorized)

---

## Variable Name Compatibility

Your code supports BOTH:
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (you have this)
- ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (you have this too!)

**Either one works!** The code checks for both:

```typescript
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY 
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

So you're covered either way.

---

## Quick Checklist

- [x] Environment variables are set in Vercel
- [x] Backend is running on Render
- [ ] **Redeploy Vercel application** ← DO THIS NOW
- [ ] Test login/signup after redeploy
- [ ] Verify no "Invalid API key" error

---

## Common Issues After Redeploy

### Still Getting "Invalid API key"?
1. ✅ Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
2. ✅ Check browser console for actual error message
3. ✅ Verify deployment logs show environment variables loaded
4. ✅ Make sure you redeployed AFTER adding variables

### Variables Not Updating?
- Environment variables are baked into the build at deploy time
- Changes to env vars require a NEW deployment
- Can't update variables and expect existing deployments to use them

---

## Summary

**Everything is configured correctly!** You just need to:

1. **Redeploy Vercel** (so it rebuilds with the environment variables)
2. **Test** login/signup
3. **Done!** ✅

The backend is already working, so once Vercel redeploys, everything should connect properly.

