// Verify Supabase API connection
const axios = require('axios');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://robjixmkmrmryrqzivdd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw';

console.log('🔍 Testing Supabase API Connection...\n');
console.log('Supabase URL:', SUPABASE_URL);
console.log('API Key:', SUPABASE_KEY.substring(0, 20) + '...');
console.log('');

// Test API connection by querying a table
axios.get(`${SUPABASE_URL}/rest/v1/users?select=count&limit=1`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Supabase API connection successful!');
  console.log('Status:', response.status);
  return axios.get(`${SUPABASE_URL}/rest/v1/?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
})
.catch(err => {
  if (err.response) {
    console.log('⚠️  API responded (this is normal if tables don\'t exist yet)');
    console.log('Status:', err.response.status);
    console.log('This means Supabase API is working, but you need to:');
    console.log('1. Run COMPLETE_SUPABASE_SCHEMA.sql in Supabase SQL Editor');
    console.log('2. Then test again');
  } else {
    console.error('❌ API connection failed:', err.message);
  }
  process.exit(0);
});
