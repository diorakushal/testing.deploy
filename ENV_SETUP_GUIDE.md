# Environment Variables Setup Guide

This guide will help you set up all required environment variables for both backend and frontend.

## 📋 Quick Setup Checklist

- [ ] Backend `.env` file created with all required variables
- [ ] Frontend `.env.local` file created with all required variables
- [ ] All Supabase credentials obtained
- [ ] Database connection string obtained
- [ ] CORS origins configured
- [ ] Tested that server starts successfully

---

## 🔧 Backend Environment Variables

### Step 1: Create Backend `.env` File

Create a file named `.env` in the `backend/` directory:

```bash
cd backend
touch .env
```

### Step 2: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`

### Step 3: Get Database Connection String

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **Connection pooling** → **Transaction** mode
4. Copy the connection string → `DATABASE_URL`

**OR** use individual parameters:
- **Host** → `DB_HOST`
- **Database name** → `DB_NAME` (usually `postgres`)
- **Port** → `DB_PORT` (6543 for pooler, 5432 for direct)
- **User** → `DB_USER`
- **Password** → `DB_PASSWORD` (your database password)

### Step 4: Configure Backend `.env`

```env
# ==============================================================================
# SUPABASE CONFIGURATION (REQUIRED)
# ==============================================================================
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# ==============================================================================
# DATABASE CONFIGURATION (REQUIRED - Choose one method)
# ==============================================================================

# Method 1: Connection String (Recommended)
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# OR Method 2: Individual Parameters
# DB_USER=postgres.YOUR_PROJECT_REF
# DB_PASSWORD=your_database_password
# DB_HOST=aws-0-us-east-1.pooler.supabase.com
# DB_PORT=6543
# DB_NAME=postgres

# ==============================================================================
# SERVER CONFIGURATION
# ==============================================================================
PORT=5000

# ==============================================================================
# CORS CONFIGURATION
# ==============================================================================
# For development:
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# For production, add your domain:
# ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Step 5: Test Backend Configuration

```bash
cd backend
npm start
```

You should see:
```
Server running on port 5000
```

If you see errors about missing environment variables, check your `.env` file.

---

## 🎨 Frontend Environment Variables

### Step 1: Create Frontend `.env.local` File

Create a file named `.env.local` in the `frontend/` directory:

```bash
cd frontend
touch .env.local
```

### Step 2: Configure Frontend `.env.local`

```env
# ==============================================================================
# API CONFIGURATION
# ==============================================================================
# For development:
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# For production:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# ==============================================================================
# SUPABASE CONFIGURATION (REQUIRED)
# ==============================================================================
# Use the same values from backend .env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# ==============================================================================
# WALLET CONNECT CONFIGURATION (Optional)
# ==============================================================================
# Get from: https://cloud.walletconnect.com/
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Step 3: Test Frontend Configuration

```bash
cd frontend
npm run dev
```

The app should start without errors. If you see errors about missing environment variables, check your `.env.local` file.

---

## 🔒 Security Notes

1. **Never commit `.env` or `.env.local` files** - They're already in `.gitignore`
2. **Use different credentials for production** - Don't use development credentials in production
3. **Rotate credentials if exposed** - If credentials are ever exposed, rotate them immediately
4. **Use environment-specific files** - Consider using `.env.production`, `.env.staging`, etc.

---

## 🧪 Testing Your Setup

### Test Backend Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### Test Frontend Connection

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser to `http://localhost:3000`
4. Try to log in - should connect to Supabase
5. Try to create a payment request - should work with authentication

---

## 🚨 Troubleshooting

### Backend won't start - "Missing required environment variable"

**Solution:** Check that all required variables are set in `backend/.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL` (or all DB_* variables)

### Frontend shows "Missing NEXT_PUBLIC_SUPABASE_URL"

**Solution:** Check that `frontend/.env.local` exists and has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### CORS errors in browser

**Solution:** Add your frontend URL to `ALLOWED_ORIGINS` in `backend/.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Database connection fails

**Solution:** 
1. Check your database password is correct
2. If password contains `@`, make sure it's URL-encoded as `%40` in connection string
3. Try using direct connection (port 5432) instead of pooler (port 6543)
4. Check Supabase dashboard for connection issues

### Authentication errors (401 Unauthorized)

**Solution:**
1. Make sure user is logged in via Supabase
2. Check that frontend is sending `Authorization: Bearer <token>` header
3. Verify token hasn't expired
4. Check backend logs for authentication errors

---

## 📝 Production Checklist

Before deploying to production:

- [ ] All environment variables set in production environment
- [ ] CORS configured with production domain
- [ ] Database connection uses production credentials
- [ ] Supabase project is production-ready
- [ ] API URL points to production backend
- [ ] Frontend URL configured in backend CORS
- [ ] Health check endpoint accessible
- [ ] All secrets are in secure environment variable storage (not in code)

---

## 🔗 Quick Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)
- [Supabase Database Settings](https://supabase.com/dashboard/project/_/settings/database)
- [WalletConnect Cloud](https://cloud.walletconnect.com/)

---

## ✅ Verification

After setup, verify everything works:

1. ✅ Backend starts without errors
2. ✅ Frontend starts without errors
3. ✅ Health check returns "healthy"
4. ✅ Can log in via Supabase
5. ✅ Can create payment requests
6. ✅ Can send payments
7. ✅ API calls include authentication headers
8. ✅ No CORS errors in browser console

If all checks pass, you're ready to go! 🚀

