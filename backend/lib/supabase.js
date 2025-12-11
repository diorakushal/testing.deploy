const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Validate required environment variables - no fallbacks for security
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: SUPABASE_ANON_KEY')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

module.exports = { supabase }



