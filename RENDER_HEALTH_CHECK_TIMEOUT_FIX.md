# 🔧 Fix: Health Check Timeout - Database Connection Issue

## Problem

Your deployment shows:
```
Server running on port 10000
Checking for markets to resolve...
==> Timed Out
```

**The server is running, but the health check is timing out!**

## Root Cause

The `/health` endpoint tests the database connection. If it fails or times out, Render marks the deployment as failed.

**Most likely causes:**
1. **Database connection is failing** - `DATABASE_URL` might be incorrect
2. **Database connection is slow** - Takes longer than Render's timeout
3. **Health endpoint not accessible** - Routing or network issue

## Solution

### Step 1: Test Health Endpoint Manually

Open in your browser:
```
https://block-book-api.onrender.com/health
```

**If you see:**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "..."
}
```
→ **Database connection is failing**

**If you see:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```
→ **Health endpoint works, but Render's check timed out**

**If you see:**
- Connection timeout / Can't reach site
- 502 Bad Gateway
→ **Server might not be running or routing issue**

### Step 2: Check DATABASE_URL

1. Go to Render → `block-book-api` → **Environment** tab
2. Find `DATABASE_URL`
3. Verify it's exactly:
   ```
   postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-1-us-east-2.pooler.supabase.com:5432/postgres
   ```

**Check:**
- ✅ Password is URL-encoded: `Block-Book%402002` (not `Block-Book@2002`)
- ✅ Host is correct: `aws-1-us-east-2.pooler.supabase.com`
- ✅ Port is `5432`
- ✅ Database is `postgres`

### Step 3: Try Direct Connection (If Pooler Fails)

If the pooler connection is timing out, try the **direct connection**:

1. Go to Supabase Dashboard → Settings → Database
2. Click **Connection string** tab (not Connection pooling)
3. Select **URI** format
4. Copy the connection string
5. Update `DATABASE_URL` in Render

**Direct connection format:**
```
postgresql://postgres:[PASSWORD]@db.robjixmkmrmryrqzivdd.supabase.co:5432/postgres
```

**Note:** Direct connection uses:
- Host: `db.robjixmkmrmryrqzivdd.supabase.co` (not pooler)
- Port: `5432`
- User: `postgres` (not `postgres.robjixmkmrmryrqzivdd`)

### Step 4: Simplify Health Check (Temporary Fix)

If database connection keeps timing out, you can temporarily simplify the health check to just return success without testing the database:

**Option A: Quick Fix (Remove DB Check)**
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString()
  });
});
```

**Option B: Add Timeout to DB Check**
```javascript
app.get('/health', async (req, res) => {
  try {
    // Add timeout to database check
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database check timeout')), 2000)
    );
    
    const dbCheck = pool.query('SELECT 1');
    await Promise.race([dbCheck, timeoutPromise]);
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    // Still return 200, but indicate database issue
    res.status(200).json({ 
      status: 'degraded', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message 
    });
  }
});
```

**Note:** Option B allows the health check to pass even if the database is slow, but still indicates the issue.

### Step 5: Check Render Logs for Database Errors

Look in the Render logs for:
- "Tenant or user not found"
- "Connection timeout"
- "password authentication failed"
- "ECONNREFUSED"
- "ETIMEDOUT"

These will tell you exactly what's wrong with the database connection.

### Step 6: Verify Supabase Connection

Test your database connection from Supabase dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Run: `SELECT 1;`
3. If this works, your database is accessible
4. If this fails, there's a Supabase issue

## Quick Checklist

- [ ] Test `/health` endpoint manually in browser
- [ ] Check `DATABASE_URL` is correct (password encoded)
- [ ] Try direct connection instead of pooler
- [ ] Check Render logs for database errors
- [ ] Verify Supabase database is accessible
- [ ] Consider simplifying health check temporarily

## Expected Behavior

**If database connection works:**
```
https://block-book-api.onrender.com/health
→ {"status":"healthy","database":"connected"}
→ Health check passes
→ Deployment succeeds
```

**If database connection fails:**
```
https://block-book-api.onrender.com/health
→ {"status":"unhealthy","database":"disconnected","error":"..."}
→ Fix DATABASE_URL
→ Redeploy
```

## Alternative: Disable Health Check Temporarily

If you need to get the service live quickly:

1. Go to Render → Settings → Advanced
2. **Clear** the "Health Check Path" field (leave empty)
3. Save and redeploy

**Note:** This is not recommended for production, but can help you get the service running while you fix the database connection.

---

**Most likely fix: Update DATABASE_URL to use direct connection instead of pooler, or fix the password encoding!**

