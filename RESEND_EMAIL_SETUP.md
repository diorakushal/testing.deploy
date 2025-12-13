# Resend Email Setup Guide

This guide walks you through setting up Resend for sending payment notification emails in production.

## Current Status

Your code is currently using: `Blockbook <onboarding@resend.dev>` (Resend's default test email)

**For production**, you need to:
1. ✅ Create a Resend account (already done - you have API key)
2. ⚠️ **Add and verify your domain** (REQUIRED)
3. ⚠️ **Create a sender email address** (REQUIRED)
4. ⚠️ **Update environment variables** (REQUIRED)

---

## Step 1: Add Your Domain to Resend

### Option A: Use Your Custom Domain (Recommended for Production)

1. Go to Resend Dashboard: https://resend.com/domains
2. Click **"Add Domain"**
3. Enter your domain (e.g., `block-book.com` or `your-vercel-domain.vercel.app`)
4. Follow the DNS setup instructions:

#### DNS Records to Add:

**For custom domain (e.g., `block-book.com`):**
```
Type: TXT
Name: @
Value: [Resend provides this - copy from dashboard]
```

```
Type: CNAME
Name: resend._domainkey
Value: [Resend provides this - copy from dashboard]
```

**For subdomain (e.g., `emails.block-book.com`):**
```
Type: TXT
Name: emails
Value: [Resend provides this]
```

```
Type: CNAME
Name: resend._domainkey.emails
Value: [Resend provides this]
```

5. Wait for verification (can take a few minutes to 24 hours)
6. Status will show "Verified" when complete

### Option B: Use Resend's Test Domain (Quick Testing Only)

If you don't have a custom domain yet, you can use:
- `onboarding@resend.dev` (current fallback - limited)

**Limitations:**
- Only works for testing
- Limited deliverability
- Not recommended for production

---

## Step 2: Create a Sender Email Address

Once your domain is verified:

1. Go to Resend Dashboard: https://resend.com/domains
2. Click on your verified domain
3. Click **"Create Email Address"** or go to **"Email Addresses"** tab
4. Create an email like:
   - `notifications@yourdomain.com`
   - `noreply@yourdomain.com`
   - `hello@yourdomain.com`
5. Use a descriptive name: **"Blockbook"** or **"Blockbook Notifications"**

**Example:**
- Email: `notifications@block-book.com`
- Display Name: `Blockbook`
- Full Format: `Blockbook <notifications@block-book.com>`

---

## Step 3: Update Environment Variables

### For Render (Backend):

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your backend service
3. Go to **Environment** tab
4. Update/Add these variables:

```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Blockbook <notifications@yourdomain.com>
FRONTEND_URL=https://your-app.vercel.app
```

**Important:** Replace:
- `notifications@yourdomain.com` with your actual verified sender email
- `your-app.vercel.app` with your actual Vercel deployment URL

### For Local Development (backend/.env):

```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Blockbook <notifications@yourdomain.com>
FRONTEND_URL=http://localhost:3000
```

---

## Step 4: Test Email Sending

### Quick Test:

1. Start your backend server
2. Create a payment request or send a payment
3. Check your email inbox (and spam folder)
4. Check Resend Dashboard → **Logs** to see email status

### Check Resend Logs:

1. Go to: https://resend.com/emails
2. View recent emails sent
3. Check delivery status:
   - ✅ **Delivered**: Email was successfully sent
   - ⚠️ **Bounced**: Email address doesn't exist
   - ⚠️ **Failed**: Configuration issue

---

## Step 5: Verify Everything Works

### Checklist:

- [ ] Domain is verified in Resend dashboard (shows "Verified" status)
- [ ] Sender email address created and shows as "Active"
- [ ] Environment variables updated on Render with your domain email
- [ ] `EMAIL_FROM` format: `Blockbook <notifications@yourdomain.com>`
- [ ] `FRONTEND_URL` points to your production Vercel URL
- [ ] Test email sent successfully (check Resend logs)

---

## Troubleshooting

### Emails Not Sending?

1. **Check API Key:**
   - Verify `RESEND_API_KEY` is correct in Render
   - API key starts with `re_`
   - Go to: https://resend.com/api-keys

2. **Check Domain Status:**
   - Domain must show "Verified" in Resend dashboard
   - DNS records must be correctly configured
   - Can take up to 24 hours for DNS propagation

3. **Check Sender Email:**
   - Sender email must be from verified domain
   - Format must be: `Display Name <email@domain.com>`
   - No spaces around `< >` brackets

4. **Check Resend Logs:**
   - Go to: https://resend.com/emails
   - Look for error messages
   - Check delivery status

5. **Check Backend Logs:**
   - Look for email error messages in Render logs
   - Check if `RESEND_API_KEY` is set correctly
   - Verify email helper is being called

### Common Errors:

**"Email service not configured"**
- `RESEND_API_KEY` is missing or empty
- Fix: Add API key to Render environment variables

**"Invalid API key"**
- API key is incorrect or revoked
- Fix: Generate new API key in Resend dashboard

**"Domain not verified"**
- Domain needs to be verified first
- Fix: Complete DNS setup and wait for verification

**"Sender email not found"**
- Email address doesn't exist in Resend
- Fix: Create sender email address for your domain

---

## Quick Start (If You Don't Have a Domain Yet)

If you want to test immediately without a custom domain:

1. **Use Resend Test Domain (Temporary):**
   ```env
   EMAIL_FROM=Blockbook <onboarding@resend.dev>
   ```
   - ✅ Works immediately
   - ⚠️ Limited to testing
   - ⚠️ Not for production

2. **Get a Domain Later:**
   - Buy domain from Namecheap, Google Domains, etc.
   - Add to Resend and verify
   - Update `EMAIL_FROM` environment variable

---

## Production Best Practices

1. **Use a Subdomain for Emails:**
   - `emails.yourdomain.com` (recommended)
   - Keeps main domain clean
   - Easier to manage

2. **Use Descriptive Sender Name:**
   - `Blockbook <notifications@yourdomain.com>`
   - Makes emails recognizable

3. **Monitor Email Delivery:**
   - Check Resend dashboard regularly
   - Set up webhooks for bounces/failures (optional)
   - Monitor spam reports

4. **Warm Up Your Domain:**
   - Start with low email volume
   - Gradually increase
   - Helps with deliverability

---

## Next Steps

1. ✅ Add domain to Resend
2. ✅ Verify domain (wait for DNS propagation)
3. ✅ Create sender email address
4. ✅ Update Render environment variables
5. ✅ Test sending an email
6. ✅ Verify email arrives in inbox (check spam)

---

## Resources

- Resend Dashboard: https://resend.com
- Resend Docs: https://resend.com/docs
- Domain Setup: https://resend.com/domains
- API Keys: https://resend.com/api-keys
- Email Logs: https://resend.com/emails

