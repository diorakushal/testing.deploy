# Email Notifications Setup with Resend

## Overview

Blockbook now sends email notifications for all payment-related events:
- ✅ Payment request created
- ✅ Payment request fulfilled (when someone pays your request)
- ✅ Payment sent (confirmation when you send a payment)
- ✅ Payment received (notification when you receive a payment)

## Setup Instructions

### 1. Create Resend Account

1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email

### 2. Get API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Blockbook Production")
4. Copy the API key (starts with `re_`)

### 3. Configure Domain (Optional for Production)

For production, you should verify your domain:
1. Go to **Domains** in Resend dashboard
2. Add your domain
3. Add the DNS records they provide
4. Wait for verification

For development/testing, you can use their test domain: `onboarding@resend.dev`

### 4. Add Environment Variables

Add to your `backend/.env` file:

```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here

# Email sender configuration
EMAIL_FROM=Blockbook <onboarding@resend.dev>
# Or for production with verified domain:
# EMAIL_FROM=Blockbook <noreply@yourdomain.com>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
# Or for production:
# FRONTEND_URL=https://yourdomain.com
```

### 5. Restart Backend

```bash
cd backend
npm start
# or
npm run dev
```

## Email Notifications

### Payment Request Created
- **Sent to**: Requester
- **When**: After payment request is successfully created
- **Content**: Request details, amount, chain, caption, link to view request

### Payment Request Fulfilled
- **Sent to**: Requester (the person who created the request)
- **When**: When someone pays their request
- **Content**: Who paid, amount received, transaction hash, explorer link

### Payment Sent
- **Sent to**: Sender
- **When**: After payment send is created
- **Content**: Amount sent, recipient info, transaction hash, explorer link

### Payment Received
- **Sent to**: Recipient
- **When**: After payment send is created
- **Content**: Amount received, sender info, transaction hash, explorer link

## Testing

### Test with Real Email

1. Create a payment request → Check requester's email
2. Pay a request → Check requester's email (request fulfilled)
3. Send a payment → Check sender's and recipient's emails

### Check Email Logs

Resend dashboard shows:
- All sent emails
- Delivery status
- Open/click rates (if tracking enabled)

## Troubleshooting

### Emails Not Sending?

1. **Check API Key**: Make sure `RESEND_API_KEY` is set in `.env`
2. **Check Logs**: Look for email errors in backend console
3. **Check Resend Dashboard**: See if emails are being sent (may be in spam)
4. **Domain Verification**: If using custom domain, make sure it's verified

### Common Issues

**"Email service not configured"**
- `RESEND_API_KEY` is missing or empty
- Solution: Add API key to `.env` and restart backend

**Emails going to spam**
- Use verified domain in production
- Add SPF/DKIM records
- Ask users to mark as not spam

**Rate Limits**
- Free tier: 3,000 emails/month
- Paid tier: $20/month for 50,000 emails
- Check usage in Resend dashboard

## Cost

- **Free Tier**: 3,000 emails/month (perfect for testing/small projects)
- **Paid Tier**: $20/month for 50,000 emails
- **Overages**: $0.0004 per email after limits

## Email Templates

All email templates are in `backend/lib/email.js`:
- HTML templates with Blockbook branding
- Responsive design
- Transaction links to blockchain explorers
- User-friendly formatting

## Customization

To customize email templates:
1. Edit `backend/lib/email.js`
2. Modify the template functions:
   - `getPaymentRequestCreatedTemplate()`
   - `getRequestFulfilledTemplate()`
   - `getPaymentSentTemplate()`
   - `getPaymentReceivedTemplate()`

## Security

- ✅ API keys stored in environment variables
- ✅ No sensitive data in email content
- ✅ Transaction hashes only (not full wallet addresses)
- ✅ Emails only sent to verified user email addresses

## Production Checklist

- [ ] Verify domain in Resend
- [ ] Set `EMAIL_FROM` to your verified domain
- [ ] Set `FRONTEND_URL` to production URL
- [ ] Test all 4 email types
- [ ] Monitor email delivery in Resend dashboard
- [ ] Set up email monitoring/alerts
- [ ] Consider upgrading to paid tier if needed

