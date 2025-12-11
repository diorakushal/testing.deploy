# Auth State Management Changes

## Overview
This document outlines the changes made to ensure proper synchronization between Supabase Auth (`auth.users`) and the public `users` table.

## Problem
When users authenticate via Supabase Auth, their record in `auth.users` is created, but there's no guarantee that a corresponding record exists in the `public.users` table. This can cause issues when:
- Users log in but their profile doesn't exist in `public.users`
- Email verification status isn't synced
- Wallet addresses aren't linked to user records
- Foreign key relationships fail (payment_requests, payment_sends, etc.)

## Solution

### 1. Created Auth Utility Functions (`frontend/lib/auth-utils.ts`)

#### `ensureUserRecord(authUser: User)`
- **Purpose**: Ensures a user record exists in `public.users` table
- **Behavior**:
  - Checks if user record exists
  - Creates record if missing (with data from `auth.users` and `user_metadata`)
  - Updates existing record with latest email verification status and metadata
- **Called**: Automatically on every auth state change

#### `updateUserWalletAddress(userId: string, walletAddress: string)`
- **Purpose**: Updates wallet address in both `public.users` and auth metadata
- **Use case**: When user connects wallet, syncs address to database

### 2. Updated Auth State Handlers

#### Feed Page (`frontend/app/feed/page.tsx`)
- Added `ensureUserRecord()` call after successful auth check
- Ensures user record exists before fetching payment data

#### Pay Request Page (`frontend/app/pay-request/page.tsx`)
- Added `ensureUserRecord()` call after successful auth check
- Ensures user record exists before rendering page

#### Header Component (`frontend/components/Header.tsx`)
- Added `ensureUserRecord()` call in `onAuthStateChange` handler
- Ensures user record exists whenever auth state changes

#### Login Page (`frontend/app/login/page.tsx`)
- Added `ensureUserRecord()` call after successful login
- Ensures user record exists before redirecting

## Database Schema Requirements

### Users Table
The `public.users` table must have:
- `id` UUID PRIMARY KEY (references `auth.users(id)`)
- `email` VARCHAR
- `email_verified` BOOLEAN
- `first_name` VARCHAR (nullable)
- `last_name` VARCHAR (nullable)
- `username` VARCHAR (nullable, unique)
- `wallet_address` VARCHAR (nullable, unique)
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

### Database Trigger (Optional but Recommended)
The schema includes a trigger `handle_new_user()` that automatically creates user records when auth users are created. However, the frontend utility ensures records exist even if:
- The trigger wasn't set up
- The trigger failed
- User was created before trigger existed
- User logged in via OAuth (which might bypass trigger)

## How It Works

### Flow Diagram
```
User Logs In
    ↓
Supabase Auth creates/updates auth.users
    ↓
onAuthStateChange fires
    ↓
ensureUserRecord() called
    ↓
Check if record exists in public.users
    ↓
If missing → Create with auth data
If exists → Update email_verified, metadata
    ↓
Continue with normal app flow
```

### Data Sync
The utility syncs:
- ✅ Email and email verification status
- ✅ First name, last name, username from `user_metadata`
- ✅ Wallet address from `user_metadata`
- ✅ Updated timestamp

## Benefits

1. **Reliability**: User records always exist when authenticated
2. **Data Consistency**: Email verification status stays in sync
3. **Foreign Key Integrity**: Payment requests/sends can reference user_id
4. **Backward Compatibility**: Works even if database trigger is missing
5. **Wallet Linking**: Automatically syncs wallet addresses

## Testing

To verify the changes work:

1. **New User Signup**:
   - Sign up with email
   - Check `public.users` table - record should exist
   - Verify email, username, first_name, last_name are set

2. **Existing User Login**:
   - Log in with existing account
   - Check `public.users` table - record should exist/update
   - Verify `email_verified` matches auth status

3. **Email Verification**:
   - Confirm email in Supabase
   - Log in again
   - Check `public.users.email_verified` is `true`

4. **Wallet Connection**:
   - Connect wallet
   - Check `public.users.wallet_address` is set
   - Check auth `user_metadata.wallet_address` is set

## Migration Notes

If you have existing users in `auth.users` but not in `public.users`:

1. The utility will automatically create records when they log in
2. Or run this SQL to create records for all existing auth users:

```sql
INSERT INTO public.users (id, email, email_verified, first_name, last_name, username)
SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL,
    raw_user_meta_data->>'first_name',
    raw_user_meta_data->>'last_name',
    raw_user_meta_data->>'username'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

## Future Enhancements

- [ ] Add retry logic for failed record creation
- [ ] Add logging/metrics for record creation failures
- [ ] Handle edge cases (deleted users, orphaned records)
- [ ] Add admin function to sync all existing users



