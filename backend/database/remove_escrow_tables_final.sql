-- Final SQL to remove unused escrow tables
-- Run this in your database (Supabase SQL Editor or psql)

-- Remove escrow_payments table
DROP TABLE IF EXISTS escrow_payments CASCADE;

-- Remove payment_intents table  
DROP TABLE IF EXISTS payment_intents CASCADE;

-- Verify removal (optional - run separately to check)
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('escrow_payments', 'payment_intents');



