# 🚀 Production Deployment Guide - block-book.com

This guide will help you deploy your application to production with the domain `block-book.com`.

## 📋 Pre-Deployment Checklist

- [x] Domain purchased: `block-book.com`
- [ ] Domain DNS configured
- [ ] Backend hosting selected (Vercel, Railway, Render, etc.)
- [ ] Frontend hosting selected (Vercel, Netlify, etc.)
- [ ] Production environment variables configured
- [ ] CORS configured for production domain
- [ ] SSL certificates configured
- [ ] Database connection verified
- [ ] Health check endpoint tested

---

## 🌐 Domain Configuration

### DNS Setup

Configure your DNS records for `block-book.com`:

**For Frontend (Vercel/Netlify):**
- **A Record** or **CNAME**: Point to your hosting provider
- **Example (Vercel):**
  - Type: `CNAME`
  - Name: `@` or `www`
  - Value: `cname.vercel-dns.com`

**For Backend API:**
- **Subdomain**: `api.block-book.com` (recommended)
- **Type**: `CNAME` or `A Record`
- **Value**: Your backend hosting provider's domain/IP

---

## 🔧 Backend Production Configuration

### Update `backend/.env` for Production

```env
# ==============================================================================
# SUPABASE CONFIGURATION
# ==============================================================================
SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================
DATABASE_URL=postgresql://postgres.robjixmkmrmryrqzivdd:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# ==============================================================================
# SERVER CONFIGURATION
# ==============================================================================
PORT=5000
NODE_ENV=production

# ==============================================================================
# CORS CONFIGURATION - PRODUCTION
# ==============================================================================
ALLOWED_ORIGINS=https://block-book.com,https://www.block-book.com,https://api.block-book.com

# OR use FRONTEND_URL
FRONTEND_URL=https://block-book.com

# ==============================================================================
# API URL (for frontend)
# ==============================================================================
# If using subdomain:
API_URL=https://api.block-book.com/api
# OR if backend is on same domain:
# API_URL=https://block-book.com/api
```

### Backend Deployment Options

#### Option 1: Railway (Recommended for Node.js)
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push
4. Get your backend URL (e.g., `https://your-app.railway.app`)

#### Option 2: Render
1. Create new Web Service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

#### Option 3: Vercel (Serverless Functions)
1. Import project
2. Configure as Node.js project
3. Set environment variables
4. Deploy

#### Option 4: DigitalOcean App Platform
1. Create new app
2. Connect repository
3. Configure environment variables
4. Deploy

---

## 🎨 Frontend Production Configuration

### Update `frontend/.env.production` (or `.env.local` for production)

```env
# ==============================================================================
# API CONFIGURATION - PRODUCTION
# ==============================================================================
# If using subdomain:
NEXT_PUBLIC_API_URL=https://api.block-book.com/api
# OR if backend is on same domain:
# NEXT_PUBLIC_API_URL=https://block-book.com/api

# ==============================================================================
# SUPABASE CONFIGURATION
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# ==============================================================================
# WALLET CONNECT (Optional)
# ==============================================================================
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Frontend Deployment Options

#### Option 1: Vercel (Recommended for Next.js)
1. Import your GitHub repository
2. Framework preset: **Next.js**
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Configure custom domain: `block-book.com`
5. Deploy

#### Option 2: Netlify
1. Import repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Set environment variables
5. Configure custom domain

---

## 🔒 Security Checklist for Production

### Backend Security
- [x] Hardcoded credentials removed ✅
- [x] API authentication implemented ✅
- [x] CORS configured for production domain
- [ ] Rate limiting configured (recommended)
- [ ] Error logging service configured (Sentry, etc.)
- [ ] SSL/HTTPS enabled
- [ ] Environment variables secured (not in code)

### Frontend Security
- [x] Hardcoded credentials removed ✅
- [ ] Environment variables set in hosting platform
- [ ] HTTPS enabled
- [ ] Security headers configured

---

## 📝 Step-by-Step Deployment

### Step 1: Prepare Backend

1. **Update CORS in backend/.env:**
   ```env
   ALLOWED_ORIGINS=https://block-book.com,https://www.block-book.com
   ```

2. **Test locally with production config:**
   ```bash
   cd backend
   npm start
   ```

3. **Verify health check:**
   ```bash
   curl http://localhost:5000/health
   ```

### Step 2: Deploy Backend

1. Choose your hosting provider
2. Connect GitHub repository
3. Set all environment variables from `backend/.env`
4. Configure build/start commands:
   - Build: `npm install` (or skip if no build step)
   - Start: `npm start`
5. Deploy and get your backend URL

### Step 3: Configure Backend Domain

1. **Option A: Subdomain (Recommended)**
   - Create subdomain: `api.block-book.com`
   - Point DNS to your backend hosting provider
   - Update CORS to include subdomain

2. **Option B: Same Domain**
   - Use path-based routing: `block-book.com/api`
   - Configure reverse proxy (nginx, etc.)

### Step 4: Prepare Frontend

1. **Update frontend/.env.production:**
   ```env
   NEXT_PUBLIC_API_URL=https://api.block-book.com/api
   NEXT_PUBLIC_SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. **Test build locally:**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

### Step 5: Deploy Frontend

1. Choose your hosting provider (Vercel recommended)
2. Connect GitHub repository
3. Set environment variables
4. Configure custom domain: `block-book.com`
5. Deploy

### Step 6: Update CORS After Deployment

Once you have your actual backend URL, update `backend/.env`:

```env
ALLOWED_ORIGINS=https://block-book.com,https://www.block-book.com,https://api.block-book.com
```

Redeploy backend with updated CORS.

---

## 🧪 Post-Deployment Testing

### 1. Test Backend Health
```bash
curl https://api.block-book.com/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": "connected"
}
```

### 2. Test Frontend
- Visit `https://block-book.com`
- Check browser console for errors
- Test login functionality
- Test payment request creation
- Check Network tab for API calls

### 3. Test Authentication
- Log in via Supabase
- Check that `Authorization` headers are sent
- Verify no 401 errors

### 4. Test CORS
- Open browser console
- Should see no CORS errors
- API calls should succeed

---

## 🔧 Environment Variables Summary

### Backend Production Variables

```env
# Required
SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_database_connection_string

# Production CORS
ALLOWED_ORIGINS=https://block-book.com,https://www.block-book.com

# Optional
PORT=5000
NODE_ENV=production
```

### Frontend Production Variables

```env
# Required
NEXT_PUBLIC_API_URL=https://api.block-book.com/api
NEXT_PUBLIC_SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## 🚨 Common Issues & Solutions

### CORS Errors
**Problem:** Browser shows CORS errors  
**Solution:** 
1. Add your frontend domain to `ALLOWED_ORIGINS` in backend
2. Include protocol: `https://block-book.com` (not just `block-book.com`)
3. Restart backend after updating

### 401 Unauthorized
**Problem:** API calls return 401  
**Solution:**
1. Check user is logged in
2. Verify token is being sent (check Network tab)
3. Check backend logs for auth errors
4. Verify `NEXT_PUBLIC_SUPABASE_URL` matches backend `SUPABASE_URL`

### Database Connection Fails
**Problem:** Backend can't connect to database  
**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check Supabase dashboard for connection issues
3. Verify database password is correct
4. Check if IP needs to be whitelisted in Supabase

### Environment Variables Not Loading
**Problem:** Frontend shows missing env vars  
**Solution:**
1. Set variables in hosting platform (not just `.env` file)
2. For Next.js, variables must start with `NEXT_PUBLIC_`
3. Restart/redeploy after adding variables

---

## 📊 Monitoring & Maintenance

### Health Checks
- Set up monitoring for `/health` endpoint
- Alert on unhealthy status
- Monitor database connectivity

### Error Tracking
- Set up Sentry or similar service
- Monitor API errors
- Track authentication failures

### Performance
- Monitor API response times
- Check database query performance
- Monitor frontend load times

---

## ✅ Production Checklist

### Before Launch
- [ ] All environment variables set in hosting platforms
- [ ] CORS configured for production domain
- [ ] SSL certificates active
- [ ] Domain DNS configured
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Health check passing
- [ ] Authentication working
- [ ] Payment flows tested
- [ ] Error tracking configured
- [ ] Monitoring set up

### After Launch
- [ ] Test all user flows
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify analytics tracking
- [ ] Test on multiple devices/browsers

---

## 🎯 Recommended Architecture

```
block-book.com (Frontend - Vercel)
    ↓
api.block-book.com (Backend - Railway/Render)
    ↓
Supabase (Database + Auth)
```

**Benefits:**
- Separate scaling for frontend/backend
- Clear API endpoint
- Easy to manage CORS
- Independent deployments

---

## 📚 Additional Resources

- [Vercel Deployment Guide](https://vercel.com/docs)
- [Railway Deployment Guide](https://docs.railway.app)
- [Supabase Production Best Practices](https://supabase.com/docs/guides/platform)
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)

---

## 🆘 Support

If you encounter issues:
1. Check error logs in hosting platform
2. Verify environment variables are set
3. Test health check endpoint
4. Check browser console for frontend errors
5. Review `CRITICAL_FIXES_APPLIED.md` for security setup

---

**Your domain `block-book.com` is ready to be configured! Follow the steps above to deploy to production.** 🚀

