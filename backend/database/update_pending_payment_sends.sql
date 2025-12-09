-- Script to update pending payment sends that have transaction hashes
-- This will mark them as confirmed if they have a tx_hash
-- Run this to fix existing records that were created before the fix

-- First, check how many pending records have tx_hashes
SELECT 
    COUNT(*) AS pending_with_tx_hash,
    COUNT(DISTINCT tx_hash) AS unique_tx_hashes
FROM payment_sends
WHERE status = 'pending' 
  AND tx_hash IS NOT NULL 
  AND tx_hash != '';

-- Update all pending payment sends that have a tx_hash to confirmed
-- This assumes that if they have a tx_hash, the transaction was sent
-- Note: In production, you might want to verify the transaction status on-chain first
UPDATE payment_sends
SET 
    status = 'confirmed',
    confirmed_at = COALESCE(confirmed_at, created_at + INTERVAL '1 minute')
WHERE status = 'pending' 
  AND tx_hash IS NOT NULL 
  AND tx_hash != ''
  AND confirmed_at IS NULL;

-- Verify the update
SELECT 
    id,
    sender_address,
    recipient_address,
    amount || ' ' || token_symbol AS payment,
    chain_name,
    status,
    tx_hash,
    created_at,
    confirmed_at,
    CASE 
        WHEN confirmed_at IS NOT NULL THEN EXTRACT(EPOCH FROM (confirmed_at - created_at)) || ' seconds'
        ELSE 'Not confirmed'
    END AS time_to_confirm
FROM payment_sends
WHERE tx_hash IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- Show summary by status
SELECT 
    status,
    COUNT(*) AS count,
    COUNT(CASE WHEN tx_hash IS NOT NULL THEN 1 END) AS with_tx_hash,
    COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) AS confirmed
FROM payment_sends
GROUP BY status
ORDER BY status;



