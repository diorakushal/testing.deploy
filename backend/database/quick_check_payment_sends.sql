-- Quick check: See if any payment sends exist
-- Run this first to see if payment sends are being recorded

-- Simple check - just show the most recent payment sends
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
    created_at
FROM payment_sends
ORDER BY created_at DESC
LIMIT 10;

-- If you see results above, payment sends ARE being recorded!
-- If you see no results, payment sends are NOT being created in the database.


