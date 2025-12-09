-- Migration: Add recipient_user_id to payment_requests table
-- This allows payment requests to be sent to specific users by @username
-- Run this in your Supabase SQL Editor

-- Step 1: Add the recipient_user_id column (nullable for backward compatibility)
ALTER TABLE public.payment_requests 
ADD COLUMN IF NOT EXISTS recipient_user_id uuid;

-- Step 2: Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payment_requests_recipient_user_id_fkey'
  ) THEN
    ALTER TABLE public.payment_requests
    ADD CONSTRAINT payment_requests_recipient_user_id_fkey 
    FOREIGN KEY (recipient_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_recipient_user_id 
ON public.payment_requests(recipient_user_id);



