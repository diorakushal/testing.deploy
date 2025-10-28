# 🔧 How to Get Your Supabase Connection Details

## Steps to Get Database Host & Connection String

1. **Go to your Supabase Dashboard**:
   - Visit: https://hirlfxzasfzfkouxuwfs.supabase.co
   - Log in if needed

2. **Navigate to Settings → Database**:
   - Click on **Settings** in the left sidebar
   - Click on **Database** tab

3. **Copy Connection String**:
   You'll see **"Connection string"** section with tabs:
   - **URI mode** - Full connection string
   - **Transaction mode** - For pooled connections
   - **Session mode** - For direct connections

4. **Copy the "Transaction mode" or "URI mode" connection string**

It will look something like:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Or in parts:
- **Host**: `aws-0-us-east-1.pooler.supabase.com` (or similar)
- **Port**: `6543` (for connection pooler)
- **Database**: `postgres`
- **User**: `postgres.hirlfxzasfzfkouxuwfs`
- **Password**: `Kushal@2002@` (you've already set this)

## After Getting Connection Details

Run this command to test (replace with actual host):

```bash
node -e "const {Pool}=require('pg'); const p=new Pool({user:'postgres.hirlfxzasfzfkouxuwfs',host:'YOUR_ACTUAL_HOST_HERE',database:'postgres',password:'Kushal@2002@',port:6543,ssl:{rejectUnauthorized:false}}); p.query('SELECT NOW()').then(r=>console.log('✅ Connected!',r.rows[0].now)).catch(e=>console.error('❌ Failed:',e.message));"
```

## Quick Fix: Try These Host Options

Based on your project ref `hirlfxzasfzfkouxuwfs`, try these hosts:

### Option 1: Connection Pooler
```bash
node -e "const {Pool}=require('pg'); const p=new Pool({user:'postgres.hirlfxzasfzfkouxuwfs',host:'aws-0-us-east-1.pooler.supabase.com',database:'postgres',password:'Kushal@2002@',port:6543,ssl:{rejectUnauthorized:false}}); p.query('SELECT NOW()').then(r=>console.log('✅ Connected!',r.rows[0].now)).catch(e=>console.error('❌ Failed:',e.message));"
```

### Option 2: Try Different Region
The region might be different. Check your dashboard for the actual regional endpoint (could be us-west, europe-west, etc.)

### Option 3: Direct Connection
Use port 5432 for direct connection (not recommended for production):
```bash
node -e "const {Pool}=require('pg'); const p=new Pool({user:'postgres',host:'db.PROJECT_REF.supabase.co',database:'postgres',password:'Kushal@2002@',port:5432,ssl:{rejectUnauthorized:false}}); p.query('SELECT NOW()').then(r=>console.log('✅ Connected!',r.rows[0].now)).catch(e=>console.error('❌ Failed:',e.message));"
```

## Update .env File

Once you have the correct host, update `backend/.env`:

```bash
cd backend
nano .env  # or your favorite editor
```

Update the DB_HOST line with the correct host from your Supabase dashboard.

## Need Help?

The exact host format can vary based on:
- Your Supabase plan
- Your region
- Whether you're using connection pooler or direct connection

**Best approach**: Copy the exact connection string from Settings → Database in your Supabase dashboard.

