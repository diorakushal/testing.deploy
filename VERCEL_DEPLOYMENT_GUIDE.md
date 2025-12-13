# 🚀 Vercel Deployment Guide - Frontend

Complete guide to deploy your Next.js frontend on Vercel.

---

## 📋 Prerequisites

1. **Vercel account** - Sign up at https://vercel.com (free tier available)
2. **GitHub repository** - Your code should be on GitHub
3. **Backend URL** - Your Render backend is live at: `https://block-book-api.onrender.com`

---

## 🚀 Quick Deployment Steps

### Step 1: Connect Repository to Vercel

1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `diorakushal/testing.deploy`
4. Vercel will auto-detect it's a Next.js project ✅

### Step 2: Configure Project Settings

**Project Name:**
- Use: `block-book` or `block-book-frontend` (or your preferred name)

**Framework Preset:**
- Should auto-detect: **Next.js** ✅

**Root Directory:**
- Set to: `frontend`
- This tells Vercel where your Next.js app is located

**Build Command:**
- Should auto-detect: `npm run build` ✅

**Output Directory:**
- Should auto-detect: `.next` ✅

**Install Command:**
- Should auto-detect: `npm install` ✅

### Step 3: Add Environment Variables ⚠️ CRITICAL

Click **"Environment Variables"** and add:

#### Variable 1: Backend API URL
- **Name:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://block-book-api.onrender.com/api`
- **Environments:** Production, Preview, Development (check all)

#### Variable 2: Supabase URL
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://robjixmkmrmryrqzivdd.supabase.co`
- **Environments:** Production, Preview, Development (check all)

#### Variable 3: Supabase Anon Key
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
- **Environments:** Production, Preview, Development (check all)

#### Variable 4: WalletConnect Project ID
- **Name:** `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- **Value:** `6e4a1dcc02a0169ec9f4e7ffe7a34810`
- **Environments:** Production, Preview, Development (check all)

**Note:** All `NEXT_PUBLIC_*` variables are exposed to the browser, so they're safe to use in client-side code.

### Step 4: Deploy

1. Click **"Deploy"** button
2. Vercel will:
   - Install dependencies
   - Build your Next.js app
   - Deploy to production
3. Wait 2-3 minutes for deployment

### Step 5: Verify Deployment

Once deployed, you'll get a URL like:
- `https://block-book.vercel.app` (or your custom domain)

**Test:**
1. Open the URL in your browser
2. Check browser console for errors
3. Test authentication
4. Test API calls to your backend

---

## 🔧 Configuration Details

### Root Directory

Since your Next.js app is in the `frontend/` folder:

1. In Vercel project settings
2. Go to **Settings** → **General**
3. Find **"Root Directory"**
4. Set to: `frontend`
5. Click **"Save"**

### Build Settings

Vercel should auto-detect:
- **Framework:** Next.js
- **Build Command:** `npm run build` (runs in `frontend/` directory)
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Environment Variables Summary

```
NEXT_PUBLIC_API_URL=https://block-book-api.onrender.com/api
NEXT_PUBLIC_SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=6e4a1dcc02a0169ec9f4e7ffe7a34810
```

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Check Root Directory is set to `frontend`
- Verify `package.json` exists in `frontend/` folder

**Error: "Environment variable not found"**
- Make sure all `NEXT_PUBLIC_*` variables are set
- Check variable names are exact (case-sensitive)

### API Calls Fail

**Error: "Network error" or "CORS error"**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS settings allow your Vercel domain
- Backend `ALLOWED_ORIGINS` should include: `https://your-app.vercel.app`

### Authentication Issues

**Error: "Supabase client not initialized"**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- Check browser console for specific errors

---

## 🔄 Updating Backend URL in Render

After deploying frontend, update backend CORS to allow Vercel domain:

1. Go to Render → Your backend service → **Environment** tab
2. Find `ALLOWED_ORIGINS`
3. Add your Vercel URL:
   ```
   https://block-book.com,https://www.block-book.com,https://your-app.vercel.app
   ```
4. Save and redeploy backend

---

## 📝 Custom Domain (Optional)

### Add Custom Domain in Vercel

1. Go to Vercel project → **Settings** → **Domains**
2. Add your domain: `block-book.com`
3. Follow DNS configuration instructions
4. Vercel will provide DNS records to add

### Update Backend CORS

After adding custom domain, update backend `ALLOWED_ORIGINS`:
```
https://block-book.com,https://www.block-book.com
```

---

## ✅ Deployment Checklist

Before deploying:

- [ ] Root Directory set to `frontend`
- [ ] `NEXT_PUBLIC_API_URL` = `https://block-book-api.onrender.com/api`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://robjixmkmrmryrqzivdd.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
- [ ] Backend CORS allows Vercel domain
- [ ] `package.json` exists in `frontend/` folder
- [ ] Code is pushed to GitHub

After deploying:

- [ ] Frontend loads without errors
- [ ] Authentication works
- [ ] API calls to backend succeed
- [ ] No CORS errors in console
- [ ] Test key features (payment requests, etc.)

---

## 🎉 Success!

Once deployed, your frontend will be live at:
- `https://your-app.vercel.app`

And it will connect to your backend at:
- `https://block-book-api.onrender.com`

**Your full-stack app is now deployed!** 🚀

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)


