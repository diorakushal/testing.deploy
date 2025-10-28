const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cron = require('node-cron');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection (Supabase)
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'aws-0-us-east-1.pooler.supabase.com',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 6543, // Using connection pooler port
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Web3 provider
const provider = new ethers.JsonRpcProvider(
  process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
);

const marketContractAddress = process.env.MARKET_CONTRACT_ADDRESS;
const ABI = require('./contracts/KOI.json');

// ========== API ROUTES ==========

// Get markets feed
app.get('/api/markets', async (req, res) => {
  try {
    const { sort = 'trending', category, status = 'active' } = req.query;
    
    let query = `
      SELECT * FROM markets 
      WHERE resolved = $1
    `;
    const params = [status === 'resolved'];
    
    if (category) {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

