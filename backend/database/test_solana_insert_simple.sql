-- Simple test to check if Solana wallet can be inserted
-- Run this in your database to test

-- 1. Check address length and format
SELECT 
    'AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a' AS address,
    LENGTH('AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a') AS length,
    CASE 
        WHEN LENGTH('AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a') BETWEEN 32 AND 44 
        THEN '✅ Valid length (32-44)'
        ELSE '❌ Invalid length'
    END AS length_status;

-- 2. Get a real user_id to test with
SELECT id AS user_id, username, wallet_address 
FROM users 
LIMIT 1;

-- 3. Test insert (replace USER_ID_HERE with actual UUID from step 2)
-- Uncomment and run with a real user_id:
/*
INSERT INTO preferred_wallets (
    user_id,
    chain_id,
    receiving_wallet_address
) VALUES (
    'USER_ID_HERE'::uuid,  -- Replace with actual user_id from step 2
    'solana',
    'AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a'
)
RETURNING 
    id,
    user_id,
    chain_id,
    receiving_wallet_address,
    LENGTH(receiving_wallet_address) AS address_length,
    created_at;
*/

-- 4. Check if insertion would work (without actually inserting)
-- This tests the UNIQUE constraint
SELECT 
    'solana' AS chain_id,
    'AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a' AS address,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM preferred_wallets 
            WHERE chain_id = 'solana' 
            AND receiving_wallet_address = 'AMMmQjhgkA8nYVMuU48kM5pTg2MjkjVW6h5rB7eKCH6a'
        ) 
        THEN '⚠️  Address already exists'
        ELSE '✅ Address can be inserted'
    END AS insert_status;

-- 5. Check column constraints
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'preferred_wallets'
AND column_name IN ('chain_id', 'receiving_wallet_address');



