/**
 * Seed Payment Requests
 * Creates sample payment requests for testing
 * 
 * Run with: node backend/scripts/seed-payment-requests.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'aws-0-us-east-1.pooler.supabase.com',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 6543,
  ssl: {
    rejectUnauthorized: false
  }
});

const mockPaymentRequests = [
  {
    requester_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    amount: 50,
    token_symbol: 'USDC',
    token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    chain_id: 8453,
    chain_name: 'Base',
    caption: 'tacos 🌮',
    status: 'open'
  },
  {
    requester_address: '0x8ba1f109551bD432803012645Hac136c2C1c',
    amount: 25,
    token_symbol: 'USDC',
    token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    chain_id: 8453,
    chain_name: 'Base',
    caption: 'Rent share for this month',
    status: 'open'
  },
  {
    requester_address: '0x5c0d3b8a7d9e1F2f4a6B8d5e4c7a3B9d1E2f4a6',
    amount: 100,
    token_symbol: 'USDC',
    token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    chain_id: 8453,
    chain_name: 'Base',
    caption: 'Design commission',
    status: 'open'
  },
  {
    requester_address: '0x3a7b9c2d4e5f6a8b9c1d2e3f4a5b6c7d8e9f0a1b',
    amount: 75,
    token_symbol: 'USDC',
    token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    chain_id: 8453,
    chain_name: 'Base',
    caption: 'Pay me back for drinks',
    status: 'paid',
    paid_by: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0',
    tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  },
  {
    requester_address: '0x2b4d6f8a9c1e3d5f7b9a2c4e6f8a1b3d5c7e9f2b',
    amount: 200,
    token_symbol: 'USDC',
    token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    chain_id: 8453,
    chain_name: 'Base',
    caption: 'Freelance work completed',
    status: 'paid',
    paid_by: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  }
];

async function seedPaymentRequests() {
  try {
    console.log('Seeding payment requests...');

    for (const request of mockPaymentRequests) {
      await pool.query(
        `INSERT INTO payment_requests (
          requester_address, amount, token_symbol, token_address, 
          chain_id, chain_name, caption, status, paid_by, tx_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING`,
        [
          request.requester_address,
          request.amount,
          request.token_symbol,
          request.token_address,
          request.chain_id,
          request.chain_name,
          request.caption,
          request.status,
          request.paid_by || null,
          request.tx_hash || null
        ]
      );
    }

    console.log(`✅ Seeded ${mockPaymentRequests.length} payment requests`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding payment requests:', error);
    process.exit(1);
  }
}

seedPaymentRequests();



