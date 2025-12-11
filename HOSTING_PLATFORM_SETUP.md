# 🚀 Hosting Platform Setup Guide

Step-by-step instructions for setting up environment variables in popular hosting platforms.

---

## 🎨 Frontend Hosting: Vercel

### Step 1: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Framework Preset: **Next.js**
5. Root Directory: `frontend`
6. Build Command: `npm run build` (auto-detected)
7. Output Directory: `.next` (auto-detected)

### Step 2: Set Environment Variables

1. In your project, go to **Settings** → **Environment Variables**
2. Add each variable:

```
NEXT_PUBLIC_API_URL = https://api.block-book.com/api
NEXT_PUBLIC_SUPABASE_URL = https://robjixmkmrmryrqzivdd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your_anon_key]
```

3. Select **Production**, **Preview**, and **Development** environments
4. Click "Save"

### Step 3: Configure Custom Domain

1. Go to **Settings** → **Domains**
2. Click "Add Domain"
3. Enter: `block-book.com`
4. Click "Add"
5. Vercel will show DNS records to add (see `DNS_CONFIGURATION_GUIDE.md`)

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your site will be live at `https://block-book.com` (after DNS is configured)

---

## ⚙️ Backend Hosting: Railway

### Step 1: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect Node.js

### Step 2: Configure Service

1. Click on your service
2. Go to **Settings** → **Root Directory**
3. Set to: `backend`
4. Go to **Settings** → **Start Command**
5. Set to: `npm start`

### Step 3: Set Environment Variables

1. Go to **Variables** tab
2. Click "New Variable"
3. Add each variable:

```
SUPABASE_URL = https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY = [your_anon_key]
DATABASE_URL = [your_database_connection_string]
ALLOWED_ORIGINS = https://block-book.com,https://www.block-book.com
PORT = 5000
NODE_ENV = production
```

4. Click "Add" for each variable

### Step 4: Configure Custom Domain

1. Go to **Settings** → **Networking**
2. Click "Generate Domain" (for testing) or "Custom Domain"
3. Enter: `api.block-book.com`
4. Railway will show CNAME record to add

### Step 5: Deploy

1. Railway will auto-deploy on push
2. Or click "Deploy" manually
3. Check logs to verify deployment

---

## ⚙️ Backend Hosting: Render

### Step 1: Deploy to Render

1. Go to [render.com](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `block-book-api`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`

### Step 2: Set Environment Variables

1. Go to **Environment** tab
2. Add each variable:

```
SUPABASE_URL = https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY = [your_anon_key]
DATABASE_URL = [your_database_connection_string]
ALLOWED_ORIGINS = https://block-book.com,https://www.block-book.com
PORT = 5000
NODE_ENV = production
```

3. Click "Save Changes"

### Step 3: Configure Custom Domain

1. Go to **Settings** → **Custom Domains**
2. Click "Add Custom Domain"
3. Enter: `api.block-book.com`
4. Render will show CNAME record to add

### Step 4: Deploy

1. Render will auto-deploy
2. Check logs to verify deployment
3. Test health endpoint: `https://api.block-book.com/health`

---

## 📝 Environment Variables Quick Reference

### Backend Variables (Railway/Render)

Copy and paste these into your hosting platform:

```
SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY=[paste_your_anon_key_here]
DATABASE_URL=postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-0-us-east-1.pooler.supabase.com:6543/postgres
ALLOWED_ORIGINS=https://block-book.com,https://www.block-book.com
PORT=5000
NODE_ENV=production
```

**Note:** The DATABASE_URL above uses Transaction Pooler (recommended). If you need Session Pooler or direct connection, see `DATABASE_URL_COMPLETE.md`.

### Frontend Variables (Vercel)

Copy and paste these into Vercel:

```
NEXT_PUBLIC_API_URL=https://api.block-book.com/api
NEXT_PUBLIC_SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[paste_your_anon_key_here]
```

---

## 🔍 Getting Your Database Connection String

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `robjixmkmrmryrqzivdd`
3. Go to **Settings** → **Database**
4. Scroll to **Connection string**
5. Select **Connection pooling** → **Transaction** mode (recommended for backend)
   - **Note:** Direct connection shows "Not IPv4 compatible" warning - use pooler instead
6. Copy the connection string
7. Replace `[YOUR-PASSWORD]` with your actual database password: `Block-Book@2002`
8. **Important:** URL-encode the `@` symbol as `%40` in the connection string

**Your complete DATABASE_URL:**
```
postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**For environment variables:**
```env
DATABASE_URL=postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**⚠️ IPv4 Compatibility:** If you see "Not IPv4 compatible" warning, use **Session Pooler** or **Transaction Pooler** instead of direct connection. See `DATABASE_URL_COMPLETE.md` for details.

---

## 🔍 Getting Your Supabase Anon Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Find **Project API keys**
5. Copy the **anon public** key (not the service_role key)

---

## ✅ Post-Deployment Checklist

### Backend
- [ ] Service is running
- [ ] Health check works: `curl https://api.block-book.com/health`
- [ ] Environment variables are set
- [ ] Custom domain is configured
- [ ] SSL certificate is active

### Frontend
- [ ] Build succeeded
- [ ] Environment variables are set
- [ ] Custom domain is configured
- [ ] SSL certificate is active
- [ ] Site loads at `https://block-book.com`

### Integration
- [ ] Frontend can connect to backend API
- [ ] No CORS errors in browser console
- [ ] Authentication works
- [ ] Payment flows work
- [ ] All features tested

---

## 🧪 Testing After Deployment

### 1. Test Backend
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
- Check browser console (should be no errors)
- Test login
- Test creating payment request

### 3. Test API Connection
- Open browser DevTools → Network tab
- Try creating a payment request
- Check that API calls go to `api.block-book.com`
- Verify `Authorization` headers are present

---

## 🆘 Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Check logs in hosting platform
- Verify `DATABASE_URL` is correct
- Test database connection

### Frontend build fails
- Check environment variables are set
- Verify `NEXT_PUBLIC_` prefix on variables
- Check build logs for errors

### CORS errors
- Verify `ALLOWED_ORIGINS` includes your domain
- Check domain matches exactly (with https://)
- Restart backend after updating CORS

### SSL certificate issues
- Wait 5-15 minutes after DNS is configured
- Check hosting platform SSL status
- Verify DNS is fully propagated

---

**Follow these steps to deploy your application to production!** 🚀
