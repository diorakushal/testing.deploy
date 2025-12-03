-- Migration: Remove unused escrow-related tables
-- These tables are no longer needed after switching to direct send payments
-- Run this script to clean up the database

-- ============================================
-- STEP 1: Drop escrow_payments table
-- ============================================
-- First, drop foreign key constraints (if they exist)
DO $$ 
BEGIN
    -- Drop foreign key constraints
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'escrow_payments_sender_user_id_fkey'
        AND conrelid = 'escrow_payments'::regclass
    ) THEN
        ALTER TABLE escrow_payments DROP CONSTRAINT escrow_payments_sender_user_id_fkey;
        RAISE NOTICE '✅ Dropped escrow_payments_sender_user_id_fkey constraint';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'escrow_payments_recipient_user_id_fkey'
        AND conrelid = 'escrow_payments'::regclass
    ) THEN
        ALTER TABLE escrow_payments DROP CONSTRAINT escrow_payments_recipient_user_id_fkey;
        RAISE NOTICE '✅ Dropped escrow_payments_recipient_user_id_fkey constraint';
    END IF;
END $$;

-- Drop the table
DROP TABLE IF EXISTS escrow_payments CASCADE;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'escrow_payments') THEN
        RAISE NOTICE '✅ Dropped escrow_payments table';
    ELSE
        RAISE NOTICE '⚠️  escrow_payments table still exists';
    END IF;
END $$;

-- ============================================
-- STEP 2: Drop payment_intents table
-- ============================================
-- First, drop foreign key constraints (if they exist)
DO $$ 
BEGIN
    -- Drop foreign key constraints
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payment_intents_from_user_id_fkey'
        AND conrelid = 'payment_intents'::regclass
    ) THEN
        ALTER TABLE payment_intents DROP CONSTRAINT payment_intents_from_user_id_fkey;
        RAISE NOTICE '✅ Dropped payment_intents_from_user_id_fkey constraint';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payment_intents_to_user_id_fkey'
        AND conrelid = 'payment_intents'::regclass
    ) THEN
        ALTER TABLE payment_intents DROP CONSTRAINT payment_intents_to_user_id_fkey;
        RAISE NOTICE '✅ Dropped payment_intents_to_user_id_fkey constraint';
    END IF;
END $$;

-- Drop the table
DROP TABLE IF EXISTS payment_intents CASCADE;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_intents') THEN
        RAISE NOTICE '✅ Dropped payment_intents table';
    ELSE
        RAISE NOTICE '⚠️  payment_intents table still exists';
    END IF;
END $$;

-- ============================================
-- VERIFICATION: Check remaining tables
-- ============================================
-- List all payment-related tables to verify cleanup
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'payment_requests',
        'payment_sends',
        'preferred_wallets',
        'escrow_payments',
        'payment_intents'
    )
ORDER BY table_name;

-- Expected result: Only payment_requests, payment_sends, and preferred_wallets should remain
-- escrow_payments and payment_intents should be gone

