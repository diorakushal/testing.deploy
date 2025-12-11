# 🚀 Render New Web Service - Complete Setup Guide

Follow these exact steps to create your new web service on Render.

---

## 📝 Form Configuration

### 1. Source Code ✅
- **Already set:** `diorakushal / testing.deploy`
- **Action:** Leave as is (or click "Edit" if you need to change repo)

### 2. Name
- **Current:** `testing.deploy`
- **Change to:** `block-book-api` (or keep `testing.deploy` if you prefer)
- **Action:** Click in the "Name" field and type: `block-book-api`

### 3. Project (Optional)
- **Action:** You can skip this for now, or click "Create a project" if you want to organize services

### 4. Language ✅
- **Already set:** `Node`
- **Action:** Leave as is

### 5. Branch ✅
- **Already set:** `main`
- **Action:** Leave as is

### 6. Region ✅
- **Already set:** `Oregon (US West)`
- **Action:** Leave as is (or choose closer region if preferred)

### 7. Root Directory ⚠️ **IMPORTANT**
- **Current:** Empty
- **Change to:** `backend`
- **Action:** 
  1. Click in the "Root Directory" field
  2. Type: `backend`
  3. This tells Render where your backend code is located

### 8. Build Command ⚠️ **NEEDS UPDATE**
- **Current:** `$ yarn`
- **Change to:** `npm install`
- **Action:**
  1. Click in the "Build Command" field
  2. Delete `$ yarn`
  3. Type: `npm install`

### 9. Start Command ⚠️ **NEEDS UPDATE**
- **Current:** `$ yarn start`
- **Change to:** `npm start`
- **Action:**
  1. Click in the "Start Command" field
  2. Delete `$ yarn start`
  3. Type: `npm start`

### 10. Instance Type
- **Current:** `Free` (highlighted)
- **Action:** Leave as `Free` for now (you can upgrade later)
- **Note:** Free instances spin down after inactivity, but that's fine for testing

### 11. Environment Variables ⚠️ **CRITICAL - ADD ALL 6**

Click **"+ Add Environment Variable"** and add each one:

**Variable 1:**
- **NAME:** `SUPABASE_URL`
- **Value:** `https://robjixmkmrmryrqzivdd.supabase.co`
- Click outside or press Enter

**Variable 2:**
- Click **"+ Add Environment Variable"** again
- **NAME:** `SUPABASE_ANON_KEY`
- **Value:** `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
- Click outside or press Enter

**Variable 3:**
- Click **"+ Add Environment Variable"** again
- **NAME:** `DATABASE_URL`
- **Value:** `postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
- **Note:** Password is URL-encoded (`@` → `%40`)
- Click outside or press Enter

**Variable 4:**
- Click **"+ Add Environment Variable"** again
- **NAME:** `ALLOWED_ORIGINS`
- **Value:** `https://block-book.com,https://www.block-book.com`
- Click outside or press Enter

**Variable 5:**
- Click **"+ Add Environment Variable"** again
- **NAME:** `PORT`
- **Value:** `5000`
- Click outside or press Enter

**Variable 6:**
- Click **"+ Add Environment Variable"** again
- **NAME:** `NODE_ENV`
- **Value:** `production`
- Click outside or press Enter

**Verify:** You should see 6 environment variables listed:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `DATABASE_URL`
- ✅ `ALLOWED_ORIGINS`
- ✅ `PORT`
- ✅ `NODE_ENV`

### 12. Advanced ⚠️ **IMPORTANT - UPDATE HEALTH CHECK**

Click to expand the **"Advanced"** section, then:

**Health Check Path:**
- **Current:** `/healthz` (default)
- **Change to:** `/health`
- **Action:**
  1. Click in the "Health Check Path" field
  2. Delete `/healthz`
  3. Type: `/health`
  4. This matches your server's health endpoint

**Pre-Deploy Command:**
- **Current:** Empty
- **Action:** Leave empty (no database migrations needed - Supabase handles schema)

**Auto-Deploy:**
- **Current:** `On Commit` ✅
- **Action:** Leave as is (this is correct)

**Build Filters:**
- **Action:** Leave empty (not needed)

**Secret Files:**
- **Action:** Leave empty (using environment variables instead)

**Disk:**
- **Action:** Leave empty (not needed)

---

## ✅ Before Clicking "Create Web Service"

**⚠️ CRITICAL: Add ALL environment variables BEFORE deploying!**

If you deploy without environment variables, your service will crash with "Application exited early" error.

Double-check all settings:

- [ ] **Name** = `block-book-api` (or `testing.deploy`)
- [ ] **Root Directory** = `backend`
- [ ] **Build Command** = `npm install`
- [ ] **Start Command** = `npm start`
- [ ] **Instance Type** = `Free`
- [ ] **All 6 environment variables added** (check each one - this is CRITICAL!)
  - [ ] `SUPABASE_URL` is set
  - [ ] `SUPABASE_ANON_KEY` is set
  - [ ] `DATABASE_URL` is set (with correct password encoding)
  - [ ] `ALLOWED_ORIGINS` is set
  - [ ] `PORT` is set to `5000`
  - [ ] `NODE_ENV` is set to `production`
- [ ] **Health Check Path** = `/health` (in Advanced section)

---

## 🚀 Deploy

1. Scroll to the bottom of the page
2. Click **"Create Web Service"** button
3. Render will start building your service
4. You'll see build logs appear
5. Wait 3-5 minutes for deployment

---

## 📊 What Happens Next

### During Build:
- Render clones your repository
- Runs `npm install` in the `backend` directory
- Installs all dependencies
- Builds your application

### After Build:
- Runs `npm start`
- Your server starts on port 5000
- Service becomes "Live"

### You'll See:
- Build logs (showing npm install progress)
- Deploy logs (showing server startup)
- Final message: "Your service is live at https://your-service.onrender.com"

---

## 🧪 Testing After Deployment

Once you see "Your service is live":

1. **Get your URL:**
   - At the top of the page, you'll see: `https://block-book-api.onrender.com` (or similar)
   - This is your backend URL

2. **Test Health Endpoint:**
   - Open in browser: `https://your-service.onrender.com/health`
   - Should see: `{"status":"healthy","timestamp":"...","database":"connected"}`

3. **Check Logs:**
   - Click "Logs" tab
   - Should see: "Server running on port 5000"
   - No error messages

---

## 🆘 Troubleshooting

### Build Fails
- **Check:** Root Directory is `backend`
- **Check:** `package.json` exists in `backend/` folder
- **Check:** Build Command is `npm install`
- **Look at logs** for specific error

### Service Won't Start
- **Check:** Start Command is `npm start`
- **Check:** `PORT` environment variable is set to `5000`
- **Check logs** for startup errors

### Database Connection Fails
- **Check:** `DATABASE_URL` is correct (verify password encoding: `%40` for `@`)
- **Check:** Connection string uses correct host: `aws-1-us-east-2.pooler.supabase.com`
- **Check:** Port is `5432` (Session pooler)
- **Check logs** for connection errors

### Health Check Returns Error
- **Check:** Health Check Path is `/health` (not `/healthz`)
- **Check:** All environment variables are set
- **Check logs** for specific errors
- **Wait a minute** - service might still be starting

---

## 📝 Quick Reference

**Settings Summary:**
```
Name: block-book-api
Root Directory: backend
Build Command: npm install
Start Command: npm start
Instance: Free
Health Check Path: /health
```

**Environment Variables:**
```
SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY=sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9
DATABASE_URL=postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-1-us-east-2.pooler.supabase.com:5432/postgres
ALLOWED_ORIGINS=https://block-book.com,https://www.block-book.com
PORT=5000
NODE_ENV=production
```

---

**Follow these steps and your backend will be live in minutes!** 🚀

