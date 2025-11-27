// Test Supabase database connection
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Testing Supabase Database Connection...\n');
console.log('Configuration:');
console.log('  Host:', process.env.DB_HOST || 'not set');
console.log('  User:', process.env.DB_USER || 'not set');
console.log('  Database:', process.env.DB_NAME || 'not set');
console.log('  Port:', process.env.DB_PORT || 'not set');
console.log('  Has Password:', process.env.DB_PASSWORD ? 'Yes' : 'No');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('');

// Try connection with individual parameters
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'db.robjixmkmrmryrqzivdd.supabase.co',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'Kushal@13',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

console.log('Attempting connection...');

pool.query('SELECT NOW() as time, current_database() as db, version() as version')
  .then(result => {
    console.log('✅ Connection successful!\n');
    console.log('Database:', result.rows[0].db);
    console.log('Server time:', result.rows[0].time);
    console.log('PostgreSQL:', result.rows[0].version.split(',')[0]);
    
    return pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  })
  .then(result => {
    console.log(`\n📊 Tables found: ${result.rows.length}`);
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`  ✓ ${row.tablename}`);
      });
    } else {
      console.log('  ⚠️  No tables found. Run COMPLETE_SUPABASE_SCHEMA.sql in Supabase SQL Editor.');
    }
    
    return pool.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'");
  })
  .then(result => {
    console.log(`\n✅ Database is ready!`);
    console.log(`\nNext steps:`);
    console.log(`1. If no tables exist, run COMPLETE_SUPABASE_SCHEMA.sql in Supabase SQL Editor`);
    console.log(`2. Restart your backend server: npm start`);
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    
    if (err.code === 'ENOTFOUND') {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. DNS lookup failed - hostname might be incorrect');
      console.error('2. Check your Supabase dashboard → Settings → Database');
      console.error('3. Copy the connection string from "Connection string" section');
      console.error('4. Make sure the database is fully provisioned');
      console.error('\n💡 Try using the Connection Pooler instead:');
      console.error('   Host: aws-0-us-east-1.pooler.supabase.com');
      console.error('   Port: 6543');
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Connection timeout - check firewall/network settings');
      console.error('2. Verify IP allowlist in Supabase Settings → Database');
      console.error('3. Try using Connection Pooler (port 6543)');
    } else if (err.code === '28P01') {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Authentication failed - check password');
      console.error('2. Password contains @ - make sure it\'s URL encoded as %40 in connection string');
    }
    
    process.exit(1);
  });



