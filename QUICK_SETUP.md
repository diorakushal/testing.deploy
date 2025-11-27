# Quick Setup Guide

## ✅ What's Been Done

1. **Database Schema Created**: `COMPLETE_SUPABASE_SCHEMA.sql` - Ready to paste into Supabase
2. **Backend Configuration**: `.env` file updated with your Supabase credentials
3. **Connection Test Script**: `backend/test-connection.js` - Test your connection

## 🔧 What You Need to Do

### 1. Get Correct Connection String from Supabase

**Go to**: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd/settings/database

**Copy** the connection string from **Connection pooling** → **Transaction** mode

**Update** `backend/.env` file with the correct `DATABASE_URL`

### 2. Run Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Open `COMPLETE_SUPABASE_SCHEMA.sql`
3. Copy all contents
4. Paste into Supabase SQL Editor
5. Click "Run"

### 3. Test Connection

```bash
cd backend
node test-connection.js
```

You should see:
- ✅ Connection successful
- 📊 List of tables

### 4. Restart Backend Server

```bash
cd backend
# Stop current server (Ctrl+C)
npm start
```

## 📋 Your Supabase Details

- **Project URL**: https://robjixmkmrmryrqzivdd.supabase.co
- **API Key**: (in .env file)
- **Password**: Kushal@13

## 🐛 Troubleshooting

If connection fails:
1. Check Supabase Dashboard → Database status
2. Verify connection string format
3. Check IP allowlist in Settings → Database
4. Try both direct (5432) and pooler (6543) ports

