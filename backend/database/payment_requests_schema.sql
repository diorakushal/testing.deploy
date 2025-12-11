-- Payment Requests table for Request & Send feature
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_address VARCHAR(255) NOT NULL, -- Wallet address to receive payment
    requester_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Authenticated user who created the request
    amount NUMERIC(20, 6) NOT NULL,
    token_symbol VARCHAR(10) DEFAULT 'USDC',
    token_address VARCHAR(255) NOT NULL,
    chain_id VARCHAR(50) NOT NULL, -- Chain ID (numeric for EVM chains)
    chain_name VARCHAR(50) NOT NULL,
    caption TEXT,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'paid', 'cancelled'
    paid_by VARCHAR(255), -- Address that paid
    tx_hash VARCHAR(255), -- Transaction hash of payment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester ON payment_requests(requester_address);
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester_user_id ON payment_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_tx_hash ON payment_requests(tx_hash);

