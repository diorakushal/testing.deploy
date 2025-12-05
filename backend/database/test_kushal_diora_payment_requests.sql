-- Test payment requests for user: @kushal_diora
-- This will check if payment requests exist for this user

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

-- Step 2: Check payment requests where this user is the REQUESTER (by user_id)
SELECT 
    'REQUESTER (by user_id)' AS role,
    id,
    requester_address,
    requester_user_id,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    paid_by,
    CASE 
        WHEN tx_hash IS NOT NULL THEN LEFT(tx_hash, 20) || '...' || RIGHT(tx_hash, 8)
        ELSE 'No TX hash'
    END AS tx_hash_preview,
    caption,
    created_at,
    paid_at
FROM payment_requests
WHERE requester_user_id = (
    SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1
)
ORDER BY created_at DESC;

-- Step 3: Check payment requests where this user is the RECIPIENT (by user_id)
SELECT 
    'RECIPIENT (by user_id)' AS role,
    id,
    requester_address,
    requester_user_id,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    paid_by,
    CASE 
        WHEN tx_hash IS NOT NULL THEN LEFT(tx_hash, 20) || '...' || RIGHT(tx_hash, 8)
        ELSE 'No TX hash'
    END AS tx_hash_preview,
    caption,
    created_at,
    paid_at
FROM payment_requests
WHERE recipient_user_id = (
    SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1
)
ORDER BY created_at DESC;

-- Step 4: Check payment requests by requester wallet address (if user has wallet_address)
SELECT 
    'REQUESTER (by wallet address)' AS role,
    id,
    requester_address,
    requester_user_id,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    paid_by,
    CASE 
        WHEN tx_hash IS NOT NULL THEN LEFT(tx_hash, 20) || '...' || RIGHT(tx_hash, 8)
        ELSE 'No TX hash'
    END AS tx_hash_preview,
    caption,
    created_at,
    paid_at
FROM payment_requests
WHERE requester_address = (
    SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1
)
ORDER BY created_at DESC;

-- Step 5: Combined view - ALL payment requests for this user (requester OR recipient, by user_id OR wallet)
SELECT 
    CASE 
        WHEN requester_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1) 
            OR requester_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
        THEN 'REQUESTED'
        ELSE 'RECEIVED_REQUEST'
    END AS direction,
    id,
    requester_address,
    requester_user_id,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    paid_by,
    CASE 
        WHEN tx_hash IS NOT NULL THEN LEFT(tx_hash, 20) || '...' || RIGHT(tx_hash, 8)
        ELSE 'No TX hash'
    END AS tx_hash_preview,
    caption,
    created_at,
    paid_at
FROM payment_requests
WHERE 
    requester_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
    OR recipient_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
    OR requester_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
ORDER BY created_at DESC;

-- Step 6: Summary for this user
SELECT 
    COUNT(*) AS total_payment_requests,
    COUNT(CASE WHEN requester_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1) 
               OR requester_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1) 
          THEN 1 END) AS requested_count,
    COUNT(CASE WHEN recipient_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1) 
          THEN 1 END) AS received_request_count,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
    COUNT(CASE WHEN status = 'open' THEN 1 END) AS open_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_count
FROM payment_requests
WHERE 
    requester_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
    OR recipient_user_id = (SELECT id FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1)
    OR requester_address = (SELECT wallet_address FROM users WHERE username = 'kushal_diora' OR username = '@kushal_diora' LIMIT 1);

-- Step 7: Show all payment requests (regardless of user) - to see if ANY requests exist
SELECT 
    id,
    requester_address,
    requester_user_id,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    paid_by,
    CASE 
        WHEN tx_hash IS NOT NULL THEN LEFT(tx_hash, 20) || '...' || RIGHT(tx_hash, 8)
        ELSE 'No TX hash'
    END AS tx_hash_preview,
    caption,
    created_at,
    paid_at
FROM payment_requests
ORDER BY created_at DESC
LIMIT 20;

-- Step 8: Count all payment requests in database
SELECT 
    COUNT(*) AS total_requests_in_database,
    COUNT(DISTINCT requester_user_id) AS unique_requesters,
    COUNT(DISTINCT recipient_user_id) AS unique_recipients,
    COUNT(DISTINCT requester_address) AS unique_requester_addresses
FROM payment_requests;


