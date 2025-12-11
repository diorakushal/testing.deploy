# 🔧 Fix: "Application exited early" Error

## Problem

Your deployment shows:
```
Application exited early while running your code.
```

This means your server is **crashing on startup** before it can even start listening.

## Root Cause

Your server has **validation checks** that exit immediately if required environment variables are missing:

1. **Missing `SUPABASE_URL`** → Server exits
2. **Missing `SUPABASE_ANON_KEY`** → Server exits  
3. **Missing `DATABASE_URL`** (and no individual DB params) → Server exits

## Solution

### Step 1: Check Environment Variables in Render

1. Go to your Render dashboard
2. Click on your service: `testing.deploy` (or `block-book-api`)
3. Go to **Environment** tab
4. **Verify all 6 variables are present:**

   ✅ `SUPABASE_URL` = `https://robjixmkmrmryrqzivdd.supabase.co`
   
   ✅ `SUPABASE_ANON_KEY` = `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
   
   ✅ `DATABASE_URL` = `postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
   
   ✅ `ALLOWED_ORIGINS` = `https://block-book.com,https://www.block-book.com`
   
   ✅ `PORT` = `5000`
   
   ✅ `NODE_ENV` = `production`

### Step 2: Check for Common Issues

**Issue 1: Variables Not Added**
- If you see "No environment variables" → Add all 6 variables

**Issue 2: Typos in Variable Names**
- Must be exactly: `SUPABASE_URL` (not `SUPABASEURL` or `SUPABASE-URL`)
- Must be exactly: `SUPABASE_ANON_KEY` (not `SUPABASE_ANON` or `SUPABASE_KEY`)
- Must be exactly: `DATABASE_URL` (not `DATABASEURL` or `DB_URL`)

**Issue 3: Empty Values**
- Make sure each variable has a value (not empty)
- Check for extra spaces before/after values

**Issue 4: Password Encoding in DATABASE_URL**
- Password must be URL-encoded: `Block-Book%402002` (not `Block-Book@2002`)
- The `@` symbol must be `%40`

### Step 3: View Deployment Logs

1. In Render dashboard, click on your service
2. Go to **Logs** tab
3. Look for error messages like:
   ```
   ❌ Missing required environment variables:
      - SUPABASE_URL
   ```
   or
   ```
   ❌ Missing database configuration:
      Either set DATABASE_URL/POSTGRES_URL, or set all of:
      - DB_USER
      - DB_HOST
      - DB_NAME
      - DB_PASSWORD
   ```

### Step 4: Add Missing Variables

If any variables are missing:

1. Click **"+ Add Environment Variable"**
2. Enter the **exact name** (case-sensitive)
3. Enter the **exact value** (copy from the list above)
4. Click outside the field to save
5. **Redeploy** (or wait for auto-deploy)

### Step 5: Verify DATABASE_URL Format

Your `DATABASE_URL` should be exactly:
```
postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**Check:**
- ✅ Starts with `postgresql://`
- ✅ User: `postgres.robjixmkmrmryrqzivdd`
- ✅ Password: `Block-Book%402002` (with `%40` not `@`)
- ✅ Host: `aws-1-us-east-2.pooler.supabase.com`
- ✅ Port: `5432`
- ✅ Database: `postgres`

### Step 6: Redeploy

After fixing environment variables:

1. Go to **Manual Deploy** → **Deploy latest commit**
2. Or wait for auto-deploy (if enabled)
3. Watch the logs - you should see:
   ```
   Server running on port 5000
   ```
   Instead of early exit.

## Quick Checklist

Before redeploying, verify:

- [ ] All 6 environment variables are added
- [ ] Variable names are exact (case-sensitive)
- [ ] No typos in variable names
- [ ] No empty values
- [ ] `DATABASE_URL` password is URL-encoded (`%40` for `@`)
- [ ] `DATABASE_URL` uses correct host: `aws-1-us-east-2.pooler.supabase.com`
- [ ] `DATABASE_URL` uses correct port: `5432`

## Expected Logs (Success)

When it works, you'll see:
```
==> Running 'npm start'
> opinion-market-backend@1.0.0 start
> node server.js
Server running on port 5000
```

## Expected Logs (Failure)

If environment variables are missing, you'll see:
```
==> Running 'npm start'
> opinion-market-backend@1.0.0 start
> node server.js
❌ Missing required environment variables:
   - SUPABASE_URL
Please set these in your .env file before starting the server.
```

## Alternative: Use Individual DB Parameters

If `DATABASE_URL` keeps causing issues, you can use individual parameters instead:

**Remove `DATABASE_URL` and add:**
- `DB_HOST` = `aws-1-us-east-2.pooler.supabase.com`
- `DB_NAME` = `postgres`
- `DB_PORT` = `5432`
- `DB_USER` = `postgres.robjixmkmrmryrqzivdd`
- `DB_PASSWORD` = `Block-Book@2002` (no encoding needed)

---

**Once all environment variables are correctly set, your service will start successfully!** 🚀

