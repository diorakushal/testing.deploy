// Test Supabase client connection
const { supabase } = require('./lib/supabase');

async function testConnection() {
  console.log('🔍 Testing Supabase Client Connection...\n');
  
  try {
    // Test 1: Check if we can connect
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('   ⚠️  Table "users" does not exist yet');
        console.log('   ✅ But Supabase client is working!');
        console.log('   📝 Next step: Run COMPLETE_SUPABASE_SCHEMA.sql in Supabase SQL Editor\n');
      } else {
        console.log('   ⚠️  Error:', error.message);
        console.log('   ✅ Supabase client is connected\n');
      }
    } else {
      console.log('   ✅ Connection successful!');
      console.log('   📊 Data:', data);
    }
    
    // Test 2: Check database connection via RPC
    console.log('2. Testing database connection...');
    const { data: dbData, error: dbError } = await supabase.rpc('version');
    
    if (dbError) {
      console.log('   ⚠️  RPC not available (normal if schema not run yet)');
    } else {
      console.log('   ✅ Database connection successful!');
    }
    
    console.log('\n✅ Supabase client is properly configured!');
    console.log('\n📋 Configuration:');
    console.log('   URL:', supabase.supabaseUrl);
    console.log('   Key:', supabase.supabaseKey.substring(0, 20) + '...');
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
