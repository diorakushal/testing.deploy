const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Validate required environment variables - no fallbacks for security
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: SUPABASE_ANON_KEY')
}

// Use service role key for backend (bypasses RLS) if available, otherwise use anon key
// Service role key is recommended for backend services to avoid RLS policy issues
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey

if (supabaseServiceRoleKey) {
  console.log('[Supabase] Using service role key for backend (bypasses RLS)');
} else {
  console.warn('[Supabase] ⚠️  Using anon key for backend - RLS policies may block queries. Consider using SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = { supabase }



