-- DIRECT TEST: Try to insert Solana wallet into database
-- This will tell us if the issue is database or backend validation

-- Step 1: Get a real user_id (run this first)
SELECT 
    id AS user_id, 
    username, 
    wallet_address,
    'Use this UUID below' AS instruction
FROM users 
LIMIT 1;

-- Step 2: Replace USER_ID_BELOW with the UUID from Step 1, then run this:
-- (Copy the UUID from Step 1 results and paste it below)

/*
INSERT INTO preferred_wallets (
    user_id,
    chain_id,
    receiving_wallet_address
) VALUES (
    'PASTE_USER_ID_HERE'::uuid,  -- Replace with UUID from Step 1
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

-- If the INSERT above works, the database is fine and the issue is in backend validation
-- If it fails, we'll see the database error

-- Step 3: Check what happens when we query for 'solana' chain_id
SELECT 
    'solana' AS search_chain_id,
    COUNT(*) AS existing_solana_wallets
FROM preferred_wallets
WHERE chain_id = 'solana';

-- Step 4: Compare - can we find integer chain_ids vs string 'solana'?
SELECT 
    chain_id,
    pg_typeof(chain_id) AS data_type,
    COUNT(*) AS count
FROM preferred_wallets
GROUP BY chain_id
ORDER BY chain_id;


