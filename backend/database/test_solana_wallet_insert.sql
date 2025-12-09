-- Test inserting Solana wallet address into preferred_wallets table
-- Address: AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a

-- First, let's check the address properties
SELECT 
    'AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a' AS solana_address,
    LENGTH('AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a') AS address_length,
    CASE 
        WHEN LENGTH('AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a') >= 32 
         AND LENGTH('AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a') <= 44 
        THEN 'Valid length'
        ELSE 'Invalid length'
    END AS length_check,
    CASE 
        WHEN 'AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a' ~ '^[A-Za-z0-9]+$' 
        THEN 'Valid base58 characters'
        ELSE 'Invalid characters'
    END AS character_check,
    CASE 
        WHEN 'AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a' LIKE '0x%' 
        THEN 'Starts with 0x (EVM format)'
        ELSE 'Does not start with 0x (Solana format)'
    END AS format_check;

-- Check table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'preferred_wallets'
ORDER BY ordinal_position;

-- Test insert (replace 'YOUR_USER_ID_HERE' with an actual user_id from your users table)
-- First, let's get a sample user_id
SELECT id AS sample_user_id FROM users LIMIT 1;

-- Now test the insert (uncomment and replace USER_ID with actual UUID)
/*
INSERT INTO preferred_wallets (
    user_id,
    chain_id,
    receiving_wallet_address
) VALUES (
    'YOUR_USER_ID_HERE'::uuid,  -- Replace with actual user_id
    'solana',
    'AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a'
)
RETURNING *;
*/

-- Test with a dummy UUID (this will fail foreign key check but tests the data types)
-- Uncomment to test:
/*
INSERT INTO preferred_wallets (
    user_id,
    chain_id,
    receiving_wallet_address
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,  -- Dummy UUID for testing
    'solana',
    'AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a'
)
RETURNING *;
*/

-- Check if chain_id can store 'solana'
SELECT 
    'solana' AS test_chain_id,
    pg_typeof('solana') AS data_type,
    LENGTH('solana') AS length,
    CASE 
        WHEN 'solana'::varchar = 'solana' 
        THEN 'Can store solana'
        ELSE 'Cannot store solana'
    END AS test_result;

-- Check existing preferred_wallets to see format
SELECT 
    id,
    user_id,
    chain_id,
    receiving_wallet_address,
    LENGTH(receiving_wallet_address) AS address_length,
    created_at
FROM preferred_wallets
ORDER BY created_at DESC
LIMIT 5;



