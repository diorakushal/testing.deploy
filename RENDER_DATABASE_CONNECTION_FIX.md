# 🔧 Render Database Connection Fix

## Problem

Your deployment is failing with this error:
```
Error in resolution cron: error: Tenant or user not found
code: 'XX000'
```

This means **Render cannot connect to your Supabase database**.

## Root Cause

The `DATABASE_URL` environment variable in Render is either:
1. **Not set correctly** (missing or wrong format)
2. **Using wrong connection type** (pooler might not work, need direct connection)
3. **Password encoding issue** (special characters in password)

## Solution

### Step 1: Get Your Correct Supabase Connection String

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `robjixmkmrmryrqzivdd`
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string** section
5. Click on **Connection pooling** tab
6. Select **Session mode** (not Transaction mode)
7. Copy the connection string - it should look like:
   ```
   postgresql://postgres.robjixmkmrmryrqzivdd:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
   ```
   **Note:** Your actual connection string uses:
   - Host: `aws-1-us-east-2.pooler.supabase.com` (not `aws-0-us-east-1`)
   - Port: `5432` (Session pooler, not `6543`)

### Step 2: Update DATABASE_URL in Render

1. Go to your Render dashboard
2. Click on your service: `block-book-api` (or `testing.deploy`)
3. Go to **Environment** tab
4. Find the `DATABASE_URL` variable
5. Click **Edit** (or delete and recreate)
6. **Paste the connection string from Step 1**
7. **Important**: Make sure the password is URL-encoded:
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `%` becomes `%25`
   - etc.

### Step 3: Try Direct Connection (If Pooler Fails)

If the pooler connection still doesn't work, try the **direct connection**:

1. In Supabase Dashboard → Settings → Database
2. Click **Connection string** tab (not Connection pooling)
3. Select **URI** format
4. Copy the connection string - it should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
5. **Note**: Direct connection uses port `5432` (not `6543`)
6. Update `DATABASE_URL` in Render with this value

### Step 4: Verify Password Encoding

Your password is: `Block-Book@2002`

In the connection string, `@` must be encoded as `%40`:
- ✅ Correct: `Block-Book%402002`
- ❌ Wrong: `Block-Book@2002`

### Step 5: Redeploy

After updating `DATABASE_URL`:
1. Go to Render dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Or wait for auto-deploy (if enabled)
4. Watch the logs to see if connection succeeds

## Alternative: Use Individual Database Parameters

If connection strings keep failing, you can use individual parameters instead:

1. In Supabase Dashboard → Settings → Database
2. Note down these values:
   - **Host**: `aws-0-us-east-1.pooler.supabase.com` (or direct: `db.robjixmkmrmryrqzivdd.supabase.co`)
   - **Database name**: `postgres`
   - **Port**: `6543` (pooler) or `5432` (direct)
   - **User**: `postgres.robjixmkmrmryrqzivdd` (pooler) or `postgres` (direct)
   - **Password**: `Block-Book@2002`

3. In Render, **remove** `DATABASE_URL` and add these instead:
   - `DB_HOST` = `aws-0-us-east-1.pooler.supabase.com`
   - `DB_NAME` = `postgres`
   - `DB_PORT` = `6543`
   - `DB_USER` = `postgres.robjixmkmrmryrqzivdd`
   - `DB_PASSWORD` = `Block-Book@2002` (no encoding needed)

## Quick Test Connection String Format

**Session Pooler (Your Current Setup):**
```
postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```
✅ **This is your correct connection string!**

**Direct connection (if pooler fails):**
```
postgresql://postgres:Block-Book%402002@db.robjixmkmrmryrqzivdd.supabase.co:5432/postgres
```

## Verify It's Working

After redeploying, check the logs. You should see:
- ✅ `Server running on port 5000`
- ✅ No database connection errors
- ✅ Health check endpoint works: `https://your-service.onrender.com/health`

If you still see errors, check:
1. Password encoding (especially `@` → `%40`)
2. Connection type (try direct if pooler fails)
3. Network restrictions (Supabase might block some IPs)

## Common Issues

### Issue: "Tenant or user not found"
- **Fix**: Check password encoding, verify user format (`postgres.robjixmkmrmryrqzivdd` for pooler)

### Issue: "Connection timeout"
- **Fix**: Try direct connection (port 5432) instead of pooler (port 6543)

### Issue: "SSL required"
- **Fix**: Your code already handles SSL, but verify `ssl: { rejectUnauthorized: false }` is set

### Issue: "Password authentication failed"
- **Fix**: Double-check password, make sure `@` is encoded as `%40` in connection string

---

**Once the database connection works, your service will be fully operational!** 🚀

