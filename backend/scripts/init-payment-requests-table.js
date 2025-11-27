/**
 * Initialize Payment Requests Table
 * Creates the payment_requests table if it doesn't exist
 * 
 * Run with: node backend/scripts/init-payment-requests-table.js
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

async function initTable() {
  try {
    console.log('Initializing payment_requests table...');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payment_requests'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ payment_requests table already exists');
      
      // Check if we need to alter chain_id column
      const columnCheck = await pool.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'payment_requests' 
        AND column_name = 'chain_id';
      `);
      
      if (columnCheck.rows.length > 0 && columnCheck.rows[0].data_type === 'integer') {
        console.log('Updating chain_id column to VARCHAR(50) for Solana support...');
        await pool.query(`
          ALTER TABLE payment_requests 
          ALTER COLUMN chain_id TYPE VARCHAR(50);
        `);
        console.log('✅ Updated chain_id column to VARCHAR(50)');
      }
    } else {
      // Create table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          requester_address VARCHAR(255) NOT NULL,
          amount NUMERIC(20, 6) NOT NULL,
          token_symbol VARCHAR(10) DEFAULT 'USDC',
          token_address VARCHAR(255) NOT NULL,
          chain_id VARCHAR(50) NOT NULL,
          chain_name VARCHAR(50) NOT NULL,
          caption TEXT,
          status VARCHAR(20) DEFAULT 'open',
          paid_by VARCHAR(255),
          tx_hash VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          paid_at TIMESTAMP
        );
      `);

      // Create indexes
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_payment_requests_requester 
        ON payment_requests(requester_address);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_payment_requests_status 
        ON payment_requests(status);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at 
        ON payment_requests(created_at DESC);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_payment_requests_tx_hash 
        ON payment_requests(tx_hash);
      `);

      console.log('✅ Created payment_requests table and indexes');
    }

    // Verify table structure
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payment_requests'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTable structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error initializing table:', error);
    process.exit(1);
  }
}

initTable();





