# Resend Setup - Final Steps (Domain Verified ✅)

Your domain is verified! Since Resend no longer requires creating separate email addresses, you can use ANY address @block-book.com immediately.

## Step 1: Update Render Environment Variables

**No need to create an email address in Resend!** Just use any email from your verified domain.

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your backend service
3. Go to **Environment** tab
4. Find `EMAIL_FROM` variable
5. Update it to:
   ```
   Blockbook <notifications@block-book.com>
   ```
   **You can use ANY email address @block-book.com** (e.g., `notifications@`, `noreply@`, `hello@`)

6. Make sure `FRONTEND_URL` is set to your Vercel deployment URL:
   ```
   https://your-app.vercel.app
   ```

7. Click **"Save Changes"**
8. Render will auto-redeploy (or manually trigger redeploy)

**That's it!** Since your domain is verified and sending is enabled, emails will work immediately.

---

## Step 2: Verify Setup

### Test Email Sending:

1. **Create a payment request** or **send a payment** in your app
2. Check your email inbox (and spam folder)
3. Check Resend Dashboard → **Emails** tab:
   - Go to: https://resend.com/emails
   - See if email was sent
   - Check delivery status

### Check Backend Logs:

1. Go to Render Dashboard → Your Service → **Logs**
2. Look for email success messages:
   ```
   [Email] Email sent successfully to: user@example.com
   ```

### If Emails Aren't Sending:

1. Check Render logs for errors
2. Verify `EMAIL_FROM` format is correct:
   - ✅ Correct: `Blockbook <notifications@block-book.com>`
   - ❌ Wrong: `notifications@block-book.com` (missing display name)
   - ❌ Wrong: `Blockbook notifications@block-book.com` (missing brackets)
3. Verify domain is verified and "Enable Sending" is ON in Resend
4. Check Resend email logs for errors

---

## Current Configuration Checklist

- [x] Domain added to Resend
- [x] DNS records added to Vercel
- [x] Domain verified in Resend
- [x] Sending enabled (can use any email @block-book.com)
- [ ] `EMAIL_FROM` updated in Render
- [ ] `FRONTEND_URL` set correctly in Render
- [ ] Test email sent successfully

---

## Email Notification Types

Once setup is complete, these emails will automatically send:

1. **Payment Request Created**
   - Sent to: Requester (person who created the request)
   - When: New payment request is created

2. **Request Fulfilled**
   - Sent to: Requester (person who received payment)
   - When: Someone pays their request

3. **Payment Sent**
   - Sent to: Sender (person who sent payment)
   - When: Payment is successfully sent

4. **Payment Received**
   - Sent to: Recipient (person who received payment)
   - When: Payment is successfully received

---

## Environment Variables Summary

**On Render (Backend):**
```env
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=Blockbook <notifications@yourdomain.com>
FRONTEND_URL=https://your-app.vercel.app
```

**Local Development (backend/.env):**
```env
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=Blockbook <notifications@yourdomain.com>
FRONTEND_URL=http://localhost:3000
```

---

## Success! 🎉

Once you complete these steps, your email notifications are fully configured!

**Next Actions:**
1. Create sender email in Resend
2. Update `EMAIL_FROM` in Render
3. Test by creating a payment request
4. Verify email arrives in inbox

