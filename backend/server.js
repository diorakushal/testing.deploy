const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cron = require('node-cron');
const { ethers } = require('ethers');
const axios = require('axios');
const https = require('https');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection (Supabase)
// Support both connection string and individual parameters
let poolConfig;

if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  // Use connection string directly (URL encode @ in password if needed)
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  // Check if using connection pooler - if it fails, try direct connection
  const isPooler = connectionString.includes('pooler.supabase.com');
  
  poolConfig = {
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    },
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: isPooler ? 10000 : 2000, // Longer timeout for pooler
  };
} else {
  // Use individual parameters - try direct connection first (port 5432)
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db.robjixmkmrmryrqzivdd.supabase.co',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Kushal@13',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    },
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const pool = new Pool(poolConfig);

// Web3 provider
const provider = new ethers.JsonRpcProvider(
  process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
);

const marketContractAddress = process.env.MARKET_CONTRACT_ADDRESS;
const ABI = require('./contracts/KOI.json');

// ========== API ROUTES ==========

// Helper function to safely extract and validate query parameters
// Prevents issues when multiple query params with same name are passed (Express returns arrays)
const getQueryParam = (query, paramName, defaultValue = undefined) => {
  const value = query[paramName];
  if (value === undefined || value === null) {
    return defaultValue;
  }
  // If multiple values provided, use the first one
  if (Array.isArray(value)) {
    return value[0];
  }
  // Ensure it's a string before returning
  return typeof value === 'string' ? value : String(value);
};

// Get markets feed
app.get('/api/markets', async (req, res) => {
  try {
    const sort = getQueryParam(req.query, 'sort', 'trending');
    const category = getQueryParam(req.query, 'category');
    const status = getQueryParam(req.query, 'status', 'active');
    
    let query = `
      SELECT * FROM markets 
      WHERE resolved = $1
    `;
    const params = [status === 'resolved'];
    
    if (category && typeof category === 'string') {
      query += ' AND category = $2';
      params.push(category);
    }
    
    // Sorting
    if (sort === 'trending') {
      query += ' ORDER BY (total_agree_stakes + total_disagree_stakes) DESC, created_at DESC';
    } else if (sort === 'new') {
      query += ' ORDER BY created_at DESC';
    }
    
    query += ' LIMIT 50';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single market
app.get('/api/markets/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM markets WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching market:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create market
app.post('/api/markets', async (req, res) => {
  try {
    const {
      creatorAddress,
      title,
      description,
      category,
      agreeLabel,
      disagreeLabel,
      endsAt,
      smartContractAddress,
      tokenType
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO markets (
        creator_address, title, description, category, agree_label, 
        disagree_label, ends_at, smart_contract_address, token_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        creatorAddress,
        title,
        description,
        category,
        agreeLabel || 'Agree',
        disagreeLabel || 'Disagree',
        endsAt,
        smartContractAddress,
        tokenType || 'USDC'
      ]
    );
    
    // Update user stats
    await pool.query(
      `UPDATE users 
       SET markets_created = markets_created + 1
       WHERE wallet_address = $1`,
      [creatorAddress]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating market:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get or create user
app.post('/api/users', async (req, res) => {
  try {
    const { walletAddress, username } = req.body;
    
    let result = await pool.query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [walletAddress]
    );
    
    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO users (wallet_address, username)
         VALUES ($1, $2) RETURNING *`,
        [walletAddress, username]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search users by username (for autocomplete)
app.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query; // Search query (username only)
    
    if (!q || q.length < 1) {
      return res.json([]);
    }
    
    // Remove @ if user typed it and clean the search term
    const cleanSearch = q.trim().replace(/^@+/, '').toLowerCase();
    
    if (!cleanSearch || cleanSearch.length < 1) {
      return res.json([]);
    }
    
    console.log('Searching for users by username:', cleanSearch);
    
    // Use Supabase client for this query (more reliable for Supabase)
    const { supabase } = require('./lib/supabase');
    
    console.log('Searching with pattern:', `%${cleanSearch}%`);
    
    // Use Supabase client with ilike for case-insensitive search
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, first_name, last_name')
      .not('username', 'is', null)
      .neq('username', '')
      .ilike('username', `%${cleanSearch}%`)
      .limit(10);
    
    console.log('Search results count:', data?.length || 0);
    if (error) {
      console.error('Supabase search error:', error);
      // Fallback to direct query if Supabase fails
      try {
        const result = await pool.query(
          `SELECT id, username, email, first_name, last_name 
           FROM users 
           WHERE username IS NOT NULL 
             AND username != ''
             AND LOWER(username) LIKE $1
           ORDER BY username ASC 
           LIMIT 10`,
          [`%${cleanSearch}%`]
        );
        console.log('Fallback query results:', result.rows.length);
        const results = (result.rows || []).map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          displayName: user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : user.first_name || user.email?.split('@')[0] || 'User',
          searchText: user.username ? `@${user.username}` : user.email
        }));
        return res.json(results);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return res.json([]);
      }
    }
    
    if (data && data.length > 0) {
      console.log('Found users:', data.map(u => u.username));
    } else {
      console.log('No users found matching:', cleanSearch);
    }
    
    // Use data from Supabase query
    const resultRows = data || [];
    
    // Format results for autocomplete
    const results = (resultRows || []).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      displayName: user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.first_name || user.email?.split('@')[0] || 'User',
      searchText: user.username ? `@${user.username}` : user.email
    }));
    
    res.json(results);
  } catch (error) {
    console.error('Error searching users:', error);
    // Return empty array instead of error to prevent frontend issues
    res.json([]);
  }
});

// Debug endpoint: Get all users with usernames (for testing)
app.get('/api/users/debug/all', async (req, res) => {
  try {
    const { supabase } = require('./lib/supabase');
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, first_name, last_name')
      .not('username', 'is', null)
      .neq('username', '')
      .limit(20);
    
    if (error) {
      console.error('Error fetching users:', error);
      return res.json({ error: error.message, users: [] });
    }
    
    res.json({ count: data?.length || 0, users: data || [] });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.json({ error: error.message, users: [] });
  }
});

// Get user profile
app.get('/api/users/:address', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [req.params.address]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's markets
    const marketsResult = await pool.query(
      'SELECT * FROM markets WHERE creator_address = $1 ORDER BY created_at DESC',
      [req.params.address]
    );
    
    // Get user's stakes
    const stakesResult = await pool.query(
      `SELECT s.*, m.title, m.resolved, m.winner
       FROM stakes s
       JOIN markets m ON s.market_id = m.id
       WHERE s.user_wallet = $1
       ORDER BY s.created_at DESC`,
      [req.params.address]
    );
    
    res.json({
      ...result.rows[0],
      markets: marketsResult.rows,
      stakes: stakesResult.rows
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record stake
app.post('/api/stakes', async (req, res) => {
  try {
    const {
      marketId,
      userWallet,
      amount,
      side,
      txHash
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO stakes (market_id, user_wallet, amount, side, tx_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [marketId, userWallet, amount, side, txHash]
    );
    
    // Update market totals
    if (side === 1) {
      await pool.query(
        'UPDATE markets SET total_agree_stakes = total_agree_stakes + $1 WHERE id = $2',
        [amount, marketId]
      );
    } else {
      await pool.query(
        'UPDATE markets SET total_disagree_stakes = total_disagree_stakes + $1 WHERE id = $2',
        [amount, marketId]
      );
    }
    
    // Update user total staked
    await pool.query(
      'UPDATE users SET total_staked = total_staked + $1 WHERE wallet_address = $2',
      [amount, userWallet]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error recording stake:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cron job to resolve markets every minute
cron.schedule('* * * * *', async () => {
  try {
    console.log('Checking for markets to resolve...');
    
    const now = new Date();
    const result = await pool.query(
      `SELECT * FROM markets 
       WHERE resolved = FALSE AND ends_at <= $1`,
      [now]
    );
    
    for (const market of result.rows) {
      await resolveMarket(market);
    }
  } catch (error) {
    console.error('Error in resolution cron:', error);
  }
});

// Resolve market function
async function resolveMarket(market) {
  try {
    // Call smart contract to resolve
    const contract = new ethers.Contract(market.smart_contract_address, ABI, provider);
    
    // Convert market ID to number
    const marketId = parseInt(market.id) || 0;
    
    try {
      await contract.resolveMarket(marketId);
      console.log(`Market ${market.id} resolved`);
    } catch (error) {
      console.error(`Error resolving market ${market.id}:`, error);
    }
    
    // Get resolution data from contract
    const marketData = await contract.getMarket(marketId);
    
    // Update database
    await pool.query(
      `UPDATE markets 
       SET winner = $1, resolved = TRUE,
           total_agree_stakes = $2, total_disagree_stakes = $3
       WHERE id = $4`,
      [
        Number(marketData.winner),
        ethers.formatUnits(marketData.totalAgreeStakes, 6),
        ethers.formatUnits(marketData.totalDisagreeStakes, 6),
        market.id
      ]
    );
    
    // Distribute payouts in background
    await distributePayouts(market.id);
    
  } catch (error) {
    console.error(`Error in resolveMarket for ${market.id}:`, error);
  }
}

// Distribute payouts
async function distributePayouts(marketId) {
  try {
    const marketResult = await pool.query(
      'SELECT * FROM markets WHERE id = $1',
      [marketId]
    );
    
    if (marketResult.rows.length === 0 || !marketResult.rows[0].resolved) {
      return;
    }
    
    const market = marketResult.rows[0];
    
    // Get all stakes for this market
    const stakesResult = await pool.query(
      'SELECT * FROM stakes WHERE market_id = $1',
      [marketId]
    );
    
    // Calculate payouts for winners
    for (const stake of stakesResult.rows) {
      if (stake.side === market.winner) {
        // Calculate payout
        const totalPool = market.winner === 1 
          ? parseFloat(market.total_disagree_stakes) 
          : parseFloat(market.total_agree_stakes);
        
        const winnerPool = market.winner === 1
          ? parseFloat(market.total_agree_stakes)
          : parseFloat(market.total_disagree_stakes);
        
        const rake = totalPool * 0.05; // 5% rake
        const payoutPool = totalPool - rake;
        const userPayout = (stake.amount * payoutPool) / winnerPool + stake.amount;
        
        // Update stake with payout
        await pool.query(
          'UPDATE stakes SET payout = $1 WHERE id = $2',
          [userPayout, stake.id]
        );
        
        // Update user earnings
        await pool.query(
          'UPDATE users SET total_earnings = total_earnings + $1, wins = wins + 1 WHERE wallet_address = $2',
          [userPayout - stake.amount, stake.user_wallet]
        );
      } else {
        // User lost
        await pool.query(
          'UPDATE users SET losses = losses + 1 WHERE wallet_address = $1',
          [stake.user_wallet]
        );
      }
    }
    
    console.log(`Payouts distributed for market ${marketId}`);
  } catch (error) {
    console.error('Error distributing payouts:', error);
  }
}

// Get active markets count
app.get('/api/stats', async (req, res) => {
  try {
    const activeResult = await pool.query(
      'SELECT COUNT(*) FROM markets WHERE resolved = FALSE'
    );
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM markets'
    );
    
    res.json({
      activeMarkets: activeResult.rows[0].count,
      totalMarkets: totalResult.rows[0].count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Seed mock data endpoint
app.post('/api/seed-mock-data', async (req, res) => {
  try {
    const mockMarkets = [
      {
        creator_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        title: 'Drake > Kendrick Lamar',
        description: 'Who has better overall catalog and flow? Drake with his commercial success or Kendrick with his lyrical mastery?',
        category: 'music',
        agree_label: 'Drake',
        disagree_label: 'Kendrick',
        total_agree_stakes: 125000.50,
        total_disagree_stakes: 98750.25,
        ends_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        smart_contract_address: marketContractAddress || '0x0000000000000000000000000000000000000000',
        token_type: 'USDC'
      },
      {
        creator_address: '0x8ba1f109551bD432803012645Hac136c2C1c',
        title: 'Tesla is the most innovative car company',
        description: 'Does Tesla lead the industry in innovation, or are legacy automakers catching up?',
        category: 'other',
        agree_label: 'Tesla',
        disagree_label: 'Legacy Auto',
        total_agree_stakes: 245000.00,
        total_disagree_stakes: 189250.75,
        ends_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
        smart_contract_address: marketContractAddress || '0x0000000000000000000000000000000000000000',
        token_type: 'USDC'
      },
      {
        creator_address: '0x5c0d3b8a7d9e1F2f4a6B8d5e4c7a3B9d1E2f4a6',
        title: 'Taylor Swift is the greatest pop artist of all time',
        description: 'Her longevity, album sales, and cultural impact make her unmatched in pop music history.',
        category: 'music',
        agree_label: 'Swift',
        disagree_label: 'Others',
        total_agree_stakes: 87500.00,
        total_disagree_stakes: 112500.50,
        ends_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        smart_contract_address: marketContractAddress || '0x0000000000000000000000000000000000000000',
        token_type: 'USDC'
      },
      {
        creator_address: '0x3a7b9c2d4e5f6a8b9c1d2e3f4a5b6c7d8e9f0a1b',
        title: 'LeBron James > Michael Jordan',
        description: 'The GOAT debate continues. LeBron vs MJ based on career achievements and dominance.',
        category: 'sports',
        agree_label: 'LeBron',
        disagree_label: 'Jordan',
        total_agree_stakes: 156250.25,
        total_disagree_stakes: 231500.00,
        ends_at: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
        smart_contract_address: marketContractAddress || '0x0000000000000000000000000000000000000000',
        token_type: 'USDC'
      },
      {
        creator_address: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
        title: 'Tom Brady > Aaron Rodgers',
        description: 'Who is the better quarterback? The GOAT with 7 rings or Rodgers with superior arm talent?',
        category: 'sports',
        agree_label: 'Brady',
        disagree_label: 'Rodgers',
        total_agree_stakes: 98750.50,
        total_disagree_stakes: 134250.75,
        ends_at: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
        smart_contract_address: marketContractAddress || '0x0000000000000000000000000000000000000000',
        token_type: 'USDC'
      },
      {
        creator_address: '0x2b4d6f8a9c1e3d5f7b9a2c4e6f8a1b3d5c7e9f2b',
        title: 'The Sopranos > Breaking Bad',
        description: 'Which TV series is the better crime drama masterpiece?',
        category: 'pop-culture',
        agree_label: 'The Sopranos',
        disagree_label: 'Breaking Bad',
        total_agree_stakes: 67890.00,
        total_disagree_stakes: 85620.50,
        ends_at: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
        smart_contract_address: marketContractAddress || '0x0000000000000000000000000000000000000000',
        token_type: 'USDT'
      }
    ];

    // Create mock users first
    const userAddresses = [...new Set(mockMarkets.map(m => m.creator_address))];
    
    for (const address of userAddresses) {
      await pool.query(
        `INSERT INTO users (wallet_address, username, markets_created)
         VALUES ($1, $2, $3)
         ON CONFLICT (wallet_address) DO NOTHING`,
        [address, `user_${address.slice(0, 6)}`, 1]
      );
    }

    // Insert mock markets
    const createdMarkets = [];
    for (const market of mockMarkets) {
      const result = await pool.query(
        `INSERT INTO markets (
          creator_address, title, description, category, agree_label, 
          disagree_label, ends_at, total_agree_stakes, total_disagree_stakes,
          smart_contract_address, token_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          market.creator_address,
          market.title,
          market.description,
          market.category,
          market.agree_label,
          market.disagree_label,
          market.ends_at,
          market.total_agree_stakes,
          market.total_disagree_stakes,
          market.smart_contract_address,
          market.token_type
        ]
      );
      createdMarkets.push(result.rows[0]);
    }

    res.json({ message: 'Mock data seeded successfully', markets: createdMarkets.length });
  } catch (error) {
    console.error('Error seeding mock data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PAYOUT API ENDPOINTS ==========

// Get payout calculation for a market
app.get('/api/markets/:marketId/payout', async (req, res) => {
  try {
    const { marketId } = req.params;

    // Get market details
    const marketResult = await pool.query(
      'SELECT * FROM markets WHERE id = $1',
      [marketId]
    );

    if (marketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const market = marketResult.rows[0];

    if (!market.resolved) {
      return res.status(400).json({ error: 'Market not resolved yet' });
    }

    const totalAgree = parseFloat(market.total_agree_stakes);
    const totalDisagree = parseFloat(market.total_disagree_stakes);
    
    // Determine winner and calculate rake
    const winner = market.winner;
    const winnerPool = winner === 1 ? totalAgree : totalDisagree;
    const rake = winnerPool * 0.05; // 5% rake
    const winningPoolAfterRake = winnerPool - rake;

    res.json({
      marketId,
      totalAgreeStakes: totalAgree,
      totalDisagreeStakes: totalDisagree,
      winner,
      rake,
      winningPoolAfterRake
    });
  } catch (error) {
    console.error('Error calculating payout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's specific payout for a market
app.get('/api/markets/:marketId/user/:userAddress/payout', async (req, res) => {
  try {
    const { marketId, userAddress } = req.params;

    // Get market details
    const marketResult = await pool.query(
      'SELECT * FROM markets WHERE id = $1',
      [marketId]
    );

    if (marketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const market = marketResult.rows[0];

    if (!market.resolved) {
      return res.status(400).json({ error: 'Market not resolved yet' });
    }

    // Get user's stake
    const stakeResult = await pool.query(
      'SELECT * FROM stakes WHERE market_id = $1 AND user_wallet = $2',
      [marketId, userAddress]
    );

    if (stakeResult.rows.length === 0) {
      return res.status(404).json({ error: 'User has no stake in this market' });
    }

    const stake = stakeResult.rows[0];
    
    const winner = market.winner;
    const won = stake.side === winner;

    if (!won) {
      return res.json({
        userAddress,
        stake: parseFloat(stake.amount),
        side: stake.side,
        won: false,
        payout: 0,
        profit: -parseFloat(stake.amount)
      });
    }

    // Calculate payout
    const totalAgree = parseFloat(market.total_agree_stakes);
    const totalDisagree = parseFloat(market.total_disagree_stakes);
    const winnerPool = winner === 1 ? totalAgree : totalDisagree;
    const rake = winnerPool * 0.05;
    const winningPoolAfterRake = winnerPool - rake;
    const userStake = parseFloat(stake.amount);
    
    const payout = (userStake / winnerPool) * winningPoolAfterRake;
    const profit = payout - userStake; // Will be negative due to rake

    res.json({
      userAddress,
      stake: userStake,
      side: stake.side,
      won: true,
      payout,
      profit
    });
  } catch (error) {
    console.error('Error calculating user payout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's winning history
app.get('/api/user/:userAddress/winnings', async (req, res) => {
  try {
    const { userAddress } = req.params;

    const result = await pool.query(
      `SELECT 
        m.title,
        s.side,
        s.amount as stake,
        s.payout,
        m.winner,
        s.claimed,
        m.ends_at,
        s.created_at
      FROM stakes s
      JOIN markets m ON s.market_id = m.id
      WHERE s.user_wallet = $1 
        AND m.resolved = true
        AND s.side = m.winner
      ORDER BY m.ends_at DESC`,
      [userAddress]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching winnings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Distribute winnings (called by anyone after market resolves)
app.post('/api/markets/:marketId/distribute-winnings', async (req, res) => {
  try {
    const { marketId } = req.params;

    // Call smart contract distributeWinnings function
    // This will be implemented with ethers.js contract interaction
    
    res.json({ message: 'Winnings distribution triggered', marketId });
  } catch (error) {
    console.error('Error distributing winnings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PAYMENT REQUESTS API ENDPOINTS ==========

// Seed endpoint removed - no mock data

// Get all payment requests
app.get('/api/payment-requests', async (req, res) => {
  try {
    // Validate and normalize query parameters to prevent array issues
    // Express may pass arrays if multiple query params with same name are provided
    const getQueryParam = (param) => {
      const value = req.query[param];
      if (Array.isArray(value)) {
        // If multiple values provided, use the first one
        return value[0];
      }
      return value;
    };
    
    const status = getQueryParam('status');
    const requester_address = getQueryParam('requester_address');
    const requester_user_id = getQueryParam('requester_user_id'); // Filter by authenticated user ID (requests FROM user)
    const recipient_user_id = getQueryParam('recipient_user_id'); // Filter by recipient user ID (requests TO user)
    
    // Use Supabase client instead of direct PostgreSQL
    const { supabase } = require('./lib/supabase');
    
    let query = supabase
      .from('payment_requests')
      .select('*')
      .neq('status', 'cancelled') // Exclude cancelled requests
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }
    
    // Filter by requester_user_id if provided (for authenticated users - requests FROM user)
    if (requester_user_id && typeof requester_user_id === 'string') {
      query = query.eq('requester_user_id', requester_user_id);
    } else if (requester_address && typeof requester_address === 'string') {
      // Fallback to wallet address filtering if user_id not provided
      query = query.eq('requester_address', requester_address);
    }
    
    // Filter by recipient_user_id if provided (requests TO user)
    if (recipient_user_id && typeof recipient_user_id === 'string') {
      query = query.eq('recipient_user_id', recipient_user_id);
    }
    
    // Filter by recipient_user_id if provided (requests TO user)
    if (recipient_user_id && typeof recipient_user_id === 'string') {
      query = query.eq('recipient_user_id', recipient_user_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('Payment requests table does not exist yet. Run the migration first.');
        return res.json([]);
      }
      throw error;
    }
    
    // Fetch usernames for all unique requester user IDs (preferred) or addresses (fallback)
    if (data && data.length > 0) {
      const uniqueUserIds = [...new Set(data.map(r => r.requester_user_id).filter(Boolean))];
      const uniqueAddresses = [...new Set(data.map(r => r.requester_address))];
      
      // Fetch usernames from users table using user IDs (preferred)
      if (uniqueUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, first_name, last_name')
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          // Create a map of user_id -> user data
          const userMap = {};
          users.forEach(user => {
            userMap[user.id] = {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name
            };
          });
          
          // Add user data to each payment request
          data.forEach(request => {
            if (request.requester_user_id && userMap[request.requester_user_id]) {
              const user = userMap[request.requester_user_id];
              request.requester_username = user.username;
              request.requester_first_name = user.first_name;
              request.requester_last_name = user.last_name;
            }
          });
        }
      }
      
      // Fallback: fetch usernames by wallet address for requests without user_id
      const requestsWithoutUsername = data.filter(r => !r.requester_username);
      if (requestsWithoutUsername.length > 0) {
        const addressesToFetch = [...new Set(requestsWithoutUsername.map(r => r.requester_address))];
        const { data: usersByAddress, error: usersError } = await supabase
          .from('users')
          .select('wallet_address, username, first_name, last_name')
          .in('wallet_address', addressesToFetch);
        
        if (!usersError && usersByAddress) {
          // Create a map of address -> user data
          const addressUserMap = {};
          usersByAddress.forEach(user => {
            addressUserMap[user.wallet_address?.toLowerCase()] = {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name
            };
          });
          
          // Add user data to payment requests that don't have one yet
          data.forEach(request => {
            if (!request.requester_username && addressUserMap[request.requester_address?.toLowerCase()]) {
              const user = addressUserMap[request.requester_address?.toLowerCase()];
              request.requester_username = user.username;
              request.requester_first_name = user.first_name;
              request.requester_last_name = user.last_name;
            }
          });
        }
      }
      
      // Fetch usernames for payers (paid_by field)
      const paidByAddresses = [...new Set(data.map(r => r.paid_by).filter(Boolean))];
      if (paidByAddresses.length > 0) {
        const { data: payers, error: payersError } = await supabase
          .from('users')
          .select('wallet_address, username, first_name, last_name')
          .in('wallet_address', paidByAddresses);
        
        if (!payersError && payers) {
          // Create a map of address -> user data for payers
          const payerUserMap = {};
          payers.forEach(user => {
            payerUserMap[user.wallet_address?.toLowerCase()] = {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name
            };
          });
          
          // Add payer user data to each payment request
          data.forEach(request => {
            if (request.paid_by && payerUserMap[request.paid_by?.toLowerCase()]) {
              const user = payerUserMap[request.paid_by?.toLowerCase()];
              request.paid_by_username = user.username;
              request.paid_by_first_name = user.first_name;
              request.paid_by_last_name = user.last_name;
            }
          });
        }
      }
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching payment requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single payment request
app.get('/api/payment-requests/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    console.log('[PaymentRequestAPI] 📥 Fetching payment request', { requestId });
    
    // Use Supabase client instead of direct PostgreSQL
    const { supabase } = require('./lib/supabase');
    
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (error) {
      console.error('[PaymentRequestAPI] ❌ Error fetching payment request', {
        requestId,
        error: error.message,
        code: error.code
      });
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Payment request not found' });
      }
      throw error;
    }
    
    console.log('[PaymentRequestAPI] ✅ Payment request fetched', {
      requestId,
      status: data?.status,
      txHash: data?.tx_hash,
      paidBy: data?.paid_by
    });
    
    // Fetch user data for requester (prefer user_id, fallback to wallet_address)
    if (data) {
      if (data.requester_user_id) {
        // Fetch by user ID (preferred)
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('username, first_name, last_name')
          .eq('id', data.requester_user_id)
          .maybeSingle();
        
        if (!userError && user) {
          data.requester_username = user.username;
          data.requester_first_name = user.first_name;
          data.requester_last_name = user.last_name;
        }
      }
      
      // Fallback to wallet address if no username found yet
      if (!data.requester_username && data.requester_address) {
        const { data: userByAddress, error: userError } = await supabase
          .from('users')
          .select('username, first_name, last_name')
          .eq('wallet_address', data.requester_address)
          .maybeSingle();
        
        if (!userError && userByAddress) {
          data.requester_username = userByAddress.username;
          data.requester_first_name = userByAddress.first_name;
          data.requester_last_name = userByAddress.last_name;
        } else {
          data.requester_username = null;
        }
      }
      
      // Fetch user data for payer if paid
      if (data.paid_by) {
        const { data: payer, error: payerError } = await supabase
          .from('users')
          .select('username, first_name, last_name')
          .eq('wallet_address', data.paid_by)
          .maybeSingle();
        
        if (!payerError && payer) {
          data.paid_by_username = payer.username;
          data.paid_by_first_name = payer.first_name;
          data.paid_by_last_name = payer.last_name;
        }
      }
    }
    
    res.json(data);
  } catch (error) {
    console.error('[PaymentRequestAPI] ❌ Unexpected error fetching payment request', {
      requestId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
});

// Create payment request
app.post('/api/payment-requests', async (req, res) => {
  try {
    const {
      requesterAddress,
      requesterUserId, // Authenticated user ID from Supabase auth
      recipientUserId, // User ID of the recipient (if request is sent to specific user)
      amount,
      tokenSymbol = 'USDC',
      tokenAddress,
      chainId,
      chainName,
      caption
    } = req.body;
    
    // Validate required fields
    if (!requesterAddress || !amount || !tokenAddress || !chainId || !chainName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    // Use Supabase client instead of direct PostgreSQL for better reliability
    const { supabase } = require('./lib/supabase');
    
    const insertData = {
      requester_address: requesterAddress,
      amount: parseFloat(amount),
      token_symbol: tokenSymbol,
      token_address: tokenAddress,
      chain_id: chainId.toString(),
      chain_name: chainName,
      caption: caption || null,
      status: 'open'
    };
    
    // Add requester_user_id if provided (for authenticated users)
    if (requesterUserId) {
      insertData.requester_user_id = requesterUserId;
    }
    
    // Add recipient_user_id if provided (for requests sent to specific users)
    if (recipientUserId) {
      insertData.recipient_user_id = recipientUserId;
    }
    
    const { data, error } = await supabase
      .from('payment_requests')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating payment request:', error);
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update payment request status (mark as paid)
app.patch('/api/payment-requests/:id/paid', async (req, res) => {
  try {
    const { txHash, paidBy } = req.body;
    const requestId = req.params.id;
    
    console.log('[PaymentRequestAPI] 📝 Updating payment request status', {
      requestId,
      txHash,
      paidBy,
      hasTxHash: !!txHash,
      hasPaidBy: !!paidBy
    });
    
    if (!txHash || !paidBy) {
      console.error('[PaymentRequestAPI] ❌ Missing required fields', { txHash: !!txHash, paidBy: !!paidBy });
      return res.status(400).json({ error: 'Missing txHash or paidBy' });
    }
    
    // Use Supabase client for consistency and better error handling
    const { supabase } = require('./lib/supabase');
    
    // First, check if the request exists and is open
    const { data: existingRequest, error: fetchError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'open')
      .single();
    
    if (fetchError || !existingRequest) {
      console.error('[PaymentRequestAPI] ❌ Request not found or already paid', {
        requestId,
        error: fetchError?.message,
        exists: !!existingRequest
      });
      return res.status(404).json({ error: 'Payment request not found or already paid' });
    }
    
    console.log('[PaymentRequestAPI] ✅ Request found, updating status', {
      requestId,
      currentStatus: existingRequest.status
    });
    
    // Update the payment request
    // Use explicit timestamp to ensure consistency
    const paidAtTimestamp = new Date().toISOString();
    const updateData = {
      status: 'paid',
      paid_by: paidBy,
      tx_hash: txHash,
      paid_at: paidAtTimestamp
    };
    
    console.log('[PaymentRequestAPI] 🔄 Attempting database update', {
      requestId,
      updateData,
      timestamp: paidAtTimestamp
    });
    
    // First, try to update with status check (prevents race conditions)
    let { data: updatedRequest, error: updateError } = await supabase
      .from('payment_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('status', 'open') // Only update if still open (prevent race conditions)
      .select()
      .single();
    
    if (updateError) {
      console.error('[PaymentRequestAPI] ❌ Error updating payment request', {
        requestId,
        error: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      });
      throw updateError;
    }
    
    if (!updatedRequest) {
      console.error('[PaymentRequestAPI] ❌ Update returned no rows', { 
        requestId,
        possibleReasons: [
          'Request ID not found',
          'Status is already "paid" (race condition)',
          'Status was changed by another process'
        ]
      });
      
      // Try to fetch the current state to see what happened
      const { data: currentRequest } = await supabase
        .from('payment_requests')
        .select('status, tx_hash, paid_by')
        .eq('id', requestId)
        .single();
      
      console.log('[PaymentRequestAPI] 📊 Current request state', {
        requestId,
        currentStatus: currentRequest?.status,
        currentTxHash: currentRequest?.tx_hash,
        currentPaidBy: currentRequest?.paid_by
      });
      
      // If it's already paid, that's actually okay - return success
      if (currentRequest?.status === 'paid') {
        console.log('[PaymentRequestAPI] ✅ Request already marked as paid (concurrent update)', { 
          requestId,
          existingTxHash: currentRequest.tx_hash,
          newTxHash: txHash,
          matches: currentRequest.tx_hash === txHash
        });
        return res.json(currentRequest);
      }
      
      // If status is still 'open' but update failed, try updating without the status check
      // This handles edge cases where the status check might be too strict
      if (currentRequest?.status === 'open') {
        console.log('[PaymentRequestAPI] 🔄 Retrying update without status check', { requestId });
        const { data: retryUpdate, error: retryError } = await supabase
          .from('payment_requests')
          .update(updateData)
          .eq('id', requestId)
          .select()
          .single();
        
        if (!retryError && retryUpdate) {
          console.log('[PaymentRequestAPI] ✅ Retry update successful', {
            requestId,
            newStatus: retryUpdate.status
          });
          
          // Verify the update persisted
          const { data: verifyRetry } = await supabase
            .from('payment_requests')
            .select('status, tx_hash, paid_by, paid_at')
            .eq('id', requestId)
            .single();
          
          if (verifyRetry?.status === 'paid') {
            console.log('[PaymentRequestAPI] ✅ Retry update verified in database', {
              requestId,
              verifiedStatus: verifyRetry.status
            });
            return res.json(retryUpdate);
          } else {
            console.error('[PaymentRequestAPI] ❌ Retry update did not persist', {
              requestId,
              expectedStatus: 'paid',
              actualStatus: verifyRetry?.status
            });
          }
        } else {
          console.error('[PaymentRequestAPI] ❌ Retry update failed', {
            requestId,
            error: retryError?.message
          });
        }
      }
      
      // Last resort: Check if this transaction hash already exists (idempotency check)
      if (txHash) {
        const { data: existingPaidRequest } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('tx_hash', txHash)
          .single();
        
        if (existingPaidRequest && existingPaidRequest.id === requestId) {
          console.log('[PaymentRequestAPI] ✅ Transaction already recorded (idempotency)', {
            requestId,
            txHash,
            existingStatus: existingPaidRequest.status
          });
          return res.json(existingPaidRequest);
        }
      }
      
      return res.status(404).json({ error: 'Payment request not found or already paid' });
    }
    
    console.log('[PaymentRequestAPI] ✅ Payment request updated successfully', {
      requestId,
      newStatus: updatedRequest.status,
      txHash: updatedRequest.tx_hash,
      paidBy: updatedRequest.paid_by,
      paidAt: updatedRequest.paid_at
    });
    
    // Verify the update persisted by fetching it again
    const { data: verifyRequest, error: verifyError } = await supabase
      .from('payment_requests')
      .select('status, tx_hash, paid_by')
      .eq('id', requestId)
      .single();
    
    if (verifyError) {
      console.error('[PaymentRequestAPI] ⚠️ Verification fetch failed', {
        requestId,
        error: verifyError.message
      });
    } else {
      console.log('[PaymentRequestAPI] ✅ Verification - status persisted', {
        requestId,
        verifiedStatus: verifyRequest.status,
        verifiedTxHash: verifyRequest.tx_hash
      });
    }
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('[PaymentRequestAPI] ❌ Unexpected error updating payment request', {
      error: error.message,
      stack: error.stack,
      requestId: req.params.id
    });
    res.status(500).json({ error: error.message || 'Failed to update payment request status' });
  }
});

// Delete payment request (cancel)
app.delete('/api/payment-requests/:id', async (req, res) => {
  try {
    const { requesterAddress } = req.body;
    
    if (!requesterAddress) {
      return res.status(400).json({ error: 'Missing requesterAddress' });
    }
    
    // Use Supabase client instead of direct PostgreSQL
    const { supabase } = require('./lib/supabase');
    
    // First, verify the request exists and belongs to the requester
    const { data: existingRequest, error: fetchError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', req.params.id)
      .eq('requester_address', requesterAddress)
      .eq('status', 'open')
      .single();
    
    if (fetchError || !existingRequest) {
      return res.status(404).json({ error: 'Payment request not found or cannot be deleted' });
    }
    
    // Delete the request completely
    const { error } = await supabase
      .from('payment_requests')
      .delete()
      .eq('id', req.params.id)
      .eq('requester_address', requesterAddress)
      .eq('status', 'open');
    
    if (error) {
      throw error;
    }
    
    res.json({ message: 'Payment request deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel endpoint (kept for backward compatibility, but now deletes)
app.patch('/api/payment-requests/:id/cancel', async (req, res) => {
  try {
    const { requesterAddress } = req.body;
    
    if (!requesterAddress) {
      return res.status(400).json({ error: 'Missing requesterAddress' });
    }
    
    // Use Supabase client instead of direct PostgreSQL
    const { supabase } = require('./lib/supabase');
    
    // First, verify the request exists and belongs to the requester
    const { data: existingRequest, error: fetchError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', req.params.id)
      .eq('requester_address', requesterAddress)
      .eq('status', 'open')
      .single();
    
    if (fetchError || !existingRequest) {
      return res.status(404).json({ error: 'Payment request not found or cannot be cancelled' });
    }
    
    // Delete the request completely instead of marking as cancelled
    const { error } = await supabase
      .from('payment_requests')
      .delete()
      .eq('id', req.params.id)
      .eq('requester_address', requesterAddress)
      .eq('status', 'open');
    
    if (error) {
      throw error;
    }
    
    res.json({ message: 'Payment request deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment request:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PREFERRED WALLETS ENDPOINTS ==========

// Get preferred wallets for a user
app.get('/api/preferred-wallets', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const { supabase } = require('./lib/supabase');

    const { data, error } = await supabase
      .from('preferred_wallets')
      .select('*')
      .eq('user_id', userId)
      .order('chain_id', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching preferred wallets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update preferred wallet
app.post('/api/preferred-wallets', async (req, res) => {
  try {
    console.log('[PreferredWalletsAPI] ========== NEW REQUEST ==========');
    console.log('[PreferredWalletsAPI] Full request body:', JSON.stringify(req.body, null, 2));
    
    const { userId, chainId, receivingWalletAddress } = req.body;

    console.log('[PreferredWalletsAPI] Request received:', {
      userId: userId ? 'present' : 'missing',
      chainId,
      chainIdType: typeof chainId,
      chainIdString: String(chainId),
      chainIdLowercase: String(chainId).toLowerCase(),
      receivingWalletAddress: receivingWalletAddress ? `${receivingWalletAddress.substring(0, 10)}...` : 'missing',
      addressLength: receivingWalletAddress?.length,
      fullBody: JSON.stringify(req.body)
    });

    if (!userId || !chainId || !receivingWalletAddress) {
      console.error('[PreferredWalletsAPI] Missing required fields:', {
        hasUserId: !!userId,
        hasChainId: !!chainId,
        hasAddress: !!receivingWalletAddress
      });
      return res.status(400).json({ error: 'Missing required fields: userId, chainId, receivingWalletAddress' });
    }

    // Validate chain ID
    const chainIdNum = parseInt(String(chainId).trim(), 10);
    const validChainIds = [8453, 1, 56, 137]; // Base, Ethereum, BNB, Polygon
    
    if (isNaN(chainIdNum) || !validChainIds.includes(chainIdNum)) {
      console.error('[PreferredWalletsAPI] ❌ Invalid chain ID:', {
        received: chainId,
        parsed: chainIdNum,
        validChains: validChainIds
      });
      return res.status(400).json({ 
        error: `Invalid chain ID: ${chainId}. Valid chain IDs are: 8453 (Base), 1 (Ethereum), 56 (BNB), 137 (Polygon)` 
      });
    }

    // Validate wallet address format (EVM addresses must be 0x followed by 40 hex characters)
    if (!/^0x[a-fA-F0-9]{40}$/.test(receivingWalletAddress)) {
      console.error('[PreferredWalletsAPI] Invalid address format:', receivingWalletAddress.substring(0, 20));
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const { supabase } = require('./lib/supabase');

    // First, check if wallet already exists for this user/chain
    // Note: chain_id is stored as string in database
    const chainIdStr = String(chainId);
    const { data: existing } = await supabase
      .from('preferred_wallets')
      .select('id')
      .eq('user_id', userId)
      .eq('chain_id', chainIdStr)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('preferred_wallets')
        .update({
          receiving_wallet_address: receivingWalletAddress.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('preferred_wallets')
        .insert({
          user_id: userId,
          chain_id: chainIdStr,
          receiving_wallet_address: receivingWalletAddress.toLowerCase()
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    res.json(result);
  } catch (error) {
    console.error('Error saving preferred wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete preferred wallet
app.delete('/api/preferred-wallets/:id', async (req, res) => {
  try {
    const walletId = req.params.id;

    if (!walletId) {
      return res.status(400).json({ error: 'Missing wallet ID' });
    }

    const { supabase } = require('./lib/supabase');

    const { error } = await supabase
      .from('preferred_wallets')
      .delete()
      .eq('id', walletId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Preferred wallet deleted successfully' });
  } catch (error) {
    console.error('Error deleting preferred wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get preferred wallets for a specific user (for payment sending)
app.get('/api/preferred-wallets/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const { supabase } = require('./lib/supabase');

    const { data, error } = await supabase
      .from('preferred_wallets')
      .select('*')
      .eq('user_id', userId)
      .order('chain_id', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching user preferred wallets:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PAYMENT SENDS ENDPOINTS ==========

// Create payment send (record of a direct payment)
app.post('/api/payment-sends', async (req, res) => {
  try {
    console.log('[PaymentSendsAPI] 📥 POST /api/payment-sends - Request received');
    console.log('[PaymentSendsAPI] Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      senderAddress,
      senderUserId,
      recipientAddress,
      recipientUserId,
      amount,
      tokenSymbol = 'USDC',
      tokenAddress,
      chainId,
      chainName,
      caption,
      txHash
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!senderAddress) missingFields.push('senderAddress');
    if (!recipientAddress) missingFields.push('recipientAddress');
    if (!amount) missingFields.push('amount');
    if (!tokenAddress) missingFields.push('tokenAddress');
    if (!chainId) missingFields.push('chainId');
    if (!chainName) missingFields.push('chainName');
    if (!txHash) missingFields.push('txHash');

    if (missingFields.length > 0) {
      console.error('[PaymentSendsAPI] ❌ Missing required fields:', missingFields);
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const { supabase } = require('./lib/supabase');

    const insertData = {
      sender_address: senderAddress,
      recipient_address: recipientAddress,
      amount: parseFloat(amount),
      token_symbol: tokenSymbol,
      token_address: tokenAddress,
      chain_id: chainId.toString(),
      chain_name: chainName,
      caption: caption || null,
      status: 'pending', // Will be updated to 'confirmed' when transaction is confirmed
      tx_hash: txHash
    };

    if (senderUserId) {
      insertData.sender_user_id = senderUserId;
    }

    if (recipientUserId) {
      insertData.recipient_user_id = recipientUserId;
    }

    console.log('[PaymentSendsAPI] 📤 Inserting payment send into database:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('payment_sends')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[PaymentSendsAPI] ❌ Error creating payment send:', error);
      console.error('[PaymentSendsAPI] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('[PaymentSendsAPI] ✅ Payment send created successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Error creating payment send:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment sends
app.get('/api/payment-sends', async (req, res) => {
  try {
    const { sender_user_id, recipient_user_id, sender_address, recipient_address, status, txHash } = req.query;

    console.log('[PaymentSendsAPI] Fetching payment sends', { sender_user_id, recipient_user_id, sender_address, recipient_address, status, txHash });

    const { supabase } = require('./lib/supabase');

    let query = supabase
      .from('payment_sends')
      .select('*')
      .order('created_at', { ascending: false });

    if (sender_user_id) {
      query = query.eq('sender_user_id', sender_user_id);
    }

    if (recipient_user_id) {
      query = query.eq('recipient_user_id', recipient_user_id);
    }

    if (sender_address) {
      query = query.eq('sender_address', sender_address);
    }

    if (recipient_address) {
      query = query.eq('recipient_address', recipient_address);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (txHash) {
      query = query.eq('tx_hash', txHash);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PaymentSendsAPI] Error fetching payment sends:', error);
      throw error;
    }

    console.log('[PaymentSendsAPI] Found payment sends:', data?.length || 0, data);

    // Fetch user data for sender and recipient
    if (data && data.length > 0) {
      const uniqueSenderIds = [...new Set(data.map(s => s.sender_user_id).filter(Boolean))];
      const uniqueRecipientIds = [...new Set(data.map(s => s.recipient_user_id).filter(Boolean))];
      const allUserIds = [...uniqueSenderIds, ...uniqueRecipientIds];
      
      if (allUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, first_name, last_name')
          .in('id', allUserIds);
        
        if (!usersError && users) {
          // Create maps of user_id -> user data
          const userMap = {};
          users.forEach(user => {
            userMap[user.id] = {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name
            };
          });
          
          // Add user data to each payment send
          data.forEach(send => {
            if (send.sender_user_id && userMap[send.sender_user_id]) {
              const user = userMap[send.sender_user_id];
              send.sender_username = user.username;
              send.sender_first_name = user.first_name;
              send.sender_last_name = user.last_name;
            }
            if (send.recipient_user_id && userMap[send.recipient_user_id]) {
              const user = userMap[send.recipient_user_id];
              send.recipient_username = user.username;
              send.recipient_first_name = user.first_name;
              send.recipient_last_name = user.last_name;
            }
          });
        }
      }
      
      // Fallback: fetch user data by wallet address for sends without names
      const sendsNeedingSenderLookup = data.filter(s => 
        (!s.sender_first_name || !s.sender_last_name) && 
        s.sender_address
      );
      const sendsNeedingRecipientLookup = data.filter(s => 
        (!s.recipient_first_name || !s.recipient_last_name) && 
        s.recipient_address
      );
      
      if (sendsNeedingSenderLookup.length > 0 || sendsNeedingRecipientLookup.length > 0) {
        const addressesToFetch = [
          ...new Set([
            ...sendsNeedingSenderLookup.map(s => s.sender_address),
            ...sendsNeedingRecipientLookup.map(s => s.recipient_address)
          ])
        ].filter(Boolean);
        
        console.log('[PaymentSendsAPI] 🔍 Looking up users by wallet address:', addressesToFetch);
        
        if (addressesToFetch.length > 0) {
          const { data: usersByAddress, error: usersError } = await supabase
            .from('users')
            .select('wallet_address, username, first_name, last_name')
            .in('wallet_address', addressesToFetch);
          
          console.log('[PaymentSendsAPI] 📋 Users found by address:', usersByAddress?.length || 0, usersByAddress);
          
          if (!usersError && usersByAddress) {
            // Create a map of address -> user data (case-insensitive)
            const addressUserMap = {};
            usersByAddress.forEach(user => {
              if (user.wallet_address) {
                addressUserMap[user.wallet_address.toLowerCase()] = {
                  username: user.username,
                  first_name: user.first_name,
                  last_name: user.last_name
                };
              }
            });
            
            // Add user data to payment sends that don't have it yet
            data.forEach(send => {
              if (send.sender_address) {
                const senderKey = send.sender_address.toLowerCase();
                if ((!send.sender_first_name || !send.sender_last_name) && addressUserMap[senderKey]) {
                  const user = addressUserMap[senderKey];
                  send.sender_username = user.username || send.sender_username;
                  send.sender_first_name = user.first_name || send.sender_first_name;
                  send.sender_last_name = user.last_name || send.sender_last_name;
                  console.log('[PaymentSendsAPI] ✅ Added sender name for', send.sender_address, ':', user.first_name, user.last_name);
                }
              }
              if (send.recipient_address) {
                const recipientKey = send.recipient_address.toLowerCase();
                if ((!send.recipient_first_name || !send.recipient_last_name) && addressUserMap[recipientKey]) {
                  const user = addressUserMap[recipientKey];
                  send.recipient_username = user.username || send.recipient_username;
                  send.recipient_first_name = user.first_name || send.recipient_first_name;
                  send.recipient_last_name = user.last_name || send.recipient_last_name;
                  console.log('[PaymentSendsAPI] ✅ Added recipient name for', send.recipient_address, ':', user.first_name, user.last_name);
                }
              }
            });
          }
        }
      }
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching payment sends:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update payment send status (mark as confirmed)
app.patch('/api/payment-sends/:id/confirmed', async (req, res) => {
  try {
    const { id } = req.params;
    const { txHash } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing payment send ID' });
    }

    const { supabase } = require('./lib/supabase');

    const updateData = {
      status: 'confirmed',
      confirmed_at: new Date().toISOString()
    };

    if (txHash) {
      updateData.tx_hash = txHash;
    }

    const { data, error } = await supabase
      .from('payment_sends')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating payment send:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for CoinGecko API to avoid CORS issues
app.get('/api/crypto-price', async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Missing ids parameter' });
    }
    
    // Create HTTPS agent with proper SSL handling
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // Allow self-signed certificates (for development)
      // On macOS, sometimes the certificate chain isn't properly configured
      // This allows the connection while still using HTTPS
    });
    
    // Retry logic: try up to 3 times with exponential backoff
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: {
            ids: ids,
            vs_currencies: 'usd'
          },
          timeout: 20000, // 20 second timeout
          httpsAgent: httpsAgent,
          // Add headers to help with rate limiting
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; CryptoApp/1.0)'
          }
        });
        
        // Success - return the data
        return res.json(response.data);
      } catch (attemptError) {
        lastError = attemptError;
        
        // If it's a rate limit error (429), wait longer
        if (attemptError.response?.status === 429) {
          const retryAfter = attemptError.response.headers['retry-after'] || (attempt * 2);
          console.log(`Rate limited. Waiting ${retryAfter} seconds before retry ${attempt}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        
        // If it's a 403 (blocked/forbidden), try fallback price APIs
        if (attemptError.response?.status === 403) {
          console.log('CoinGecko API blocked (403). Trying fallback price APIs...');
          
          // Fallback 1: Try Binance API (no API key required for public endpoints)
          try {
            const binanceSymbols = {
              'usd-coin': 'USDCUSDT',
              'tether': 'USDTUSDT',
              'ethereum': 'ETHUSDT',
              'bitcoin': 'BTCUSDT',
              'binancecoin': 'BNBUSDT',
              'matic-network': 'MATICUSDT',
              'avalanche-2': 'AVAXUSDT',
              'dai': 'DAIUSDT',
              'weth': 'ETHUSDT',
              'wrapped-bitcoin': 'BTCUSDT'
            };
            
            // Try to map CoinGecko IDs to Binance symbols
            const idArray = Array.isArray(ids) ? ids : ids.split(',');
            const binancePrices = {};
            
            for (const id of idArray) {
              const symbol = binanceSymbols[id.trim()];
              if (symbol) {
                try {
                  const binanceResponse = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
                    timeout: 10000,
                    httpsAgent: httpsAgent
                  });
                  
                  if (binanceResponse.data && binanceResponse.data.price) {
                    // Binance returns price in USDT, convert to USD (usually 1:1)
                    binancePrices[id.trim()] = {
                      usd: parseFloat(binanceResponse.data.price)
                    };
                  }
                } catch (binErr) {
                  console.log(`Binance fallback failed for ${id}:`, binErr.message);
                }
              }
            }
            
            // If we got at least one price from Binance, return it
            if (Object.keys(binancePrices).length > 0) {
              console.log(`✅ Using Binance fallback for ${Object.keys(binancePrices).length} token(s)`);
              return res.json(binancePrices);
            }
          } catch (binanceError) {
            console.log('Binance fallback failed:', binanceError.message);
          }
          
          // If all fallbacks fail, try using cached/default prices as last resort
          console.log('All APIs blocked. Using default/cached prices as fallback...');
          const defaultPrices = {
            'usd-coin': { usd: 1.0 },
            'usdc': { usd: 1.0 },
            'tether': { usd: 1.0 },
            'usdt': { usd: 1.0 },
            'ethereum': { usd: 3000.0 },
            'eth': { usd: 3000.0 },
            'bitcoin': { usd: 45000.0 },
            'btc': { usd: 45000.0 },
            'sol': { usd: 100.0 },
            'binancecoin': { usd: 300.0 },
            'bnb': { usd: 300.0 },
            'matic-network': { usd: 0.8 },
            'matic': { usd: 0.8 },
            'avalanche-2': { usd: 35.0 },
            'avax': { usd: 35.0 },
            'dai': { usd: 1.0 },
            'weth': { usd: 3000.0 },
            'wrapped-bitcoin': { usd: 45000.0 }
          };
          
          const idArray = Array.isArray(ids) ? ids : ids.split(',');
          const fallbackPrices = {};
          let foundAny = false;
          
          for (const id of idArray) {
            const cleanId = id.trim().toLowerCase();
            if (defaultPrices[cleanId]) {
              fallbackPrices[cleanId] = defaultPrices[cleanId];
              foundAny = true;
            }
          }
          
          if (foundAny) {
            console.log(`⚠️ Using default prices for ${Object.keys(fallbackPrices).length} token(s) - prices may be outdated`);
            return res.json({
              ...fallbackPrices,
              _warning: 'Using default prices - network blocked price APIs. Prices may be outdated.',
              _timestamp: new Date().toISOString()
            });
          }
          
          // If no default prices available, return error
          return res.status(503).json({
            error: 'Price APIs unavailable',
            details: 'CoinGecko and fallback APIs are blocked by your network. Default prices not available for requested tokens.',
            message: 'Unable to fetch prices. Your network appears to be blocking crypto price APIs.',
            suggestion: 'Try: 1) Disable VPN if using one, 2) Use a different network, 3) Contact your network administrator if on a corporate network.',
            tokens_requested: idArray
          });
        }
        
        // If it's a network/timeout error and we have retries left, wait and retry
        if ((attemptError.code === 'ECONNRESET' || 
             attemptError.code === 'ETIMEDOUT' || 
             attemptError.code === 'ENOTFOUND' ||
             attemptError.code === 'ECONNREFUSED' ||
             attemptError.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
             attemptError.code === 'CERT_HAS_EXPIRED' ||
             attemptError.message?.includes('certificate') ||
             !attemptError.response) && attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`Network/SSL error (${attemptError.code || attemptError.message || 'unknown'}). Retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // If it's the last attempt or a non-retryable error, throw
        throw attemptError;
      }
    }
    
    // If we get here, all retries failed
    throw lastError;
    
  } catch (error) {
    console.error('Error fetching crypto price after retries:', error.message);
    console.error('Error details:', {
      code: error.code,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response) {
      // API returned an error response
      const status = error.response.status;
      let message = 'API returned an error';
      let suggestion = '';
      
      if (status === 403) {
        message = 'CoinGecko API is blocked by your network or firewall';
        suggestion = 'This may be due to DNS filtering, corporate firewall, or geographic restrictions. Try using a different network or VPN.';
      } else if (status === 429) {
        message = 'Rate limit exceeded. Please try again in a moment.';
      } else if (status === 404) {
        message = 'Token not found. Please check the token ID.';
      }
      
      res.status(status).json({ 
        error: 'CoinGecko API error', 
        details: typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : error.response.data,
        message: message,
        suggestion: suggestion
      });
    } else if (error.request || error.code || error.message?.includes('certificate')) {
      // Network error, SSL error, or connection issue
      const isSSLError = error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || 
                         error.code === 'CERT_HAS_EXPIRED' ||
                         error.message?.includes('certificate') ||
                         error.message?.includes('SSL');
      
      res.status(503).json({ 
        error: 'CoinGecko API unavailable', 
        details: isSSLError 
          ? `SSL certificate error: ${error.message || error.code}`
          : `Network error: ${error.code || error.message || 'Connection failed'}`,
        message: isSSLError
          ? 'SSL certificate verification failed. This may be due to network configuration issues.'
          : 'Unable to reach CoinGecko API. Please check your internet connection and try again.',
        suggestion: isSSLError
          ? 'If you are on a corporate network, contact your IT department. Otherwise, try using a different network.'
          : 'Check your internet connection and firewall settings.'
      });
    } else {
      // Other error
      res.status(500).json({ 
        error: 'Failed to fetch crypto price', 
        details: error.message,
        message: 'An unexpected error occurred while fetching prices.'
      });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

