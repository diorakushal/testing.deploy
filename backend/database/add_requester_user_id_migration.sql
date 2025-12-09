-- Migration: Add requester_user_id to payment_requests table
-- This links payment requests to authenticated users (users.id) instead of just wallet addresses
-- Run this in your Supabase SQL Editor

-- Add requester_user_id column (nullable for backward compatibility with existing data)
ALTER TABLE payment_requests 
ADD COLUMN IF NOT EXISTS requester_user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester_user_id ON payment_requests(requester_user_id);

-- Optional: Backfill existing payment requests with user IDs based on wallet_address
-- This will link existing payment requests to users if they have matching wallet_address
UPDATE payment_requests pr
SET requester_user_id = u.id
FROM users u
WHERE pr.requester_address = u.wallet_address
  AND pr.requester_user_id IS NULL;



