# Payment Requests User Account Migration

## Overview

Payment requests are now linked to authenticated user accounts (usernames) instead of just wallet addresses. When a user signs into the website, they will see their payment requests because they are connected to their website account (not just their connected wallet ID).

## Changes Made

### 1. Database Schema Updates

- Added `requester_user_id` column to `payment_requests` table
- This column references `users.id` (from Supabase auth)
- Payment requests are now linked to authenticated user accounts

### 2. Backend API Updates

- **POST `/api/payment-requests`**: Now accepts `requesterUserId` parameter and stores it
- **GET `/api/payment-requests`**: 
  - Accepts `requester_user_id` query parameter to filter by authenticated user
  - Fetches usernames using `requester_user_id` (preferred) or falls back to `wallet_address`
- **GET `/api/payment-requests/:id`**: Updated to fetch username by user ID

### 3. Frontend Updates

- **CreatePaymentRequestComposer**: Now passes authenticated user ID when creating payment requests
- **Feed Page**: Filters payment requests by authenticated user's ID (shows only their requests)
- **PaymentRequestCard**: Displays username (e.g., `@kushal`) instead of wallet address when available

## Migration Steps

### Step 1: Run Database Migration

Run the migration SQL in your Supabase SQL Editor:

```sql
-- Add requester_user_id column
ALTER TABLE payment_requests 
ADD COLUMN IF NOT EXISTS requester_user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester_user_id ON payment_requests(requester_user_id);

-- Optional: Backfill existing payment requests with user IDs based on wallet_address
UPDATE payment_requests pr
SET requester_user_id = u.id
FROM users u
WHERE pr.requester_address = u.wallet_address
  AND pr.requester_user_id IS NULL;
```

Or run the migration file:
```bash
# In Supabase SQL Editor, paste the contents of:
backend/database/add_requester_user_id_migration.sql
```

### Step 2: Restart Backend Server

After running the migration, restart your backend server to pick up the changes:

```bash
cd backend
# Stop the current server if running
# Then restart it
npm start
```

### Step 3: Test the Changes

1. **Create a new payment request** while logged in
   - The request should be linked to your user account
   - It should appear in your feed

2. **View your feed**
   - You should only see payment requests you created
   - They should display your username (e.g., `@kushal`) instead of wallet address

3. **Check existing payment requests**
   - Existing requests will be backfilled with user IDs if they match wallet addresses in the users table
   - New requests will automatically be linked to user accounts

## How It Works

1. **Creating Payment Requests**:
   - User signs in with their website account (Supabase auth)
   - When creating a payment request, the frontend gets the authenticated user's ID
   - The backend stores both `requester_address` (wallet to receive payment) and `requester_user_id` (authenticated user account)

2. **Viewing Payment Requests**:
   - When a user signs in, the feed page filters payment requests by their `requester_user_id`
   - Payment requests display the username (e.g., `@kushal`) when available
   - Falls back to wallet address if username is not found

3. **Username Display**:
   - Backend fetches usernames from the `users` table using `requester_user_id` (preferred)
   - Falls back to fetching by `wallet_address` for backward compatibility
   - Frontend displays `@username` if available, otherwise shows formatted wallet address

## Benefits

- ✅ Payment requests are linked to user accounts, not just wallet addresses
- ✅ Users see their own payment requests when they sign in
- ✅ Payment requests display usernames (e.g., `@kushal`) instead of wallet addresses
- ✅ Works with multiple wallets - payment requests are tied to the account, not the wallet
- ✅ Backward compatible - existing requests still work

## Files Modified

- `backend/database/payment_requests_schema.sql` - Added `requester_user_id` column
- `backend/database/add_requester_user_id_migration.sql` - Migration script
- `COMPLETE_SUPABASE_SCHEMA.sql` - Updated schema
- `backend/server.js` - Updated API endpoints
- `frontend/components/CreatePaymentRequestComposer.tsx` - Passes user ID
- `frontend/app/feed/page.tsx` - Filters by user ID
- `frontend/components/PaymentRequestCard.tsx` - Displays username



