const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'opinion_market',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const mockMarkets = [
  {
    creator_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    title: 'Drake > Kendrick Lamar',
    description: 'Who has better overall catalog and flow? Drake with his commercial success or Kendrick with his lyrical mastery?',
    category: 'music',
    agree_label: 'Drake',
    disagree_label: 'Kendrick',
    total_agree_stakes: '125000.50',
    total_disagree_stakes: '98750.25',
    ends_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    smart_contract_address: '0x0000000000000000000000000000000000000000',
    token_type: 'USDC'
  },
  {
    creator_address: '0x8ba1f109551bD432803012645Hac136c2C1c',
    title: 'Bitcoin will hit $100k by end of 2024',
    description: 'With ETF approvals and halving approaching, will Bitcoin break the $100k barrier this year?',
    category: 'other',
    agree_label: 'Yes, $100k+',
    disagree_label: 'No, below $100k',
    total_agree_stakes: '245000.00',
    total_disagree_stakes: '189250.75',
    ends_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    smart_contract_address: '0x0000000000000000000000000000000000000000',
    token_type: 'USDC'
  },
  {
    creator_address: '0x5c0d3b8a7d9e1F2f4a6B8d5e4c7a3B9d1E2f4a6',
    title: 'Taylor Swift is the greatest pop artist of all time',
    description: 'Her longevity, album sales, and cultural impact make her unmatched in pop music history.',
    category: 'music',
    agree_label: 'Swift',
    disagree_label: 'Others',
    total_agree_stakes: '87500.00',
    total_disagree_stakes: '112500.50',
    ends_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    smart_contract_address: '0x0000000000000000000000000000000000000000',
    token_type: 'USDC'
  },
  {
    creator_address: '0x3a7b9c2d4e5f6a8b9c1d2e3f4a5b6c7d8e9f0a1b',
    title: 'LeBron James > Michael Jordan',
    description: 'The GOAT debate continues. LeBron vs MJ based on career achievements and dominance.',
    category: 'sports',
    agree_label: 'LeBron',
    disagree_label: 'Jordan',
    total_agree_stakes: '156250.25',
    total_disagree_stakes: '231500.00',
    ends_at: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
    smart_contract_address: '0x0000000000000000000000000000000000000000',
    token_type: 'USDC'
  },
  {
    creator_address: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
    title: 'AI will replace 50% of jobs by 2030',
    description: 'Will artificial intelligence and automation displace half of current workforce positions?',
    category: 'other',
    agree_label: 'Yes, 50%+ replaced',
    disagree_label: 'No, less than 50%',
    total_agree_stakes: '98750.50',
    total_disagree_stakes: '134250.75',
    ends_at: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
    smart_contract_address: '0x0000000000000000000000000000000000000000',
    token_type: 'USDC'
  },
  {
    creator_address: '0x2b4d6f8a9c1e3d5f7b9a2c4e6f8a1b3d5c7e9f2b',
    title: 'The Sopranos > Breaking Bad',
    description: 'Which TV series is the better crime drama masterpiece?',
    category: 'pop-culture',
    agree_label: 'The Sopranos',
    disagree_label: 'Breaking Bad',
    total_agree_stakes: '67890.00',
    total_disagree_stakes: '85620.50',
    ends_at: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
    smart_contract_address: '0x0000000000000000000000000000000000000000',
    token_type: 'USDT'
  }
];

async function seedMockData() {
  try {
    console.log('🌱 Seeding mock data...');

    // Create mock users first
    const userAddresses = [...new Set(mockMarkets.map(m => m.creator_address))];
    
    for (const address of userAddresses) {
      await pool.query(
        `INSERT INTO users (wallet_address, username, markets_created, total_staked, total_earnings)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (wallet_address) DO NOTHING`,
        [
          address,
          `user_${address.slice(0, 6)}`,
          1,
          1000,
          500
        ]
      );
    }

    // Insert mock markets
    for (const market of mockMarkets) {
      const result = await pool.query(
        `INSERT INTO markets (
          creator_address, title, description, category, agree_label, 
          disagree_label, ends_at, total_agree_stakes, total_disagree_stakes,
          smart_contract_address, token_type, resolved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
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
          market.token_type,
          false
        ]
      );

      console.log(`✅ Created market: ${market.title}`);
    }

    console.log('✅ Mock data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    process.exit(1);
  }
}

seedMockData();
