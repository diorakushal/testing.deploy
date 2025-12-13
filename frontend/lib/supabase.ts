import { createClient } from '@supabase/supabase-js'

// Validate required environment variables - no fallbacks for security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Support both variable names for compatibility
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging (remove after fixing)
if (typeof window !== 'undefined') {
  console.log('[Supabase Config] URL:', supabaseUrl);
  console.log('[Supabase Config] Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'MISSING');
}

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. Please set it in your .env.local file.')
}

if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY. Please set it in your .env.local file.')
}

// Configure Supabase client with better session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
  },
})



