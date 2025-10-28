-- PostgreSQL Database Schema for Opinion Market Platform

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    markets_created INTEGER DEFAULT 0,
    total_staked NUMERIC(20, 6) DEFAULT 0,
    total_earnings NUMERIC(20, 6) DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_address VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    agree_label VARCHAR(100) DEFAULT 'Agree',
    disagree_label VARCHAR(100) DEFAULT 'Disagree',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP NOT NULL,
    total_agree_stakes NUMERIC(20, 6) DEFAULT 0,
    total_disagree_stakes NUMERIC(20, 6) DEFAULT 0,
    winner SMALLINT, -- 1 for agree, 2 for disagree, 0 for refunded
    resolved BOOLEAN DEFAULT FALSE,
    refunded BOOLEAN DEFAULT FALSE, -- True if market was refunded due to empty side
    refund_reason TEXT, -- Reason for refund
    smart_contract_address VARCHAR(255) NOT NULL,
    token_type VARCHAR(10) DEFAULT 'USDC' -- USDC or USDT
);

-- Stakes table
CREATE TABLE IF NOT EXISTS stakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    user_wallet VARCHAR(255) NOT NULL,
    amount NUMERIC(20, 6) NOT NULL,
    side SMALLINT NOT NULL, -- 1 for agree, 2 for disagree
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payout NUMERIC(20, 6),
    claimed BOOLEAN DEFAULT FALSE,
    tx_hash VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_markets_creator ON markets(creator_address);
CREATE INDEX IF NOT EXISTS idx_markets_resolved ON markets(resolved);
CREATE INDEX IF NOT EXISTS idx_markets_ends_at ON markets(ends_at);
CREATE INDEX IF NOT EXISTS idx_stakes_user ON stakes(user_wallet);
CREATE INDEX IF NOT EXISTS idx_stakes_market ON stakes(market_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

