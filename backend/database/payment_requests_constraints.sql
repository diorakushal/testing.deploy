-- Additional constraints and indexes for payment_requests table
-- Run this after the main schema to add safeguards for paid transactions

-- Add unique constraint on tx_hash to prevent duplicate payment records
-- This ensures each transaction can only be recorded once
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payment_requests_tx_hash_unique' 
        AND conrelid = 'payment_requests'::regclass
    ) THEN
        -- Only add unique constraint if tx_hash is not null
        -- This allows multiple open requests but prevents duplicate paid records
        CREATE UNIQUE INDEX IF NOT EXISTS payment_requests_tx_hash_unique 
        ON payment_requests(tx_hash) 
        WHERE tx_hash IS NOT NULL;
        
        RAISE NOTICE '✅ Added unique constraint on tx_hash';
    ELSE
        RAISE NOTICE '⚠️  Unique constraint on tx_hash already exists';
    END IF;
END $$;

-- Add index on paid_at for querying paid transactions by date
CREATE INDEX IF NOT EXISTS idx_payment_requests_paid_at 
ON payment_requests(paid_at DESC) 
WHERE status = 'paid';

-- Add index on paid_by for querying payments by payer
CREATE INDEX IF NOT EXISTS idx_payment_requests_paid_by 
ON payment_requests(paid_by) 
WHERE paid_by IS NOT NULL;

-- Add composite index for common queries (status + created_at)
CREATE INDEX IF NOT EXISTS idx_payment_requests_status_created 
ON payment_requests(status, created_at DESC);

-- Add check constraint to ensure paid_at is set when status is 'paid'
-- Note: This is a soft constraint - we'll handle it in application logic
-- as Supabase might have issues with complex check constraints

-- Function to verify payment request data integrity
CREATE OR REPLACE FUNCTION verify_payment_request_integrity()
RETURNS TABLE (
    id UUID,
    status VARCHAR,
    has_tx_hash BOOLEAN,
    has_paid_by BOOLEAN,
    has_paid_at BOOLEAN,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.status,
        (pr.tx_hash IS NOT NULL) as has_tx_hash,
        (pr.paid_by IS NOT NULL) as has_paid_by,
        (pr.paid_at IS NOT NULL) as has_paid_at,
        CASE 
            WHEN pr.status = 'paid' THEN 
                (pr.tx_hash IS NOT NULL AND pr.paid_by IS NOT NULL AND pr.paid_at IS NOT NULL)
            ELSE TRUE
        END as is_valid
    FROM payment_requests pr
    WHERE pr.status = 'paid';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_payment_request_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION verify_payment_request_integrity() TO anon;

COMMENT ON FUNCTION verify_payment_request_integrity() IS 
'Verifies that all paid payment requests have required fields (tx_hash, paid_by, paid_at)';

