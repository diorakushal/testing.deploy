# Supabase Email Confirmation Setup

This guide explains how to configure Supabase to send confirmation emails for user registration.

## 1. Enable Email Confirmation in Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Settings** (or **Auth** → **Configuration**)
3. Scroll down to **Email Auth** section
4. Enable **"Enable email confirmations"** toggle
5. Set **"Confirm email"** to `true`

## 2. Configure Email Templates

1. In the same **Authentication** → **Settings** page
2. Scroll to **Email Templates** section
3. Customize the **"Confirm signup"** template if needed
4. The default template includes:
   - Confirmation link
   - User's email
   - Expiration time

## 3. Configure Redirect URL

1. In **Authentication** → **URL Configuration**
2. Set **"Site URL"** to your frontend URL (e.g., `http://localhost:3000` for development)
3. Add **"Redirect URLs"**:
   - `http://localhost:3000/auth/confirm` (for development)
   - `https://yourdomain.com/auth/confirm` (for production)

## 4. Email Provider Configuration

### Option A: Use Supabase Default (Development)
- Supabase provides a default email service for development
- Limited to 3 emails per hour
- Good for testing

### Option B: Use Custom SMTP (Production)
1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Configure your SMTP provider:
   - **SMTP Host**: Your SMTP server (e.g., `smtp.gmail.com`)
   - **SMTP Port**: Usually `587` for TLS
   - **SMTP User**: Your email address
   - **SMTP Password**: Your email password or app password
   - **Sender email**: The email address that will send confirmations
   - **Sender name**: Display name (e.g., "Xelli")

### Recommended SMTP Providers:
- **SendGrid**: Free tier: 100 emails/day
- **Mailgun**: Free tier: 5,000 emails/month
- **AWS SES**: Very affordable, pay-as-you-go
- **Gmail**: Can use app password (not recommended for production)

## 5. Update Users Table Schema

Make sure your `users` table has an `email_verified` column:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_name TEXT;
```

## 6. Test Email Confirmation

1. Sign up a new user through the signup page
2. Check the email inbox (and spam folder)
3. Click the confirmation link
4. Should redirect to `/auth/confirm` and verify the email
5. User should be redirected to profile page

## 7. Troubleshooting

### Emails not sending?
- Check **Authentication** → **Logs** for errors
- Verify SMTP settings if using custom SMTP
- Check spam folder
- Verify redirect URLs are configured correctly

### Confirmation link not working?
- Check that redirect URL matches exactly (including protocol)
- Verify the link hasn't expired (default: 1 hour)
- Check browser console for errors

### User created but email not verified?
- Check that `email_verified` is being updated in the `users` table
- Verify the confirmation handler is working (`/auth/confirm` page)

## 8. Production Checklist

- [ ] Enable email confirmations in Supabase
- [ ] Configure custom SMTP provider
- [ ] Set production redirect URLs
- [ ] Update Site URL to production domain
- [ ] Test email delivery
- [ ] Customize email templates
- [ ] Set up email monitoring/logging
- [ ] Configure email rate limits if needed

## Code Implementation

The signup flow is already implemented in:
- `frontend/app/signup/page.tsx` - Handles user registration
- `frontend/app/auth/check-email/page.tsx` - Shows "check your email" message
- `frontend/app/auth/confirm/page.tsx` - Handles email confirmation

The code automatically:
1. Creates user with Supabase Auth
2. Sends confirmation email
3. Redirects to check-email page
4. Verifies email when link is clicked
5. Updates user profile with verified status



