-- Test payment sends for user: @kushal_diora
-- This will check if payment sends exist for this user

-- Step 1: Find the user record for @kushal_diora
SELECT 
    id AS user_id,
    username,
    wallet_address,
    email,
    created_at AS user_created_at
FROM users
WHERE username = 'kushal_diora' OR username = '@kushal_diora'
LIMIT 1;

-- Step 2: Check payment sends where this user is the SENDER (by user_id)
-- Replace 'USER_ID_FROM_STEP_1' with the actual user_id from step 1
SELECT 
    'SENDER (by user_id)' AS role,
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    CASE 
        WHEN tx_hash IS NOT NULL THEN LEFT(tx_hash, 20) || '...' || RIGHT(tx_hash, 8)
        ELSE 'No TX hash'
    END AS tx_hash_preview,
    created_at
FROM payment_sends
WHERE sender_user_id = (
    SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1
)
ORDER BY created_at DESC;

-- Step 3: Check payment sends where this user is the RECIPIENT (by user_id)
SELECT 
    'RECIPIENT (by user_id)' AS role,
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    CASE 
        WHEN tx_hash IS NOT NULL THEN LEFT(tx_hash, 20) || '...' || RIGHT(tx_hash, 8)
        ELSE 'No TX hash'
    END AS tx_hash_preview,
    created_at
FROM payment_sends
WHERE recipient_user_id = (
    SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1
)
ORDER BY created_at DESC;

-- Step 4: Check payment sends by wallet address (if user has wallet_address)
SELECT 
    'SENDER (by wallet address)' AS role,
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    CASE 
        WHEN tx_hash IS NOT NULL THEN LEFT(tx_hash, 20) || '...' || RIGHT(tx_hash, 8)
        ELSE 'No TX hash'
    END AS tx_hash_preview,
    created_at
FROM payment_sends
WHERE sender_address = (
    SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1
)
ORDER BY created_at DESC;

-- Step 5: Check payment sends where this user is RECIPIENT (by wallet address)
SELECT 
    'RECIPIENT (by wallet address)' AS role,
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    CASE 
        WHEN tx_hash IS NOT NULL THEN LEFT(tx_hash, 20) || '...' || RIGHT(tx_hash, 8)
        ELSE 'No TX hash'
    END AS tx_hash_preview,
    created_at
FROM payment_sends
WHERE recipient_address = (
    SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1
)
ORDER BY created_at DESC;

-- Step 6: Combined view - ALL payment sends for this user (sender OR recipient, by user_id OR wallet)
SELECT 
    CASE 
        WHEN sender_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1) 
            OR sender_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
        THEN 'SENT'
        ELSE 'RECEIVED'
    END AS direction,
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    CASE 
        WHEN tx_hash IS NOT NULL THEN LEFT(tx_hash, 20) || '...' || RIGHT(tx_hash, 8)
        ELSE 'No TX hash'
    END AS tx_hash_preview,
    created_at
FROM payment_sends
WHERE 
    sender_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
    OR recipient_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
    OR sender_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
    OR recipient_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
ORDER BY created_at DESC;

-- Step 7: Summary for this user
SELECT 
    COUNT(*) AS total_payment_sends,
    COUNT(CASE WHEN sender_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1) 
               OR sender_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1) 
          THEN 1 END) AS sent_count,
    COUNT(CASE WHEN recipient_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1) 
               OR recipient_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1) 
          THEN 1 END) AS received_count,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count
FROM payment_sends
WHERE 
    sender_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
    OR recipient_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
    OR sender_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
    OR recipient_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1);



