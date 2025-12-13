-- ==============================================================================
-- CLEANUP LEGACY OPINION MARKET TABLES
-- Removes unused tables, triggers, and functions from old opinion market platform
-- Since pivot to Blockbook (crypto payment platform)
-- ==============================================================================
-- ⚠️ BACKUP YOUR DATABASE BEFORE RUNNING THIS! ⚠️
-- ==============================================================================

BEGIN;

-- 1) Drop triggers that reference stakes table
DROP TRIGGER IF EXISTS trigger_update_market_totals ON public.stakes;
DROP TRIGGER IF EXISTS trigger_update_user_stats ON public.stakes;

-- 2) Drop functions that reference stakes/markets tables
DROP FUNCTION IF EXISTS public.update_market_totals_on_stake() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_stats_on_claim() CASCADE;
DROP FUNCTION IF EXISTS public.get_market_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_leaderboard(INTEGER) CASCADE;

-- 3) Remove legacy opinion market tables (order matters due to foreign keys)
-- Drop child tables first (they reference markets)
DROP TABLE IF EXISTS public.stakes CASCADE;
DROP TABLE IF EXISTS public.market_payouts CASCADE;
DROP TABLE IF EXISTS public.user_payouts CASCADE;
-- Drop parent table last
DROP TABLE IF EXISTS public.markets CASCADE;

-- 4) Remove unused / redundant columns in payment_requests
ALTER TABLE public.payment_requests
  DROP COLUMN IF EXISTS wallet_type,
  DROP COLUMN IF EXISTS requester_wallet;

COMMIT;

-- ==============================================================================
-- VERIFICATION QUERIES (Run after cleanup to verify)
-- ==============================================================================

-- Check that legacy tables are gone
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('stakes', 'markets', 'market_payouts', 'user_payouts');
-- Should return 0 rows

-- Check that unused columns are gone
SELECT column_name, table_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'payment_requests'
AND column_name IN ('wallet_type', 'requester_wallet');
-- Should return 0 rows

-- Verify active tables still exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'payment_requests', 'payment_sends', 'contacts', 'preferred_wallets');
-- Should return 5 rows
