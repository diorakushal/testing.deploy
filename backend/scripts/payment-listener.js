/**
 * Payment Request Event Listener
 * 
 * Monitors ERC-20 Transfer events on Base to detect payments to payment request addresses
 * and automatically mark requests as paid.
 * 
 * Run with: node backend/scripts/payment-listener.js
 */

const { ethers } = require('ethers');
const { Pool } = require('pg');
require('dotenv').config();

// ERC20 Transfer event signature
const TRANSFER_EVENT = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Base mainnet RPC
const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const provider = new ethers.JsonRpcProvider(BASE_RPC);

// Database connection
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

// USDC address on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// ERC20 ABI (just Transfer event)
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

async function checkPaymentRequests() {
  try {
    // Get all open payment requests for Base
    const result = await pool.query(
      `SELECT * FROM payment_requests 
       WHERE status = 'open' 
       AND chain_id = 8453 
       AND token_address = $1
       ORDER BY created_at DESC`,
      [USDC_ADDRESS]
    );

    if (result.rows.length === 0) {
      return;
    }

    console.log(`Checking ${result.rows.length} open payment requests...`);

    const contract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

    for (const request of result.rows) {
      try {
        // Check recent blocks for transfers to this requester address
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(currentBlock - 1000, 0); // Check last 1000 blocks

        const filter = contract.filters.Transfer(null, request.requester_address);
        const events = await contract.queryFilter(filter, fromBlock, currentBlock);

        for (const event of events) {
          // Check if this transfer matches the request amount (within 0.01 USDC tolerance)
          const amount = parseFloat(ethers.formatUnits(event.args.value, 6));
          const requestAmount = parseFloat(request.amount);
          const tolerance = 0.01;

          if (Math.abs(amount - requestAmount) <= tolerance) {
            // Check if this request hasn't been paid yet
            const checkResult = await pool.query(
              'SELECT status FROM payment_requests WHERE id = $1',
              [request.id]
            );

            if (checkResult.rows[0]?.status === 'open') {
              // Mark as paid
              await pool.query(
                `UPDATE payment_requests 
                 SET status = 'paid', 
                     paid_by = $1, 
                     tx_hash = $2, 
                     paid_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [event.args.from, event.transactionHash, request.id]
              );

              console.log(`✅ Payment detected for request ${request.id}: ${amount} USDC from ${event.args.from}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error checking request ${request.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error in checkPaymentRequests:', error);
  }
}

// Run every 30 seconds
console.log('Payment listener started. Checking every 30 seconds...');
setInterval(checkPaymentRequests, 30000);

// Run immediately
checkPaymentRequests();

