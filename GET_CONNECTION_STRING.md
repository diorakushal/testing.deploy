# How to Get Your Supabase Connection String

## Step-by-Step Instructions

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd
   - Or navigate to your project manually

2. **Open Database Settings**
   - Click **Settings** (gear icon) in the left sidebar
   - Click **Database** in the settings menu

3. **Get Connection String**
   - Scroll down to **Connection string** section
   - You'll see multiple tabs:
     - **URI** - Direct connection (port 5432)
     - **Connection pooling** - Pooler connection (port 6543) - **RECOMMENDED**
     - **JDBC** - Java format
     - **Golang** - Go format
     - **Python** - Python format
     - **Node.js** - Node.js format

4. **Copy the Connection Pooling URI**
   - Click on **Connection pooling** tab
   - Select **Transaction** mode (recommended for your use case)
   - Copy the connection string
   - It should look like:
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
     ```

5. **Update backend/.env**
   - Open `backend/.env` file
   - Replace the `DATABASE_URL` line with the connection string you copied
   - Make sure the password is URL-encoded (replace `@` with `%40`)

## Current Configuration

Your `.env` file is configured with:
- **Supabase URL**: https://robjixmkmrmryrqzivdd.supabase.co
- **API Key**: (set in .env)
- **Password**: Kushal@13

## Test Connection

After updating the connection string, test it:

```bash
cd backend
node test-connection.js
```

## If You Can't Access Dashboard

If you can't access the dashboard, the connection string format should be:

**Direct Connection:**
```
postgresql://postgres:Kushal%4013@db.robjixmkmrmryrqzivdd.supabase.co:5432/postgres
```

**Connection Pooler (Transaction mode):**
```
postgresql://postgres.robjixmkmrmryrqzivdd:Kushal%4013@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Connection Pooler (Session mode):**
```
postgresql://postgres.robjixmkmrmryrqzivdd:Kushal%4013@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

## Important Notes

1. **Password Encoding**: If your password contains `@`, encode it as `%40` in the connection string
2. **Connection Pooler**: Use port **6543** for transaction mode, **5432** for session mode
3. **IP Allowlist**: Make sure your IP is allowed in Supabase Settings → Database → Network Restrictions
4. **Database Status**: Ensure the database is fully provisioned (check dashboard)

## Next Steps

1. ✅ Get connection string from Supabase Dashboard
2. ✅ Update `backend/.env` with correct `DATABASE_URL`
3. ✅ Run `node backend/test-connection.js` to verify
4. ✅ Run `COMPLETE_SUPABASE_SCHEMA.sql` in Supabase SQL Editor
5. ✅ Restart backend server: `cd backend && npm start`

