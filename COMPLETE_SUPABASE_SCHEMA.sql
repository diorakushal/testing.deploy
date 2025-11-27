-- ==============================================================================
-- COMPLETE SUPABASE DATABASE SCHEMA
-- Opinion Market Platform + Payment Requests
-- Copy and paste this entire file into Supabase SQL Editor
-- ==============================================================================

-- Enable UUID extension (Supabase has this by default, but including for safety)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- USERS TABLE
-- Stores user profile information and statistics
-- Links to Supabase Auth users via id (auth.users.id)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) UNIQUE, -- Nullable: users can sign up with email first
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    market_contract_id VARCHAR(255) -- Contract-specific market ID (bytes32 or uint256)
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
    CONSTRAINT fk_stakes_market FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE
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
    CONSTRAINT fk_user_payout_market FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate payout records
    CONSTRAINT unique_user_market_payout UNIQUE (market_id, user_address)
);

-- ==============================================================================
-- PAYMENT REQUESTS TABLE
-- For Request & Send crypto feature
-- ==============================================================================
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_address VARCHAR(255) NOT NULL,
    amount NUMERIC(20, 6) NOT NULL,
    token_symbol VARCHAR(10) DEFAULT 'USDC',
    token_address VARCHAR(255) NOT NULL,
    chain_id VARCHAR(50) NOT NULL, -- Can be integer (EVM) or 'solana' or 'tron'
    chain_name VARCHAR(50) NOT NULL,
    caption TEXT,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'paid', 'cancelled'
    paid_by VARCHAR(255), -- Address that paid
    tx_hash VARCHAR(255), -- Transaction hash of payment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

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

-- Payment requests indexes
CREATE INDEX IF NOT EXISTS idx_payment_requests_requester ON payment_requests(requester_address);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_tx_hash ON payment_requests(tx_hash);
CREATE INDEX IF NOT EXISTS idx_payment_requests_chain_id ON payment_requests(chain_id);

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
-- ROW LEVEL SECURITY (RLS) - DISABLED BY DEFAULT
-- Uncomment if you want to enable RLS policies
-- ==============================================================================

-- Enable RLS (optional - comment out if you want to disable)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE market_payouts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_payouts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- FUNCTION TO SYNC USER DATA FROM AUTH
-- Automatically creates/updates user profile when auth user is created
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, email_verified, first_name, last_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.email_confirmed_at IS NOT NULL,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'username'
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        email = NEW.email,
        email_verified = NEW.email_confirmed_at IS NOT NULL,
        first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', users.first_name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', users.last_name),
        username = COALESCE(NEW.raw_user_meta_data->>'username', users.username),
        updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update email_verified when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.users
        SET email_verified = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update email_verified status
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_email_confirmation();

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
-- MIGRATION: ADD NEW COLUMNS TO EXISTING USERS TABLE (if table already exists)
-- Run this if you already have a users table and need to add new columns
-- ==============================================================================

-- Add new columns if they don't exist (safe to run multiple times)
DO $$ 
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
    END IF;

    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
    END IF;

    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add unique constraint on username if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'users_username_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;

    -- Make wallet_address nullable if it's currently NOT NULL (for existing tables)
    -- This allows users to sign up with email first, then add wallet later
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' 
               AND column_name = 'wallet_address' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE users ALTER COLUMN wallet_address DROP NOT NULL;
    END IF;

    -- Update foreign key constraint if id column exists but doesn't reference auth.users
    -- Note: This requires dropping and recreating the constraint, which may fail if there's data
    -- Only run this if you're sure you want to link to auth.users
    -- WARNING: This will fail if you have existing users with IDs that don't exist in auth.users
    -- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;
    -- ALTER TABLE users ADD CONSTRAINT users_id_fkey 
    --     FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- ==============================================================================
-- VERIFICATION QUERIES (Run these after the schema to verify)
-- ==============================================================================

-- Uncomment to verify tables were created:
-- SELECT tablename FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('users', 'markets', 'stakes', 'market_payouts', 'user_payouts', 'payment_requests')
-- ORDER BY tablename;

-- Uncomment to verify users table structure:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- ORDER BY ordinal_position;

-- Uncomment to verify triggers were created:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY trigger_name;

-- ==============================================================================
-- NOTES FOR SUPABASE AUTH INTEGRATION
-- ==============================================================================
-- 
-- 1. The users table now links to auth.users via the id column
-- 2. When a user signs up via Supabase Auth, the trigger automatically creates
--    a profile in the users table
-- 3. Email verification status is automatically synced from auth.users
-- 4. User metadata (first_name, last_name, username) is synced from signup
-- 5. Make sure to enable email confirmations in Supabase Dashboard:
--    Authentication → Settings → Enable email confirmations
-- 6. Configure redirect URLs in Authentication → URL Configuration
--
-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================

