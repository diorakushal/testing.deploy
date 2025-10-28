-- ==============================================================================
-- Seed Data for Supabase Opinion Market Platform
-- Run this after setting up the schema to create initial test data
-- ==============================================================================

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE users, markets, stakes CASCADE;

-- ==============================================================================
-- Insert Sample Users
-- ==============================================================================

INSERT INTO users (wallet_address, username, markets_created, total_staked, total_earnings, wins, losses) VALUES
('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'DrakeFan2024', 2, 2500.00, 450.00, 3, 1),
('0x8ba1f109551bD432803012645Hac136c2C1c', 'TeslaEvangelist', 1, 5000.00, 1200.00, 5, 2),
('0x5c0d3b8a7d9e1F2f4a6B8d5e4c7a3B9d1E2f4a6', 'Swiftie4Life', 1, 1500.00, -250.00, 1, 2),
('0x3a7b9c2d4e5f6a8b9c1d2e3f4a5b6c7d8e9f0a1b', 'LebronGOAT', 1, 3200.00, 800.00, 4, 1),
('0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0', 'BradyStan', 1, 1800.00, 350.00, 2, 1),
('0x2b4d6f8a9c1e3d5f7b9a2c4e6f8a1b3d5c7e9f2b', 'TVCritic', 1, 890.00, -120.00, 1, 3)
ON CONFLICT (wallet_address) DO NOTHING;

-- ==============================================================================
-- Insert Sample Markets
-- ==============================================================================

INSERT INTO markets (
    creator_address,
    title,
    description,
    category,
    agree_label,
    disagree_label,
    ends_at,
    total_agree_stakes,
    total_disagree_stakes,
    winner,
    resolved,
    smart_contract_address,
    token_type,
    market_contract_id
) VALUES
-- Active Market 1
(
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    'Drake > Kendrick Lamar',
    'Who has better overall catalog and flow? Drake with his commercial success or Kendrick with his lyrical mastery?',
    'music',
    'Drake',
    'Kendrick',
    NOW() + INTERVAL '2 days',
    125000.50,
    98750.25,
    NULL,
    FALSE,
    '0x0000000000000000000000000000000000000000',
    'USDC',
    '0x0000000000000000000000000000000000000000000000000000000000000001'
),

-- Active Market 2
(
    '0x8ba1f109551bD432803012645Hac136c2C1c',
    'Tesla is the most innovative car company',
    'Does Tesla lead the industry in innovation, or are legacy automakers catching up?',
    'other',
    'Tesla',
    'Legacy Auto',
    NOW() + INTERVAL '3 days',
    245000.00,
    189250.75,
    NULL,
    FALSE,
    '0x0000000000000000000000000000000000000000',
    'USDC',
    '0x0000000000000000000000000000000000000000000000000000000000000002'
),

-- Active Market 3
(
    '0x5c0d3b8a7d9e1F2f4a6B8d5e4c7a3B9d1E2f4a6',
    'Taylor Swift is the greatest pop artist of all time',
    'Her longevity, album sales, and cultural impact make her unmatched in pop music history.',
    'music',
    'Swift',
    'Others',
    NOW() + INTERVAL '1 day',
    87500.00,
    112500.50,
    NULL,
    FALSE,
    '0x0000000000000000000000000000000000000000',
    'USDC',
    '0x0000000000000000000000000000000000000000000000000000000000000003'
),

-- Active Market 4
(
    '0x3a7b9c2d4e5f6a8b9c1d2e3f4a5b6c7d8e9f0a1b',
    'LeBron James > Michael Jordan',
    'The GOAT debate continues. LeBron vs MJ based on career achievements and dominance.',
    'sports',
    'LeBron',
    'Jordan',
    NOW() + INTERVAL '5 days',
    156250.25,
    231500.00,
    NULL,
    FALSE,
    '0x0000000000000000000000000000000000000000',
    'USDC',
    '0x0000000000000000000000000000000000000000000000000000000000000004'
),

-- Resolved Market 1 (to show history)
(
    '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
    'Brady > Rodgers debate is settled',
    'Who is the better quarterback? The GOAT with 7 rings or Rodgers with superior arm talent?',
    'sports',
    'Brady',
    'Rodgers',
    NOW() - INTERVAL '1 day',
    134250.75,
    98750.50,
    2,
    TRUE,
    '0x0000000000000000000000000000000000000000',
    'USDC',
    '0x0000000000000000000000000000000000000000000000000000000000000005'
),

-- Resolved Market 2 (to show history)
(
    '0x2b4d6f8a9c1e3d5f7b9a2c4e6f8a1b3d5c7e9f2b',
    'The Sopranos > Breaking Bad',
    'Which TV series is the better crime drama masterpiece?',
    'pop-culture',
    'The Sopranos',
    'Breaking Bad',
    NOW() - INTERVAL '2 days',
    85620.50,
    67890.00,
    2,
    TRUE,
    '0x0000000000000000000000000000000000000000',
    'USDT',
    '0x0000000000000000000000000000000000000000000000000000000000000006'
)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- Insert Sample Stakes
-- ==============================================================================

-- For Active Markets
INSERT INTO stakes (market_id, user_wallet, amount, side, tx_hash)
SELECT 
    m.id,
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    1000.00,
    1,
    '0xabc123def456...'
FROM markets m
WHERE m.title = 'Drake > Kendrick Lamar';

INSERT INTO stakes (market_id, user_wallet, amount, side, tx_hash)
SELECT 
    m.id,
    '0x8ba1f109551bD432803012645Hac136c2C1c',
    500.00,
    2,
    '0xdef456abc123...'
FROM markets m
WHERE m.title = 'Drake > Kendrick Lamar';

-- For Tesla Market
INSERT INTO stakes (market_id, user_wallet, amount, side, tx_hash)
SELECT 
    m.id,
    '0x8ba1f109551bD432803012645Hac136c2C1c',
    2000.00,
    1,
    '0x123abc456def...'
FROM markets m
WHERE m.title = 'Tesla is the most innovative car company';

INSERT INTO stakes (market_id, user_wallet, amount, side, tx_hash)
SELECT 
    m.id,
    '0x3a7b9c2d4e5f6a8b9c1d2e3f4a5b6c7d8e9f0a1b',
    1500.00,
    2,
    '0x456def123abc...'
FROM markets m
WHERE m.title = 'Tesla is the most innovative car company';

-- For Resolved Markets (to show claim functionality)
INSERT INTO stakes (market_id, user_wallet, amount, side, payout, claimed, tx_hash)
SELECT 
    m.id,
    '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
    500.00,
    2,
    675.00,
    TRUE,
    '0x789ghi012jkl...'
FROM markets m
WHERE m.title = 'Brady > Rodgers debate is settled';

INSERT INTO stakes (market_id, user_wallet, amount, side, payout, claimed, tx_hash)
SELECT 
    m.id,
    '0x5c0d3b8a7d9e1F2f4a6B8d5e4c7a3B9d1E2f4a6',
    750.00,
    2,
    1012.50,
    TRUE,
    '0x012jkl345mno...'
FROM markets m
WHERE m.title = 'The Sopranos > Breaking Bad';

-- ==============================================================================
-- Sample Market Payouts
-- ==============================================================================

INSERT INTO market_payouts (market_id, winner_side, total_winning_stakes, platform_rake, winning_pool_after_rake, distributed)
SELECT 
    m.id,
    m.winner,
    CASE 
        WHEN m.winner = 1 THEN m.total_agree_stakes
        WHEN m.winner = 2 THEN m.total_disagree_stakes
        ELSE 0
    END,
    CASE 
        WHEN m.winner = 1 THEN m.total_disagree_stakes * 0.05
        WHEN m.winner = 2 THEN m.total_agree_stakes * 0.05
        ELSE 0
    END,
    CASE 
        WHEN m.winner = 1 THEN m.total_disagree_stakes * 0.95
        WHEN m.winner = 2 THEN m.total_agree_stakes * 0.95
        ELSE 0
    END,
    TRUE
FROM markets m
WHERE m.resolved = TRUE AND m.winner > 0
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- Verification Queries
-- ==============================================================================

-- Check counts
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'markets', COUNT(*) FROM markets
UNION ALL
SELECT 'stakes', COUNT(*) FROM stakes
UNION ALL
SELECT 'market_payouts', COUNT(*) FROM market_payouts;

-- View active markets with stats
SELECT 
    m.id,
    m.title,
    m.category,
    m.agree_label,
    m.disagree_label,
    m.total_agree_stakes,
    m.total_disagree_stakes,
    (m.total_agree_stakes + m.total_disagree_stakes) as total_staked,
    m.ends_at,
    u.username as creator
FROM markets m
JOIN users u ON m.creator_address = u.wallet_address
WHERE m.resolved = FALSE
ORDER BY m.created_at DESC;

-- View resolved markets
SELECT 
    m.id,
    m.title,
    m.winner,
    CASE 
        WHEN m.winner = 1 THEN m.agree_label
        WHEN m.winner = 2 THEN m.disagree_label
        ELSE 'Tie'
    END as winner_side,
    m.total_agree_stakes,
    m.total_disagree_stakes,
    u.username as creator
FROM markets m
JOIN users u ON m.creator_address = u.wallet_address
WHERE m.resolved = TRUE
ORDER BY m.ends_at DESC;

-- View user leaderboard
SELECT 
    username,
    wallet_address,
    total_earnings,
    wins,
    losses,
    CASE 
        WHEN (wins + losses) > 0 
        THEN ROUND((wins::NUMERIC / (wins + losses)) * 100, 2)
        ELSE 0
    END as win_rate
FROM users
ORDER BY total_earnings DESC;
