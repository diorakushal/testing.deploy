# Supabase Production Configuration for Email Notifications

## Important Note

**Payment notification emails** (payment sent, payment received, request created, request fulfilled) are sent by the **backend using Resend**. These do **NOT** require Supabase configuration.

However, **email verification links** (for signup/login) are sent by Supabase Auth, so you need to configure Supabase redirect URLs for production.

---

## ✅ What You NEED to Update in Supabase

### 1. Configure Redirect URLs for Production

Supabase sends email verification links that redirect to your frontend. You need to add your production domain.

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd
2. Navigate to **Authentication** → **URL Configuration**
3. Set **"Site URL"** to your production frontend URL:
   - Example: `https://your-app.vercel.app` or `https://block-book.com`
4. Add **"Redirect URLs"**:
   - `http://localhost:3000/auth/confirm` (for local development)
   - `https://your-app.vercel.app/auth/confirm` (for production - **REPLACE WITH YOUR ACTUAL VERCEL URL**)
   - `https://block-book.com/auth/confirm` (if you have a custom domain)

### 2. Verify Users Table Has Email Column

Your database schema already includes the `email` column in the `users` table, which is required for sending payment notifications. Verify it exists:

1. Go to **Table Editor** → **users**
2. Confirm these columns exist:
   - ✅ `email` (VARCHAR)
   - ✅ `email_verified` (BOOLEAN)
   - ✅ `first_name` (VARCHAR)
   - ✅ `last_name` (VARCHAR)

If these are missing, run this SQL in the **SQL Editor**:

```sql
-- Add email column if missing
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add email_verified column if missing
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add name columns if missing
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
```

### 3. (Optional) Custom SMTP for Supabase Auth Emails

If you want to use a custom email provider for Supabase's authentication emails (signup verification, password reset, etc.):

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Configure your SMTP provider (you can use the same Resend SMTP if you want)

**Note**: This is separate from payment notification emails. Payment notifications are handled by the backend using Resend's API, not SMTP.

---

## ❌ What You DON'T Need to Change

- ✅ Database schema - already has `email` column
- ✅ API keys - Supabase keys are already configured
- ✅ Email templates - payment notifications don't use Supabase templates
- ✅ Row Level Security (RLS) - not needed for email notifications

---

## 🧪 Testing Checklist

After updating Supabase redirect URLs:

1. **Test Email Verification in Production**:
   - Sign up a new user on production
   - Check email for verification link
   - Click link - should redirect to `/auth/confirm` on your production domain
   - Should complete onboarding flow

2. **Test Payment Notifications**:
   - Create a payment request on production
   - Verify recipient receives email (sent via Resend backend)
   - Make a payment
   - Verify both sender and recipient receive emails

---

## Summary

**For Email Notifications:**
- ✅ Backend already configured with Resend (Render)
- ✅ Frontend already configured (Vercel - just needs environment variables)
- ⚠️ **Supabase**: Only needs redirect URLs updated for production domain

**Action Required:**
1. Update Supabase redirect URLs to include your production domain
2. Verify `users.email` column exists (should already exist)
3. Test email verification flow in production

---

## Quick Reference

- **Supabase Dashboard**: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd
- **Authentication Settings**: Authentication → URL Configuration
- **Redirect URLs Section**: Add your production `/auth/confirm` URL

