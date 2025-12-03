-- Test script to check if payment sends are being recorded in the database
-- Run this in your database to see all payment sends

-- 1. Count total payment sends
SELECT 
    COUNT(*) AS total_payment_sends,
    COUNT(DISTINCT sender_user_id) AS unique_senders,
    COUNT(DISTINCT recipient_user_id) AS unique_recipients,
    COUNT(DISTINCT sender_address) AS unique_sender_addresses,
    COUNT(DISTINCT recipient_address) AS unique_recipient_addresses
FROM payment_sends;

-- 2. Show all payment sends (most recent first)
SELECT 
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount,
    token_symbol,
    chain_id,
    chain_name,
    status,
    tx_hash,
    caption,
    created_at,
    sent_at,
    confirmed_at
FROM payment_sends
ORDER BY created_at DESC
LIMIT 20;

-- 3. Show payment sends with user info (if available)
SELECT 
    ps.id,
    ps.sender_address,
    ps.sender_user_id,
    sender_user.username AS sender_username,
    ps.recipient_address,
    ps.recipient_user_id,
    recipient_user.username AS recipient_username,
    ps.amount,
    ps.token_symbol,
    ps.chain_name,
    ps.status,
    ps.tx_hash,
    ps.created_at
FROM payment_sends ps
LEFT JOIN users sender_user ON ps.sender_user_id = sender_user.id
LEFT JOIN users recipient_user ON ps.recipient_user_id = recipient_user.id
ORDER BY ps.created_at DESC
LIMIT 20;

-- 4. Check for payment sends with specific transaction hash
-- Replace 'YOUR_TX_HASH' with an actual transaction hash
SELECT 
    id,
    sender_address,
    recipient_address,
    amount,
    token_symbol,
    chain_name,
    status,
    tx_hash,
    created_at
FROM payment_sends
WHERE tx_hash = 'YOUR_TX_HASH_HERE'
ORDER BY created_at DESC;

-- 5. Check payment sends by sender address
-- Replace 'YOUR_SENDER_ADDRESS' with an actual wallet address
SELECT 
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount,
    token_symbol,
    chain_name,
    status,
    tx_hash,
    created_at
FROM payment_sends
WHERE sender_address = 'YOUR_SENDER_ADDRESS_HERE'
ORDER BY created_at DESC;

-- 6. Check payment sends by recipient address
-- Replace 'YOUR_RECIPIENT_ADDRESS' with an actual wallet address
SELECT 
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount,
    token_symbol,
    chain_name,
    status,
    tx_hash,
    created_at
FROM payment_sends
WHERE recipient_address = 'YOUR_RECIPIENT_ADDRESS_HERE'
ORDER BY created_at DESC;

-- 7. Check payment sends by user ID
-- Replace 'YOUR_USER_ID' with an actual user UUID
SELECT 
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount,
    token_symbol,
    chain_name,
    status,
    tx_hash,
    created_at
FROM payment_sends
WHERE sender_user_id = 'YOUR_USER_ID_HERE'::uuid
   OR recipient_user_id = 'YOUR_USER_ID_HERE'::uuid
ORDER BY created_at DESC;

-- 8. Summary by status
SELECT 
    status,
    COUNT(*) AS count,
    SUM(amount) AS total_amount,
    MIN(created_at) AS earliest,
    MAX(created_at) AS latest
FROM payment_sends
GROUP BY status
ORDER BY count DESC;

-- 9. Check for payment sends with NULL user IDs (might be why they're not showing in feed)
SELECT 
    id,
    sender_address,
    sender_user_id,
    recipient_address,
    recipient_user_id,
    amount,
    token_symbol,
    chain_name,
    status,
    tx_hash,
    created_at,
    CASE 
        WHEN sender_user_id IS NULL THEN 'Missing sender_user_id'
        WHEN recipient_user_id IS NULL THEN 'Missing recipient_user_id'
        ELSE 'Both user IDs present'
    END AS issue
FROM payment_sends
WHERE sender_user_id IS NULL OR recipient_user_id IS NULL
ORDER BY created_at DESC;

-- 10. Get all users and their wallet addresses (to help match payment sends)
SELECT 
    id,
    username,
    wallet_address,
    email,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;

