-- Migration: Add missing constraints and indexes to preferred_wallets table
-- Run this if the table already exists but is missing constraints/indexes

-- Add UNIQUE constraint to ensure one wallet per chain per user
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'preferred_wallets_user_id_chain_id_key'
    ) THEN
        ALTER TABLE preferred_wallets 
        ADD CONSTRAINT preferred_wallets_user_id_chain_id_key 
        UNIQUE (user_id, chain_id);
    END IF;
END $$;

-- Add indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_preferred_wallets_user ON preferred_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_preferred_wallets_chain ON preferred_wallets(chain_id);
CREATE INDEX IF NOT EXISTS idx_preferred_wallets_user_chain ON preferred_wallets(user_id, chain_id);

