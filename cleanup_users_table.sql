-- ==============================================================================
-- CLEANUP LEGACY COLUMNS FROM USERS TABLE
-- Removes opinion market statistics that are no longer relevant
-- ==============================================================================
-- ⚠️ BACKUP YOUR DATABASE BEFORE RUNNING THIS! ⚠️
-- ==============================================================================

BEGIN;

-- Remove legacy opinion market statistics columns
ALTER TABLE public.users
  DROP COLUMN IF EXISTS markets_created,
  DROP COLUMN IF EXISTS total_staked,
  DROP COLUMN IF EXISTS total_earnings,
  DROP COLUMN IF EXISTS wins,
  DROP COLUMN IF EXISTS losses;

COMMIT;

-- ==============================================================================
-- VERIFICATION QUERY
-- ==============================================================================

-- Check that legacy columns are gone
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('markets_created', 'total_staked', 'total_earnings', 'wins', 'losses');
-- Should return 0 rows

-- Verify remaining columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;
-- Should show: id, wallet_address, username, email, email_verified, first_name, last_name, 
--              created_at, updated_at, profile_image_url
