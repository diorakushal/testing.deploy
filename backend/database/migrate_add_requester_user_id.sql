-- Migration: Add requester_user_id to existing payment_requests table
-- Run this in your Supabase SQL Editor

-- Step 1: Add the requester_user_id column (nullable for backward compatibility)
ALTER TABLE public.payment_requests 
ADD COLUMN IF NOT EXISTS requester_user_id uuid;

-- Step 2: Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payment_requests_requester_user_id_fkey'
  ) THEN
    ALTER TABLE public.payment_requests
    ADD CONSTRAINT payment_requests_requester_user_id_fkey 
    FOREIGN KEY (requester_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester_user_id 
ON public.payment_requests(requester_user_id);

-- Step 4: Optional - Backfill existing payment requests with user IDs based on wallet_address
-- This will link existing payment requests to users if they have matching wallet_address
UPDATE public.payment_requests pr
SET requester_user_id = u.id
FROM public.users u
WHERE pr.requester_address = u.wallet_address
  AND pr.requester_user_id IS NULL;



