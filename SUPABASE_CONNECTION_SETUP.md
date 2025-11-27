# Supabase Connection Setup

## Your Supabase Project Details

- **Project URL**: https://robjixmkmrmryrqzivdd.supabase.co
- **API Key (anon)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw`
- **Password**: `Kushal@13`

## Connection String

The connection string format is:
```
postgresql://postgres:Kushal%4013@db.robjixmkmrmryrqzivdd.supabase.co:5432/postgres
```

Note: The `@` in the password is URL-encoded as `%40` in the connection string.

## Steps to Get Correct Connection String

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd
   - Click on **Settings** (gear icon) → **Database**

2. **Copy Connection String**
   - Scroll to **Connection string** section
   - Select **URI** tab
   - Copy the connection string (it should look like the one above)

3. **Alternative: Use Connection Pooler**
   - In the same section, select **Connection pooling** tab
   - Use port **6543** instead of **5432**
   - Host will be: `aws-0-us-east-1.pooler.supabase.com` (or similar)

## Current Configuration

The `.env` file has been updated with:
- Direct connection to `db.robjixmkmrmryrqzivdd.supabase.co:5432`
- Individual parameters as fallback
- Supabase API URL and key

## If Connection Fails

### Option 1: Use Connection Pooler
Update `.env` with pooler connection:
```
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
```

### Option 2: Check IP Allowlist
1. Go to Supabase Dashboard → Settings → Database
2. Scroll to **Connection Pooling** or **Network Restrictions**
3. Add your IP address or allow all (for development)

### Option 3: Verify Database is Provisioned
1. Check Supabase Dashboard → Database
2. Ensure database status shows "Active"
3. Wait a few minutes if it was just created

## Test Connection

Run the test script:
```bash
cd backend
node test-connection.js
```

## Next Steps

1. ✅ Run `COMPLETE_SUPABASE_SCHEMA.sql` in Supabase SQL Editor
2. ✅ Test connection with `node test-connection.js`
3. ✅ Restart backend server: `npm start`
4. ✅ Verify tables exist in Supabase Table Editor
