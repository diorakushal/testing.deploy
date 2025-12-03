-- Verify preferred_wallets constraints and indexes
-- Run this to check if all constraints are in place

-- Check for UNIQUE constraint
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'preferred_wallets'::regclass
AND contype = 'u'
ORDER BY conname;

-- Check for indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'preferred_wallets'
ORDER BY indexname;

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'preferred_wallets'
ORDER BY ordinal_position;

