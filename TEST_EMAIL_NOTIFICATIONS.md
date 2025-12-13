# Test Email Notifications - Ready to Test! ✅

## ✅ What's Already Set Up

1. **Resend Domain Verified** ✅
   - Domain: `block-book.com`
   - Status: Verified and ready

2. **Email Code Integrated** ✅
   - Email functions created: `backend/lib/email.js`
   - Integrated into backend API endpoints
   - All 4 notification types ready:
     - Payment Request Created
     - Request Fulfilled (Payment Received)
     - Payment Sent
     - Payment Received

3. **Backend Endpoints** ✅
   - `POST /api/payment-requests` → Sends email when request created
   - `PATCH /api/payment-requests/:id/paid` → Sends email when request fulfilled
   - `POST /api/payment-sends` → Sends emails to both sender and recipient

---

## 🔍 Final Checklist Before Testing

### Required Environment Variables in Render:

Verify these are set in Render Dashboard → Backend Service → Environment:

- [ ] `RESEND_API_KEY` = `re_QXmwG3oK_NPZbTGB9PBjcYpTqKdz9Rs2L`
- [ ] `EMAIL_FROM` = `Blockbook <notifications@block-book.com>` (or your verified email)
- [ ] `FRONTEND_URL` = `https://your-vercel-app.vercel.app` (your Vercel deployment URL)

**If any are missing, add them and redeploy Render.**

---

## 🧪 How to Test

### Test 1: Payment Request Created
1. **Create a payment request** in your app
2. **Check your email inbox** (use the email of the requester)
3. **Expected:** Email with subject "Your payment request for X USDC has been created"

### Test 2: Request Fulfilled (Payment Received)
1. **Pay someone's payment request** (fulfill a request)
2. **Check requester's email inbox**
3. **Expected:** Email with subject "💰 You received X USDC!"

### Test 3: Payment Sent
1. **Send a payment** to someone
2. **Check sender's email inbox**
3. **Expected:** Email with subject "You sent X USDC to [recipient]"

### Test 4: Payment Received
1. **Someone sends you a payment** (or send to yourself from another account)
2. **Check recipient's email inbox**
3. **Expected:** Email with subject "💰 You received X USDC from [sender]"

---

## 🔍 Where to Check Email Status

### Resend Dashboard:
1. Go to: https://resend.com/emails
2. See all emails sent
3. Check delivery status:
   - ✅ **Delivered** - Email sent successfully
   - ⚠️ **Bounced** - Email address doesn't exist
   - ⚠️ **Failed** - Configuration issue

### Render Logs:
1. Go to Render Dashboard → Your Backend Service → **Logs**
2. Look for:
   - `[Email] Email sent successfully to: user@example.com`
   - `[Email] Error sending email:` (if there's an error)

---

## 🐛 Troubleshooting

### Emails Not Sending?

1. **Check Render Environment Variables:**
   - Verify `RESEND_API_KEY` is set correctly
   - Verify `EMAIL_FROM` uses your verified domain email
   - Verify `FRONTEND_URL` is your Vercel URL

2. **Check Resend Dashboard:**
   - Go to https://resend.com/emails
   - See if emails appear there (even if they fail)
   - Check error messages

3. **Check Render Logs:**
   - Look for email-related errors
   - Check if `RESEND_API_KEY` is being loaded

4. **Verify User Has Email:**
   - Make sure the user's email is set in the `users` table
   - Check database: `SELECT email FROM users WHERE id = 'user-id';`

### Common Issues:

**"Email service not configured"**
- → `RESEND_API_KEY` missing in Render

**"Domain not verified"**
- → Domain needs to be verified in Resend (you said it's done ✅)

**"Sender email not found"**
- → `EMAIL_FROM` doesn't match verified domain email

**Emails go to spam:**
- → Check spam folder first
- → Domain reputation improves over time

---

## ✅ Quick Test Checklist

- [ ] Verify Render environment variables are set
- [ ] Create a payment request → Check email
- [ ] Fulfill a payment request → Check email
- [ ] Send a payment → Check sender email
- [ ] Receive a payment → Check recipient email
- [ ] Check Resend dashboard for delivery status
- [ ] Check Render logs for any errors

---

## 🎉 Summary

**Everything is ready to test!** The code is integrated and working. Just make sure:

1. ✅ Environment variables are set in Render
2. ✅ `EMAIL_FROM` uses your verified domain: `notifications@block-book.com`
3. ✅ Users have email addresses in the database

Then test by creating/paying payment requests and sending payments!

