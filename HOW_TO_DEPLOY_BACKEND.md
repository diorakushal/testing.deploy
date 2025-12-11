# 🚀 How to Deploy Backend to Railway or Render

Step-by-step visual guide for deploying your backend and setting environment variables.

---

## 🚂 Option 1: Railway (Recommended)

### Step 1: Sign Up / Log In

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project" or "Log In"
3. Sign in with GitHub (recommended) or email

### Step 2: Create New Project

1. Click the **"New Project"** button (usually top right or center)
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub if prompted
4. Select your repository: `last attempt` (or whatever your repo is named)
5. Click **"Deploy Now"**

### Step 3: Configure the Service

Railway will auto-detect it's a Node.js project. Now configure it:

1. Click on your newly created service
2. Go to **Settings** tab (gear icon on the left)
3. Scroll down to find these settings:

   **Root Directory:**
   - Find "Root Directory" setting
   - Change from `/` to `backend`
   - This tells Railway where your backend code is

   **Start Command:**
   - Find "Start Command" setting
   - Change to: `npm start`
   - This is the command to run your server

4. Click **"Save"** or the checkmark

### Step 4: Add Environment Variables

1. In your service, click on the **"Variables"** tab (or look for "Environment" or "Env" tab)
2. You'll see a list of variables (might be empty)
3. Click **"New Variable"** or **"Add Variable"** button
4. For each variable, do this:

   **Variable 1:**
   - **Name:** `SUPABASE_URL`
   - **Value:** `https://robjixmkmrmryrqzivdd.supabase.co`
   - Click **"Add"** or **"Save"**

   **Variable 2:**
   - Click **"New Variable"** again
   - **Name:** `SUPABASE_ANON_KEY`
   - **Value:** `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
   - Click **"Add"**

   **Variable 3:**
   - Click **"New Variable"** again
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
   - Click **"Add"**

   **Variable 4:**
   - Click **"New Variable"** again
   - **Name:** `ALLOWED_ORIGINS`
   - **Value:** `https://block-book.com,https://www.block-book.com`
   - Click **"Add"**

   **Variable 5:**
   - Click **"New Variable"** again
   - **Name:** `PORT`
   - **Value:** `5000`
   - Click **"Add"**

   **Variable 6:**
   - Click **"New Variable"** again
   - **Name:** `NODE_ENV`
   - **Value:** `production`
   - Click **"Add"**

5. After adding all variables, Railway will automatically redeploy

### Step 5: Check Deployment

1. Go to the **"Deployments"** tab or **"Logs"** tab
2. You should see build logs
3. Wait for it to finish (usually 2-5 minutes)
4. Look for "Build successful" or similar message

### Step 6: Get Your Backend URL

1. Go to **Settings** → **Networking**
2. You'll see a domain like: `your-app-name.railway.app`
3. This is your backend URL
4. Test it: Open `https://your-app-name.railway.app/health` in browser
5. Should see: `{"status":"healthy",...}`

### Step 7: Add Custom Domain (Optional)

1. In **Settings** → **Networking**
2. Click **"Custom Domain"** or **"Add Domain"**
3. Enter: `api.block-book.com`
4. Railway will show you a CNAME record to add to your DNS
5. Copy that CNAME value
6. Go to your domain registrar (GoDaddy, Namecheap, etc.)
7. Add the CNAME record (see `DNS_CONFIGURATION_GUIDE.md`)

---

## 🎨 Option 2: Render

### Step 1: Sign Up / Log In

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free" or "Log In"
3. Sign in with GitHub (recommended)

### Step 2: Create New Web Service

1. Click **"New +"** button (usually top right)
2. Select **"Web Service"**
3. Click **"Connect account"** to connect GitHub
4. Select your repository: `last attempt`
5. Click **"Connect"**

### Step 3: Configure the Service

Fill in these details:

**Basic Settings:**
- **Name:** `block-book-api` (or any name you like)
- **Environment:** Select **"Node"**
- **Region:** Choose closest to you (e.g., "Oregon (US West)")

**Build & Deploy:**
- **Branch:** `main` (or `master` - whatever your main branch is)
- **Root Directory:** `backend` (important!)
- **Build Command:** `npm install` (or leave blank if not needed)
- **Start Command:** `npm start`

Click **"Create Web Service"**

### Step 4: Add Environment Variables

1. Once the service is created, click on it
2. Go to the **"Environment"** tab (on the left sidebar)
3. You'll see a section for "Environment Variables"
4. Click **"Add Environment Variable"** button
5. For each variable, add them one by one:

   **Variable 1:**
   - **Key:** `SUPABASE_URL`
   - **Value:** `https://robjixmkmrmryrqzivdd.supabase.co`
   - Click **"Save Changes"**

   **Variable 2:**
   - Click **"Add Environment Variable"** again
   - **Key:** `SUPABASE_ANON_KEY`
   - **Value:** `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9`
   - Click **"Save Changes"**

   **Variable 3:**
   - Click **"Add Environment Variable"** again
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
   - Click **"Save Changes"**

   **Variable 4:**
   - Click **"Add Environment Variable"** again
   - **Key:** `ALLOWED_ORIGINS`
   - **Value:** `https://block-book.com,https://www.block-book.com`
   - Click **"Save Changes"**

   **Variable 5:**
   - Click **"Add Environment Variable"** again
   - **Key:** `PORT`
   - **Value:** `5000`
   - Click **"Save Changes"**

   **Variable 6:**
   - Click **"Add Environment Variable"** again
   - **Key:** `NODE_ENV`
   - **Value:** `production`
   - Click **"Save Changes"**

6. After adding all variables, Render will automatically redeploy

### Step 5: Check Deployment

1. Go to the **"Logs"** tab
2. You'll see build and deployment logs
3. Wait for "Your service is live" message
4. Usually takes 3-5 minutes

### Step 6: Get Your Backend URL

1. At the top of your service page, you'll see a URL like: `block-book-api.onrender.com`
2. This is your backend URL
3. Test it: Open `https://block-book-api.onrender.com/health` in browser
4. Should see: `{"status":"healthy",...}`

### Step 7: Add Custom Domain (Optional)

1. Go to **Settings** → **Custom Domains**
2. Click **"Add Custom Domain"**
3. Enter: `api.block-book.com`
4. Click **"Add"**
5. Render will show you a CNAME record to add to your DNS
6. Copy that CNAME value
7. Go to your domain registrar
8. Add the CNAME record (see `DNS_CONFIGURATION_GUIDE.md`)

---

## 📋 Quick Checklist

### Railway
- [ ] Signed up/logged in
- [ ] Created new project from GitHub
- [ ] Set Root Directory to `backend`
- [ ] Set Start Command to `npm start`
- [ ] Added all 6 environment variables
- [ ] Deployment successful
- [ ] Health check works
- [ ] Custom domain added (optional)

### Render
- [ ] Signed up/logged in
- [ ] Created new Web Service
- [ ] Set Root Directory to `backend`
- [ ] Set Start Command to `npm start`
- [ ] Added all 6 environment variables
- [ ] Deployment successful
- [ ] Health check works
- [ ] Custom domain added (optional)

---

## 🧪 Testing Your Deployment

### Test Health Endpoint

Once deployed, test in your browser:

**Railway:**
```
https://your-app-name.railway.app/health
```

**Render:**
```
https://your-app-name.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### If Health Check Fails

1. **Check Logs:**
   - Railway: Go to "Logs" tab
   - Render: Go to "Logs" tab
   - Look for error messages

2. **Common Issues:**
   - Missing environment variables → Check Variables tab
   - Wrong root directory → Should be `backend`
   - Database connection fails → Check `DATABASE_URL` is correct
   - Port issues → Make sure `PORT=5000` is set

3. **Redeploy:**
   - Railway: Click "Redeploy" button
   - Render: Click "Manual Deploy" → "Deploy latest commit"

---

## 💡 Tips

### Railway Tips
- Free tier includes $5 credit per month
- Auto-deploys on git push
- Easy to scale
- Good for Node.js apps

### Render Tips
- Free tier available (with limitations)
- Auto-deploys on git push
- Sleeps after 15 minutes of inactivity (free tier)
- Good for Node.js apps

### Which to Choose?
- **Railway:** Better free tier, faster deploys
- **Render:** More established, good documentation
- Both work great! Choose based on preference

---

## 🆘 Troubleshooting

### "Build failed"
- Check Root Directory is set to `backend`
- Check that `package.json` exists in `backend/` folder
- Check logs for specific error

### "Service won't start"
- Check Start Command is `npm start`
- Check `PORT` environment variable is set
- Check logs for startup errors

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check password is URL-encoded (`%40` for `@`)
- Try using Transaction Pooler (port 6543)

### "Environment variable not found"
- Make sure variable name matches exactly (case-sensitive)
- Check for typos
- Make sure you clicked "Save" after adding each variable

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Build completes successfully
- ✅ Service shows "Live" or "Running" status
- ✅ Health endpoint returns `{"status":"healthy"}`
- ✅ Logs show "Server running on port 5000"
- ✅ No error messages in logs

---

**Follow these steps and your backend will be deployed!** 🚀

Need help? Check the logs tab for specific error messages.
