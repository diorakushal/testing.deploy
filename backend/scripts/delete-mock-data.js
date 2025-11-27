// Delete all mock payment requests from database
const { supabase } = require('../lib/supabase');
require('dotenv').config();

// Mock addresses to identify and delete
const mockAddresses = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  '0x8ba1f109551bD432803012645Hac136c2C1c',
  '0x5c0d3b8a7d9e1F2f4a6B8d5e4c7a3B9d1E2f4a6',
  '0x3a7b9c2d4e5f6a8b9c1d2e3f4a5b6c7d8e9f0a1b',
  '0x2b4d6f8a9c1e3d5f7b9a2c4e6f8a1b3d5c7e9f2b',
  '0x1f2e3d4c5b6a7980f1e2d3c4b5a6978f0e1d2c3b',
  '0x9e8d7c6b5a4938271f0e1d2c3b4a5968f7e6d5c4b',
  '0x7f3e8d9c1b2a4f5e6d7c8b9a0f1e2d3c4b5a6978',
  '0x6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d',
  '0x5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c',
  '0x4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b'
];

async function deleteMockData() {
  try {
    console.log('🗑️  Deleting mock payment requests...\n');
    
    let totalDeleted = 0;
    
    for (const address of mockAddresses) {
      const { data, error } = await supabase
        .from('payment_requests')
        .delete()
        .eq('requester_address', address)
        .select();
      
      if (error) {
        console.error(`Error deleting requests for ${address}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Deleted ${data.length} request(s) from ${address.substring(0, 10)}...`);
        totalDeleted += data.length;
      }
    }
    
    // Also delete by known mock captions
    const mockCaptions = [
      'tacos 🌮',
      'Rent share for this month',
      'Design commission',
      'Pay me back for drinks',
      'Freelance work completed',
      'Music production fee',
      'DAO reimbursement',
      'Quarterly subscription payment',
      'Meme coin payment 🐕',
      'BSC native payment',
      'Gas reimbursement'
    ];
    
    for (const caption of mockCaptions) {
      const { data, error } = await supabase
        .from('payment_requests')
        .delete()
        .eq('caption', caption)
        .select();
      
      if (error) {
        console.error(`Error deleting requests with caption "${caption}":`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Deleted ${data.length} request(s) with caption "${caption}"`);
        totalDeleted += data.length;
      }
    }
    
    console.log(`\n✅ Total deleted: ${totalDeleted} mock payment requests`);
    console.log('✅ Mock data cleanup complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting mock data:', error);
    process.exit(1);
  }
}

deleteMockData();



