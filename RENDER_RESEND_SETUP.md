# Render + Resend Email Setup - Quick Guide

## Step-by-Step: Add Resend API Key to Render

### 1. Access Your Render Dashboard
- Go to: https://dashboard.render.com
- Log in to your account

### 2. Find Your Backend Service
- Click on your backend service (the Node.js/Express API)
- This is the service that runs `server.js`

### 3. Add Environment Variables
- In your service, click on the **"Environment"** tab
- Scroll down to the **"Environment Variables"** section
- Click **"Add Environment Variable"** for each:

#### Variable 1: RESEND_API_KEY
- **Key**: `RESEND_API_KEY`
- **Value**: `re_QXmwG3oK_NPZbTGB9PBjcYpTqKdz9Rs2L`
- Click **"Save Changes"**

#### Variable 2: EMAIL_FROM
- **Key**: `EMAIL_FROM`
- **Value**: `Blockbook <onboarding@resend.dev>`
- Click **"Save Changes"**

#### Variable 3: FRONTEND_URL
- **Key**: `FRONTEND_URL`
- **Value**: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- Click **"Save Changes"**

### 4. Redeploy
- Render will automatically redeploy when you save environment variables
- OR you can manually trigger a redeploy from the "Manual Deploy" section
- Wait for deployment to complete (check the "Events" tab for progress)

### 5. Verify Setup
- After redeployment, check the "Logs" tab
- Look for any errors about missing RESEND_API_KEY
- The backend should start successfully
- Test email notifications by creating a payment request

## What Happens Next

Once deployed:
- ✅ Payment request created → Email sent to requester
- ✅ Request fulfilled → Email sent to requester
- ✅ Payment sent → Email sent to sender
- ✅ Payment received → Email sent to recipient

## Troubleshooting

**If emails aren't sending:**
1. Check Render logs for email errors
2. Verify RESEND_API_KEY is set correctly
3. Check Resend dashboard for sent emails
4. Make sure user emails exist in your database

**If backend fails to start:**
1. Check logs for missing environment variables
2. Verify all 3 variables are set
3. Check for typos in variable names

## Important: Domain Setup Required

**Before setting up environment variables**, you need to:

1. **Add your domain to Resend** (if you have a custom domain)
   - Go to: https://resend.com/domains
   - Add your domain and verify DNS records
   - See `RESEND_EMAIL_SETUP.md` for detailed instructions

2. **Create a sender email address**
   - Once domain is verified, create an email like `notifications@yourdomain.com`
   - Use this in the `EMAIL_FROM` variable below

3. **If you don't have a domain yet:**
   - You can use `onboarding@resend.dev` temporarily for testing
   - But you'll need a verified domain for production

## Current Configuration

Your Resend API Key:
- `re_QXmwG3oK_NPZbTGB9PBjcYpTqKdz9Rs2L`

Your Email From (Temporary - replace with verified domain email):
- `Blockbook <onboarding@resend.dev>`
- **Production**: `Blockbook <notifications@yourdomain.com>` (after domain verification)

Your Frontend URL:
- Set this to your actual Vercel deployment URL

---

## Full Setup Guide

For complete Resend setup including domain verification, see:
📄 **`RESEND_EMAIL_SETUP.md`** - Complete guide with DNS setup, domain verification, and production configuration

