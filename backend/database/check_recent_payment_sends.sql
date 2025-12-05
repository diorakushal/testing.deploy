-- Quick check: See if the payment send was just recorded
-- Run this immediately after sending a payment

-- 1. Show the most recent payment sends (last 10, ordered by most recent first)
SELECT 
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
    caption,
    created_at,
    sent_at,
    confirmed_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) AS seconds_ago
FROM payment_sends
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check payment sends created in the last 5 minutes
SELECT 
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    tx_hash,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 AS minutes_ago
FROM payment_sends
WHERE created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- 3. Count total payment sends
SELECT COUNT(*) AS total_payment_sends FROM payment_sends;

-- 4. Show payment sends with NULL user IDs (might be why they're not showing in feed)
SELECT 
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    tx_hash,
    created_at
FROM payment_sends
WHERE sender_user_id IS NULL OR recipient_user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check for payment sends by specific transaction hash (if you have the TX hash)
-- Replace 'YOUR_TX_HASH_HERE' with the actual transaction hash from your wallet
SELECT 
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    tx_hash,
    created_at
FROM payment_sends
WHERE tx_hash = 'YOUR_TX_HASH_HERE'
ORDER BY created_at DESC;


