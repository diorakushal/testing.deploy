-- Payout tracking tables for KOI opinion markets
-- Auto-payout system: Winners automatically receive proportional shares

-- Track market-level payout information
CREATE TABLE IF NOT EXISTS market_payouts (
  id SERIAL PRIMARY KEY,
  market_id INT NOT NULL,
  winner_side INT, -- 1 or 2
  total_winning_stakes NUMERIC(20, 0), -- BigInt
  platform_rake NUMERIC(20, 0), -- 5% rake
  winning_pool_after_rake NUMERIC(20, 0),
  distributed BOOLEAN DEFAULT FALSE,
  distributed_at TIMESTAMP,
  total_payouts_sent NUMERIC(20, 0) DEFAULT 0,
  num_winners INT DEFAULT 0,
  transaction_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE
);

-- Track individual user payouts
CREATE TABLE IF NOT EXISTS user_payouts (
  id SERIAL PRIMARY KEY,
  market_id INT NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  user_stake NUMERIC(20, 0), -- BigInt
  user_side INT, -- 1 or 2
  payout_amount NUMERIC(20, 0),
  profit NUMERIC(20, 0), -- can be negative (includes rake)
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  transaction_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE,
  UNIQUE(market_id, user_address)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_payouts_user_address ON user_payouts(user_address);
CREATE INDEX IF NOT EXISTS idx_user_payouts_claimed ON user_payouts(claimed);
CREATE INDEX IF NOT EXISTS idx_market_payouts_distributed ON market_payouts(distributed);
CREATE INDEX IF NOT EXISTS idx_market_payouts_market_id ON market_payouts(market_id);

