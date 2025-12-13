# Deployment Update Checklist - Post Pivot Cleanup

After cleaning up opinion market code, here's what you need to check/update in Vercel and Render.

## ✅ What You DON'T Need to Update

### Code Changes
- ✅ **No code changes needed** - All frontend/backend code has been cleaned up
- ✅ **No build commands need changing** - Still `npm install` and `npm start`
- ✅ **No deployment settings need changing** - Root directories, build commands are fine

### Environment Variables (Mostly Fine)
- ✅ **SUPABASE_URL** - Still needed ✅
- ✅ **SUPABASE_ANON_KEY** - Still needed ✅
- ✅ **DATABASE_URL** - Still needed ✅
- ✅ **ALLOWED_ORIGINS** - Still needed ✅
- ✅ **PORT** - Still needed ✅
- ✅ **NODE_ENV** - Still needed ✅

## ⚠️ What You SHOULD Check/Update

### 1. Remove Unused Environment Variables (Optional but Recommended)

#### In Render (Backend):
- ❌ **MARKET_CONTRACT_ADDRESS** - Remove if present (no longer used)
- ❌ **POLYGON_RPC_URL** - Remove if present (not used for payments)
- ❌ Any other opinion market related variables

#### In Vercel (Frontend):
- ❌ **NEXT_PUBLIC_CONTRACT_ADDRESS** - Remove if present (no longer used)
- ❌ Any other opinion market related variables

**Note:** These won't break anything if left, but cleaning them up keeps things tidy.

### 2. Database Schema Update (IMPORTANT)

**Before deploying, run the cleanup scripts on your Supabase database:**

1. **Run `cleanup_legacy_tables.sql`** to remove:
   - `stakes` table
   - `markets` table
   - `market_payouts` table
   - `user_payouts` table
   - Related triggers and functions

2. **Run `cleanup_users_table.sql`** to remove:
   - `markets_created` column
   - `total_staked` column
   - `total_earnings` column
   - `wins` column
   - `losses` column

**Why this matters:**
- If your backend code tries to query these tables/columns, it will fail
- The cleanup scripts are safe to run (they use `IF EXISTS` checks)
- Run them in Supabase SQL Editor before deploying

### 3. Verify No Broken References

**Check Render Logs After Deployment:**
- Look for any errors about missing tables/columns
- Should see no references to `markets`, `stakes`, `market_payouts`, `user_payouts`
- Should see no references to `markets_created`, `total_staked`, etc.

**Check Vercel Build Logs:**
- Build should complete successfully
- No TypeScript errors about missing types
- No import errors for removed components

## 📋 Step-by-Step Update Process

### Step 1: Update Database (Do This First!)

1. Go to Supabase Dashboard → SQL Editor
2. Run `cleanup_legacy_tables.sql`
3. Run `cleanup_users_table.sql`
4. Verify tables are removed:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('stakes', 'markets', 'market_payouts', 'user_payouts');
   -- Should return 0 rows
   ```

### Step 2: Update Render (Backend)

1. Go to Render Dashboard → Your Backend Service
2. Click **Environment** tab
3. **Remove** (if present):
   - `MARKET_CONTRACT_ADDRESS`
   - `POLYGON_RPC_URL`
4. **Keep** all other variables (SUPABASE_URL, DATABASE_URL, etc.)
5. Click **Save Changes**
6. **Redeploy** (or wait for auto-deploy if enabled)

### Step 3: Update Vercel (Frontend)

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Environment Variables**
3. **Remove** (if present):
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - Any other opinion market related variables
4. **Keep** all other variables (NEXT_PUBLIC_API_URL, SUPABASE vars, etc.)
5. **Redeploy** (or wait for auto-deploy if enabled)

### Step 4: Verify Deployment

**Backend (Render):**
1. Check health endpoint: `https://your-backend.onrender.com/health`
2. Should return: `{"status":"healthy","database":"connected"}`
3. Check logs for any errors

**Frontend (Vercel):**
1. Visit your Vercel URL
2. Check browser console for errors
3. Test key features:
   - Login/authentication
   - Create payment request
   - Send payment
   - View contacts

## 🔍 What to Look For in Logs

### Good Signs ✅
- No errors about missing tables
- No errors about missing columns
- Health check returns success
- API calls succeed
- Frontend loads without errors

### Bad Signs ❌
- Errors like: `relation "markets" does not exist`
- Errors like: `column "markets_created" does not exist`
- 500 errors from backend
- Frontend build failures

## 🚨 If You See Errors

### Error: "relation 'markets' does not exist"
**Solution:** Run `cleanup_legacy_tables.sql` - but this shouldn't happen since we removed all code references

### Error: "column 'markets_created' does not exist"
**Solution:** Run `cleanup_users_table.sql` - but this shouldn't happen since we removed all code references

### Error: Build fails in Vercel
**Solution:** 
- Check for any remaining imports of removed components
- Verify all environment variables are set
- Check build logs for specific errors

## 📝 Summary

**Required Actions:**
1. ✅ Run database cleanup scripts in Supabase
2. ✅ (Optional) Remove unused env vars in Render/Vercel
3. ✅ Redeploy both services
4. ✅ Verify everything works

**Not Required:**
- ❌ No code changes needed (already done)
- ❌ No build command changes
- ❌ No deployment setting changes
- ❌ No new environment variables needed

## ✅ Final Checklist

Before considering deployment complete:

- [ ] Database cleanup scripts run in Supabase
- [ ] Legacy tables removed from database
- [ ] Legacy columns removed from users table
- [ ] Render backend redeployed (or auto-deployed)
- [ ] Vercel frontend redeployed (or auto-deployed)
- [ ] Health check passes
- [ ] Frontend loads without errors
- [ ] Payment features work
- [ ] No errors in logs about missing tables/columns

---

**The good news:** Since we cleaned up all the code references, your deployments should work fine even without removing the database tables. But it's best practice to clean up the database too to avoid confusion and potential issues.
