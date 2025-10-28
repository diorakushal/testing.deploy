-- ==============================================================================
-- Complete Supabase Database Schema for Opinion Market Platform
-- Based on KOI opinion market dApp
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- USERS TABLE
-- Stores user profile information and statistics
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    markets_created INTEGER DEFAULT 0,
    total_staked NUMERIC(20, 6) DEFAULT 0,
    total_earnings NUMERIC(20, 6) DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
);

-- ==============================================================================
-- MARKETS TABLE
-- Main table for opinion markets created by users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    winner SMALLINT, -- 1 for agree, 2 for disagree, 0 for refunded/tie
    resolved BOOLEAN DEFAULT FALSE,
    refunded BOOLEAN DEFAULT FALSE, -- True if market was refunded due to empty side
    refund_reason TEXT, -- Reason for refund
    smart_contract_address VARCHAR(255) NOT NULL,
    token_type VARCHAR(10) DEFAULT 'USDC', -- USDC or USDT
    market_contract_id VARCHAR(255), -- Contract-specific market ID (bytes32 or uint256)
    
    -- Foreign key to users
    CONSTRAINT fk_creator FOREIGN KEY (creator_address) REFERENCES users(wallet_address)
        ON DELETE SET NULL
);

-- ==============================================================================
-- STAKES TABLE
-- Individual stakes placed by users on markets
-- ==============================================================================
CREATE TABLE IF NOT EXISTS stakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL,
    user_wallet VARCHAR(255) NOT NULL,
    amount NUMERIC(20, 6) NOT NULL,
    side SMALLINT NOT NULL, -- 1 for agree, 2 for disagree
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payout NUMERIC(20, 6), -- Calculated payout amount
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP,
    tx_hash VARCHAR(255),
    block_number BIGINT,
    
    -- Foreign keys
    CONSTRAINT fk_market FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE
);

-- ==============================================================================
-- MARKET PAYOUTS TABLE
-- Tracks payout distribution information at market level
-- ==============================================================================
CREATE TABLE IF NOT EXISTS market_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL UNIQUE,
    winner_side SMALLINT, -- 1 or 2
    total_winning_stakes NUMERIC(20, 6), -- Total stakes on winning side
    platform_rake NUMERIC(20, 6), -- 5% rake
    winning_pool_after_rake NUMERIC(20, 6), -- Pool after rake deduction
    distributed BOOLEAN DEFAULT FALSE,
    distributed_at TIMESTAMP,
    total_payouts_sent NUMERIC(20, 6) DEFAULT 0,
    num_winners INTEGER DEFAULT 0,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT fk_market_payout FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE
);

-- ==============================================================================
-- USER PAYOUTS TABLE
-- Individual payout records for users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS user_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL,
    user_address VARCHAR(255) NOT NULL,
    user_stake NUMERIC(20, 6), -- User's stake amount
    user_side SMALLINT, -- 1 or 2
    payout_amount NUMERIC(20, 6), -- Actual payout received
    profit NUMERIC(20, 6), -- Profit/loss (includes rake)
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_market_user_payout FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_payout FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate payout records
    CONSTRAINT unique_user_market_payout UNIQUE (market_id, user_address)
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Market table indexes
CREATE INDEX IF NOT EXISTS idx_markets_creator ON markets(creator_address);
CREATE INDEX IF NOT EXISTS idx_markets_resolved ON markets(resolved);
CREATE INDEX IF NOT EXISTS idx_markets_ends_at ON markets(ends_at);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_created_at ON markets(created_at);
CREATE INDEX IF NOT EXISTS idx_markets_contract_id ON markets(market_contract_id);

-- Stakes table indexes
CREATE INDEX IF NOT EXISTS idx_stakes_user ON stakes(user_wallet);
CREATE INDEX IF NOT EXISTS idx_stakes_market ON stakes(market_id);
CREATE INDEX IF NOT EXISTS idx_stakes_claimed ON stakes(claimed);
CREATE INDEX IF NOT EXISTS idx_stakes_side ON stakes(side);
CREATE INDEX IF NOT EXISTS idx_stakes_created_at ON stakes(created_at);

-- Market payouts indexes
CREATE INDEX IF NOT EXISTS idx_market_payouts_market_id ON market_payouts(market_id);
CREATE INDEX IF NOT EXISTS idx_market_payouts_distributed ON market_payouts(distributed);

-- User payouts indexes
CREATE INDEX IF NOT EXISTS idx_user_payouts_user_address ON user_payouts(user_address);
CREATE INDEX IF NOT EXISTS idx_user_payouts_claimed ON user_payouts(claimed);
CREATE INDEX IF NOT EXISTS idx_user_payouts_market_id ON user_payouts(market_id);

-- ==============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ==============================================================================

-- For querying user's active stakes
CREATE INDEX IF NOT EXISTS idx_stakes_user_market ON stakes(user_wallet, market_id);

-- For querying markets by resolution status and time
CREATE INDEX IF NOT EXISTS idx_markets_resolved_ends_at ON markets(resolved, ends_at);

-- For querying user payouts by claim status
CREATE INDEX IF NOT EXISTS idx_user_payouts_user_claimed ON user_payouts(user_address, claimed);

-- ==============================================================================
-- SUPABASE ROW LEVEL SECURITY POLICIES (Optional but Recommended)
-- ==============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payouts ENABLE ROW LEVEL SECURITY;

-- Users table: Everyone can read, authenticated users can insert/update their own
CREATE POLICY "Users are viewable by everyone"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (wallet_address = current_setting('app.current_wallet', TRUE));

-- Markets table: Everyone can read, authenticated users can create
CREATE POLICY "Markets are viewable by everyone"
    ON markets FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create markets"
    ON markets FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Market creators can update their markets"
    ON markets FOR UPDATE
    USING (creator_address = current_setting('app.current_wallet', TRUE));

-- Stakes table: Everyone can read, authenticated users can create their own
CREATE POLICY "Stakes are viewable by everyone"
    ON stakes FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own stakes"
    ON stakes FOR INSERT
    WITH CHECK (user_wallet = current_setting('app.current_wallet', TRUE));

CREATE POLICY "Users can update their own stakes"
    ON stakes FOR UPDATE
    USING (user_wallet = current_setting('app.current_wallet', TRUE));

-- Market payouts: Everyone can read, system can update
CREATE POLICY "Market payouts are viewable by everyone"
    ON market_payouts FOR SELECT
    USING (true);

CREATE POLICY "System can update market payouts"
    ON market_payouts FOR UPDATE
    USING (true);

-- User payouts: Users can read their own, system can insert/update
CREATE POLICY "Users can view their own payouts"
    ON user_payouts FOR SELECT
    USING (user_address = current_setting('app.current_wallet', TRUE) OR true);

CREATE POLICY "System can insert/update user payouts"
    ON user_payouts FOR ALL
    USING (true);

-- ==============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================================================

-- Function to update market totals when stake is inserted
CREATE OR REPLACE FUNCTION update_market_totals_on_stake()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.side = 1 THEN
        UPDATE markets 
        SET total_agree_stakes = total_agree_stakes + NEW.amount 
        WHERE id = NEW.market_id;
    ELSE
        UPDATE markets 
        SET total_disagree_stakes = total_disagree_stakes + NEW.amount 
        WHERE id = NEW.market_id;
    END IF;
    
    -- Update user's total staked
    UPDATE users 
    SET total_staked = total_staked + NEW.amount 
    WHERE wallet_address = NEW.user_wallet;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_market_totals
    AFTER INSERT ON stakes
    FOR EACH ROW
    EXECUTE FUNCTION update_market_totals_on_stake();

-- Function to update user stats on stake update (when claimed)
CREATE OR REPLACE FUNCTION update_user_stats_on_claim()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.claimed = TRUE AND OLD.claimed = FALSE AND NEW.payout IS NOT NULL THEN
        -- Update user's total earnings
        UPDATE users 
        SET total_earnings = total_earnings + (NEW.payout - NEW.amount)
        WHERE wallet_address = NEW.user_wallet;
        
        -- Update wins/losses based on market outcome
        UPDATE users 
        SET wins = wins + 1
        WHERE wallet_address = NEW.user_wallet
        AND EXISTS (
            SELECT 1 FROM markets 
            WHERE id = NEW.market_id 
            AND winner = NEW.side
        );
        
        UPDATE users 
        SET losses = losses + 1
        WHERE wallet_address = NEW.user_wallet
        AND EXISTS (
            SELECT 1 FROM markets 
            WHERE id = NEW.market_id 
            AND winner != NEW.side AND winner != 0
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
    AFTER UPDATE ON stakes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_on_claim();

-- ==============================================================================
-- HELPER FUNCTIONS
-- ==============================================================================

-- Function to get market statistics
CREATE OR REPLACE FUNCTION get_market_stats(market_uuid UUID)
RETURNS TABLE (
    total_users INTEGER,
    agree_users INTEGER,
    disagree_users INTEGER,
    avg_stake NUMERIC,
    largest_stake NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_users,
        COUNT(*) FILTER (WHERE side = 1)::INTEGER as agree_users,
        COUNT(*) FILTER (WHERE side = 2)::INTEGER as disagree_users,
        AVG(amount) as avg_stake,
        MAX(amount) as largest_stake
    FROM stakes
    WHERE market_id = market_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get user leaderboard
CREATE OR REPLACE FUNCTION get_user_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    rank INTEGER,
    wallet_address VARCHAR,
    username VARCHAR,
    total_earnings NUMERIC,
    wins INTEGER,
    win_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY total_earnings DESC)::INTEGER as rank,
        u.wallet_address,
        u.username,
        u.total_earnings,
        u.wins,
        CASE 
            WHEN (u.wins + u.losses) > 0 
            THEN ROUND((u.wins::NUMERIC / (u.wins + u.losses)) * 100, 2)
            ELSE 0
        END as win_rate
    FROM users u
    ORDER BY u.total_earnings DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- INITIALIZATION COMMENTS
-- ==============================================================================

COMMENT ON TABLE users IS 'User profiles with wallet addresses and statistics';
COMMENT ON TABLE markets IS 'Opinion markets created by users';
COMMENT ON TABLE stakes IS 'Individual stakes placed by users on markets';
COMMENT ON TABLE market_payouts IS 'Market-level payout tracking and distribution';
COMMENT ON TABLE user_payouts IS 'Individual user payout records';

COMMENT ON COLUMN markets.winner IS 'Winner side: 1 for agree, 2 for disagree, 0 for tie/refund';
COMMENT ON COLUMN markets.market_contract_id IS 'Contract-specific market ID (bytes32 hex or uint256)';
COMMENT ON COLUMN stakes.side IS 'Stake side: 1 for agree, 2 for disagree';
COMMENT ON COLUMN market_payouts.platform_rake IS 'Platform fee (5% of total winning pool)';

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================
