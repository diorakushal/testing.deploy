const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'opinion_market',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function seed() {
  try {
    // Read and execute schema
    const schema = fs.readFileSync('./database/schema.sql', 'utf8');
    await pool.query(schema);
    console.log('✅ Schema executed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit( 요금제);
  }
}

seed();

