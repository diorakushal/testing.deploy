-- Preferred Wallets Table
-- Stores user's preferred receiving wallet addresses for each chain

CREATE TABLE IF NOT EXISTS preferred_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chain_id INTEGER NOT NULL, -- 8453 (Base), 1 (Ethereum), 56 (BNB), 137 (Polygon)
    receiving_wallet_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, chain_id) -- One wallet per chain per user
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_preferred_wallets_user ON preferred_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_preferred_wallets_chain ON preferred_wallets(chain_id);
CREATE INDEX IF NOT EXISTS idx_preferred_wallets_user_chain ON preferred_wallets(user_id, chain_id);

-- Add comment
COMMENT ON TABLE preferred_wallets IS 'Stores user preferred receiving wallet addresses for each blockchain network';

