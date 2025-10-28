# Supabase Connection Setup Guide

## ✅ What's Been Done

1. ✅ Updated `backend/server.js` to connect to Supabase
2. ✅ Created `backend/.env` file with your Supabase credentials
3. ✅ Configured SSL and connection pooling

## 🔧 Setup Steps

### Step 1: Get Your Database Password

1. Go to: **https://hirlfxzasfzfkouxuwfs.supabase.co**
2. Log in to your Supabase dashboard
3. Navigate to: **Settings** → **Database**
4. Scroll down to "Connection Parameters" section
5. Copy the **Database password** (or reset it if you don't have it)

### Step 2: Update .env File

Edit `backend/.env` and replace `YOUR_DATABASE_PASSWORD_HERE` with your actual database password:

```bash
cd backend
nano .env  # or use your preferred editor
```

Update this line:
```env
DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
```

### Step 3: Create Database Schema in Supabase

1. Go to: **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy and paste the contents of `supabase_schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success" message

Verify tables were created:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public';
```

You should see: `users`, `markets`, `stakes`, `market_payouts`, `user_payouts`

### Step 4: Test Database Connection

```bash
cd backend
npm install  # Install dependencies if not already done
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'aws-0-us-east-1.pooler.supabase.com',
  database: 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: 6543,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to Supabase!');
    console.log('Server time:', res.rows[0].now);
    process.exit(0);
  }
});
"
```

### Step 5: Start Your Backend Server

```bash
cd backend
npm start
```

Or with auto-reload:
```bash
npm run dev
```

The server should start and connect to Supabase! 🎉

## 📋 Connection Details

Your Supabase configuration:
- **Project URL**: https://hirlfxzasfzfkouxuwfs.supabase.co
- **Project Ref**: hirlfxzasfzfkouxuwfs
- **Connection Method**: Connection Pooler (recommended)
- **Host**: aws-0-us-east-1.pooler.supabase.com
- **Port**: 6543
- **Database**: postgres
- **User**: postgres
- **SSL**: Required (enabled)

## 🔍 Troubleshooting

### Error: "password authentication failed"
- **Solution**: Make sure your `DB_PASSWORD` in `.env` is correct
- Get it from Supabase Dashboard → Settings → Database

### Error: "connection refused"
- **Solution**: Check your internet connection and firewall
- Try the direct connection port 5432 instead of 6543

### Error: "SSL required"
- **Solution**: SSL is already configured in `server.js`
- This should work automatically

### Error: "relation does not exist"
- **Solution**: You haven't run the SQL schema yet
- Go to Step 3 and run `supabase_schema.sql`

## 🔐 Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use connection pooler** (port 6543) for production - Better performance
3. **Direct connection** (port 5432) - Use for migrations or admin tasks
4. **Service Role Key** - Use for backend operations that need bypass RLS

## 📚 Next Steps

1. ✅ Database schema created
2. ✅ Backend connected to Supabase
3. ▶️ Test API endpoints
4. ▶️ Update frontend to use the backend
5. ▶️ Deploy to production

## 🔗 Useful Links

- [Supabase Dashboard](https://hirlfxzasfzfkouxuwfs.supabase.co)
- [Supabase Docs](https://supabase.com/docs)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)

## 💡 Connection Pooler vs Direct Connection

| Port | Type | Use Case |
|------|------|----------|
| 6543 | Connection Pooler | ✅ Production, API requests |
| 5432 | Direct | Database migrations, admin |

**For your backend, always use port 6543** (connection pooler).

---

**Need help?** Check the Supabase dashboard logs or refer to `SUPABASE_SETUP.md`

