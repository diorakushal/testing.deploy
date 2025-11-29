-- Escrow Payments Table
-- Stores escrow-based payments that require recipient acceptance

CREATE TABLE IF NOT EXISTS escrow_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    onchain_id INTEGER NOT NULL, -- Payment ID from smart contract
    sender_address VARCHAR(255) NOT NULL,
    recipient_address VARCHAR(255) NOT NULL,
    chain_id INTEGER NOT NULL, -- 8453 (Base), 1 (Ethereum), 56 (BNB), 137 (Polygon)
    token_address VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(10) DEFAULT 'USDC',
    amount NUMERIC(20, 6) NOT NULL, -- Amount in token's smallest unit (will be converted for display)
    expiry TIMESTAMP, -- NULL = no expiry
    status VARCHAR(20) DEFAULT 'pending', -- pending, claimed, cancelled, expired
    tx_hash_create VARCHAR(255), -- Transaction hash when payment was created
    tx_hash_claim VARCHAR(255), -- Transaction hash when payment was claimed
    tx_hash_cancel VARCHAR(255), -- Transaction hash when payment was cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrow_payments_sender ON escrow_payments(sender_address);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_recipient ON escrow_payments(recipient_address);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_chain ON escrow_payments(chain_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_status ON escrow_payments(status);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_onchain_id_chain ON escrow_payments(onchain_id, chain_id);

-- Add comment
COMMENT ON TABLE escrow_payments IS 'Stores escrow payments that require recipient acceptance before funds are released';

