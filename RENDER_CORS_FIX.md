# 🔧 Fix: CORS Blocking Vercel Preview URLs

## The Problem

Frontend requests from Vercel preview URL are being blocked:
```
⚠️  CORS blocked request from origin: https://testing-deploy-git-main-kushal-dioras-projects.vercel.app
```

## The Fix

I've updated the CORS configuration to:
1. ✅ Allow exact matches from `ALLOWED_ORIGINS` env var
2. ✅ Allow all Vercel preview URLs (pattern: `*.vercel.app`)
3. ✅ Keep existing allowed origins (localhost, block-book.com, etc.)

## Update Render Environment Variables

You need to add your production Vercel URL to `ALLOWED_ORIGINS`:

1. Go to Render Dashboard → Your Backend Service → Environment
2. Find `ALLOWED_ORIGINS` (or create it if it doesn't exist)
3. Set it to:
   ```
   https://block-book.com,https://www.block-book.com,https://testing-deploy-git-main-kushal-dioras-projects.vercel.app
   ```
   Or just use the wildcard pattern (already added in code):
   - Any URL ending with `.vercel.app` is now automatically allowed

## After Update

1. **Redeploy** the backend on Render (or wait for auto-deploy)
2. CORS errors should be resolved
3. Requests from Vercel preview URLs will work

---

**The code now allows all Vercel preview URLs automatically!** ✅
