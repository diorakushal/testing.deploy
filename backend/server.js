const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const https = require('https');
const { body, query, param, validationResult } = require('express-validator');
require('dotenv').config();

// ========== ENVIRONMENT VARIABLE VALIDATION ==========
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these in your .env file before starting the server.');
  process.exit(1);
}

// Validate database connection - either DATABASE_URL or individual params
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  const dbRequiredVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
  const missingDbVars = dbRequiredVars.filter(varName => !process.env[varName]);
  if (missingDbVars.length > 0) {
    console.error('❌ Missing database configuration:');
    console.error('   Either set DATABASE_URL/POSTGRES_URL, or set all of:');
    dbRequiredVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }
}

const app = express();

// ========== CORS CONFIGURATION ==========
// Configure CORS to only allow specific origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://block-book.com',
      'https://www.block-book.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// PostgreSQL connection (Supabase)
// Support both connection string and individual parameters
let poolConfig;

if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  // Use connection string directly (URL encode @ in password if needed)
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  // Check if using connection pooler - if it fails, try direct connection
  const isPooler = connectionString.includes('pooler.supabase.com');
  
  poolConfig = {
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    },
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: isPooler ? 10000 : 2000, // Longer timeout for pooler
  };
} else {
  // Use individual parameters - try direct connection first (port 5432)
  // All parameters are required - validation already checked above
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    },
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const pool = new Pool(poolConfig);

// ========== AUTHENTICATION MIDDLEWARE ==========
// Middleware to authenticate requests using Supabase JWT tokens
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header. Expected: Bearer <token>'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { supabase } = require('./lib/supabase');
    
    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
    
    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'An error occurred while verifying authentication'
    });
  }
};

// Optional authentication - doesn't fail if no token, but attaches user if present
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { supabase } = require('./lib/supabase');
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth if optional
    next();
  }
};

// ========== INPUT VALIDATION MIDDLEWARE ==========
// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// ========== HEALTH CHECK ENDPOINT ==========
app.get('/health', async (req, res) => {
  try {
    // Check database connection with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database check timeout')), 3000)
    );
    
    const dbCheck = pool.query('SELECT 1');
    await Promise.race([dbCheck, timeoutPromise]);
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    // Return 200 but indicate degraded status if database check fails
    // This allows Render's health check to pass even if DB is slow
    res.status(200).json({ 
      status: 'degraded', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message 
    });
  }
});

// ========== API ROUTES ==========

// Helper function to safely extract and validate query parameters
// Prevents issues when multiple query params with same name are passed (Express returns arrays)
const getQueryParam = (query, paramName, defaultValue = undefined) => {
  const value = query[paramName];
  if (value === undefined || value === null) {
    return defaultValue;
  }
  // If multiple values provided, use the first one
  if (Array.isArray(value)) {
    return value[0];
  }
  // Ensure it's a string before returning
  return typeof value === 'string' ? value : String(value);
};

// Get or create user
app.post('/api/users', async (req, res) => {
  try {
    const { walletAddress, username } = req.body;
    
    let result = await pool.query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [walletAddress]
    );
    
    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO users (wallet_address, username)
         VALUES ($1, $2) RETURNING *`,
        [walletAddress, username]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search users by username or nickname (for autocomplete)
app.get('/api/users/search', async (req, res) => {
  try {
    const { q, userId } = req.query; // Search query (username or nickname) and optional userId for contact boosting
    
    if (!q || q.length < 1) {
      return res.json([]);
    }
    
    // Remove @ if user typed it and clean the search term
    const cleanSearch = q.trim().replace(/^@+/, '').toLowerCase();
    
    if (!cleanSearch || cleanSearch.length < 1) {
      return res.json([]);
    }
    
    console.log('Searching for users by username or nickname:', cleanSearch, userId ? `(userId: ${userId})` : '');
    
    // Use Supabase client for this query (more reliable for Supabase)
    const { supabase } = require('./lib/supabase');
    
    console.log('Searching with pattern:', `%${cleanSearch}%`);
    
    // Step 1: Search users by username
    const { data: usernameResults, error: usernameError } = await supabase
      .from('users')
      .select('id, username, email, first_name, last_name, profile_image_url')
      .not('username', 'is', null)
      .neq('username', '')
      .ilike('username', `%${cleanSearch}%`)
      .limit(20);
    
    if (usernameError) {
      console.error('Supabase username search error:', usernameError);
    }
    
    // Step 2: If userId is provided, also search contacts by nickname
    let nicknameUserIds = [];
    if (userId) {
      try {
        console.log('[NICKNAME SEARCH] Searching contacts by nickname for userId:', userId, 'search term:', cleanSearch);
        const { data: nicknameContacts, error: nicknameError } = await supabase
          .from('contacts')
          .select('contact_user_id, nickname')
          .eq('user_id', userId)
          .not('nickname', 'is', null)
          .neq('nickname', '')
          .ilike('nickname', `%${cleanSearch}%`);
        
        if (nicknameError) {
          console.error('[NICKNAME SEARCH] Error searching contacts by nickname:', nicknameError);
        } else {
          console.log('[NICKNAME SEARCH] Query result:', nicknameContacts);
          if (nicknameContacts && nicknameContacts.length > 0) {
            nicknameUserIds = nicknameContacts.map(c => c.contact_user_id);
            console.log('[NICKNAME SEARCH] Found contacts by nickname:', nicknameContacts.length, 'user IDs:', nicknameUserIds);
            console.log('[NICKNAME SEARCH] Nickname matches:', nicknameContacts.map(c => ({ userId: c.contact_user_id, nickname: c.nickname })));
          } else {
            console.log('[NICKNAME SEARCH] No nickname contacts found matching:', cleanSearch);
          }
        }
      } catch (nicknameErr) {
        console.error('[NICKNAME SEARCH] Exception searching contacts by nickname:', nicknameErr);
      }
    } else {
      console.log('[NICKNAME SEARCH] No userId provided, skipping nickname search');
    }
    
    // Step 3: Fetch user data for contacts found by nickname
    let nicknameUserResults = [];
    if (nicknameUserIds.length > 0) {
      try {
        const { data: nicknameUsers, error: nicknameUsersError } = await supabase
          .from('users')
          .select('id, username, email, first_name, last_name, profile_image_url')
          .in('id', nicknameUserIds);
        
        if (!nicknameUsersError && nicknameUsers) {
          nicknameUserResults = nicknameUsers;
        }
      } catch (nicknameUsersErr) {
        console.error('Error fetching users for nickname matches:', nicknameUsersErr);
      }
    }
    
    // Step 4: Combine and deduplicate results by user ID
    const allUserResults = [...(usernameResults || []), ...nicknameUserResults];
    const uniqueUsersMap = new Map();
    allUserResults.forEach(user => {
      if (!uniqueUsersMap.has(user.id)) {
        uniqueUsersMap.set(user.id, user);
      }
    });
    const resultRows = Array.from(uniqueUsersMap.values());
    
    console.log('Combined search results count:', resultRows.length);
    
    // Step 5: If userId is provided, fetch all contacts to mark them and get nicknames
    let contactsMap = {};
    if (userId) {
      try {
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('contact_user_id, nickname')
          .eq('user_id', userId);
        
        if (!contactsError && contacts) {
          contacts.forEach(contact => {
            contactsMap[contact.contact_user_id] = {
              isContact: true,
              nickname: contact.nickname
            };
          });
        }
      } catch (contactsErr) {
        console.error('Error fetching contacts for search boost:', contactsErr);
        // Continue without contact boosting if this fails
      }
    }
    
    // Step 6: Format results for autocomplete and mark contacts
    let results = resultRows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_image_url: user.profile_image_url,
      displayName: user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.first_name || user.email?.split('@')[0] || 'User',
      searchText: user.username ? `@${user.username}` : user.email,
      isContact: contactsMap[user.id]?.isContact || false,
      nickname: contactsMap[user.id]?.nickname || null
    }));
    
    // Step 7: Sort: contacts first (especially those matched by nickname), then others (alphabetically by username)
    results.sort((a, b) => {
      // Prioritize contacts matched by nickname (they have a nickname that matches the search)
      const aNicknameMatch = a.isContact && a.nickname && a.nickname.toLowerCase().includes(cleanSearch);
      const bNicknameMatch = b.isContact && b.nickname && b.nickname.toLowerCase().includes(cleanSearch);
      
      if (aNicknameMatch && !bNicknameMatch) return -1;
      if (!aNicknameMatch && bNicknameMatch) return 1;
      
      // Then prioritize all contacts
      if (a.isContact && !b.isContact) return -1;
      if (!a.isContact && b.isContact) return 1;
      
      // Both are contacts or both are not - sort alphabetically by username
      return (a.username || '').localeCompare(b.username || '');
    });
    
    // Limit to 10 results after sorting
    results = results.slice(0, 10);
    
    res.json(results);
  } catch (error) {
    console.error('Error searching users:', error);
    // Return empty array instead of error to prevent frontend issues
    res.json([]);
  }
});

// Debug endpoint: Get all users with usernames (for testing)
app.get('/api/users/debug/all', async (req, res) => {
  try {
    const { supabase } = require('./lib/supabase');
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, first_name, last_name')
      .not('username', 'is', null)
      .neq('username', '')
      .limit(20);
    
    if (error) {
      console.error('Error fetching users:', error);
      return res.json({ error: error.message, users: [] });
    }
    
    res.json({ count: data?.length || 0, users: data || [] });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.json({ error: error.message, users: [] });
  }
});

// Get user profile
app.get('/api/users/:address', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [req.params.address]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PAYMENT REQUESTS API ENDPOINTS ==========

// ========== PAYMENT REQUESTS API ENDPOINTS ==========

// Seed endpoint removed - no mock data

// Get all payment requests (public, but can filter by authenticated user)
app.get('/api/payment-requests', optionalAuth, async (req, res) => {
  try {
    // Validate and normalize query parameters to prevent array issues
    // Express may pass arrays if multiple query params with same name are provided
    const getQueryParam = (param) => {
      const value = req.query[param];
      if (Array.isArray(value)) {
        // If multiple values provided, use the first one
        return value[0];
      }
      return value;
    };
    
    const status = getQueryParam('status');
    const requester_address = getQueryParam('requester_address');
    const requester_user_id = getQueryParam('requester_user_id'); // Filter by authenticated user ID (requests FROM user)
    const recipient_user_id = getQueryParam('recipient_user_id'); // Filter by recipient user ID (requests TO user)
    
    // Use Supabase client instead of direct PostgreSQL
    const { supabase } = require('./lib/supabase');
    
    let query = supabase
      .from('payment_requests')
      .select('*')
      .neq('status', 'cancelled') // Exclude cancelled requests
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }
    
    // Filter by requester_user_id if provided (for authenticated users - requests FROM user)
    if (requester_user_id && typeof requester_user_id === 'string') {
      query = query.eq('requester_user_id', requester_user_id);
    } else if (requester_address && typeof requester_address === 'string') {
      // Fallback to wallet address filtering if user_id not provided
      query = query.eq('requester_address', requester_address);
    }
    
    // Filter by recipient_user_id if provided (requests TO user)
    if (recipient_user_id && typeof recipient_user_id === 'string') {
      query = query.eq('recipient_user_id', recipient_user_id);
    }
    
    // Filter by recipient_user_id if provided (requests TO user)
    if (recipient_user_id && typeof recipient_user_id === 'string') {
      query = query.eq('recipient_user_id', recipient_user_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('Payment requests table does not exist yet. Run the migration first.');
        return res.json([]);
      }
      throw error;
    }
    
    // Fetch usernames for all unique requester user IDs (preferred) or addresses (fallback)
    if (data && data.length > 0) {
      const uniqueUserIds = [...new Set(data.map(r => r.requester_user_id).filter(Boolean))];
      const uniqueAddresses = [...new Set(data.map(r => r.requester_address))];
      
      // Fetch usernames from users table using user IDs (preferred)
      if (uniqueUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, first_name, last_name')
          .in('id', uniqueUserIds);
        
        if (!usersError && users) {
          // Create a map of user_id -> user data
          const userMap = {};
          users.forEach(user => {
            userMap[user.id] = {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name
            };
          });
          
          // Add user data to each payment request
          data.forEach(request => {
            if (request.requester_user_id && userMap[request.requester_user_id]) {
              const user = userMap[request.requester_user_id];
              request.requester_username = user.username;
              request.requester_first_name = user.first_name;
              request.requester_last_name = user.last_name;
            }
          });
        }
      }
      
      // Fallback: fetch usernames by wallet address for requests without user_id
      const requestsWithoutUsername = data.filter(r => !r.requester_username);
      if (requestsWithoutUsername.length > 0) {
        const addressesToFetch = [...new Set(requestsWithoutUsername.map(r => r.requester_address))];
        const { data: usersByAddress, error: usersError } = await supabase
          .from('users')
          .select('wallet_address, username, first_name, last_name')
          .in('wallet_address', addressesToFetch);
        
        if (!usersError && usersByAddress) {
          // Create a map of address -> user data
          const addressUserMap = {};
          usersByAddress.forEach(user => {
            addressUserMap[user.wallet_address?.toLowerCase()] = {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name
            };
          });
          
          // Add user data to payment requests that don't have one yet
          data.forEach(request => {
            if (!request.requester_username && addressUserMap[request.requester_address?.toLowerCase()]) {
              const user = addressUserMap[request.requester_address?.toLowerCase()];
              request.requester_username = user.username;
              request.requester_first_name = user.first_name;
              request.requester_last_name = user.last_name;
            }
          });
        }
      }
      
      // Fetch usernames for recipients (recipient_user_id field)
      const uniqueRecipientIds = [...new Set(data.map(r => r.recipient_user_id).filter(Boolean))];
      if (uniqueRecipientIds.length > 0) {
        const { data: recipients, error: recipientsError } = await supabase
          .from('users')
          .select('id, username, first_name, last_name')
          .in('id', uniqueRecipientIds);
        
        if (!recipientsError && recipients) {
          // Create a map of user_id -> user data for recipients
          const recipientUserMap = {};
          recipients.forEach(user => {
            recipientUserMap[user.id] = {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name
            };
          });
          
          // Add recipient user data to each payment request
          data.forEach(request => {
            if (request.recipient_user_id && recipientUserMap[request.recipient_user_id]) {
              const user = recipientUserMap[request.recipient_user_id];
              request.recipient_username = user.username;
              request.recipient_first_name = user.first_name;
              request.recipient_last_name = user.last_name;
            }
          });
        }
      }
      
      // Fetch usernames for payers (paid_by field)
      const paidByAddresses = [...new Set(data.map(r => r.paid_by).filter(Boolean))];
      if (paidByAddresses.length > 0) {
        const { data: payers, error: payersError } = await supabase
          .from('users')
          .select('id, wallet_address, username, first_name, last_name')
          .in('wallet_address', paidByAddresses);
        
        if (!payersError && payers) {
          // Create a map of address -> user data for payers
          const payerUserMap = {};
          payers.forEach(user => {
            payerUserMap[user.wallet_address?.toLowerCase()] = {
              id: user.id,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name
            };
          });
          
          // Add payer user data to each payment request
          data.forEach(request => {
            if (request.paid_by && payerUserMap[request.paid_by?.toLowerCase()]) {
              const user = payerUserMap[request.paid_by?.toLowerCase()];
              request.paid_by_user_id = user.id;
              request.paid_by_username = user.username;
              request.paid_by_first_name = user.first_name;
              request.paid_by_last_name = user.last_name;
            }
          });
        }
      }
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching payment requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single payment request
app.get('/api/payment-requests/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    console.log('[PaymentRequestAPI] 📥 Fetching payment request', { requestId });
    
    // Use Supabase client instead of direct PostgreSQL
    const { supabase } = require('./lib/supabase');
    
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (error) {
      console.error('[PaymentRequestAPI] ❌ Error fetching payment request', {
        requestId,
        error: error.message,
        code: error.code
      });
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Payment request not found' });
      }
      throw error;
    }
    
    console.log('[PaymentRequestAPI] ✅ Payment request fetched', {
      requestId,
      status: data?.status,
      txHash: data?.tx_hash,
      paidBy: data?.paid_by
    });
    
    // Fetch user data for requester (prefer user_id, fallback to wallet_address)
    if (data) {
      if (data.requester_user_id) {
        // Fetch by user ID (preferred)
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('username, first_name, last_name')
          .eq('id', data.requester_user_id)
          .maybeSingle();
        
        if (!userError && user) {
          data.requester_username = user.username;
          data.requester_first_name = user.first_name;
          data.requester_last_name = user.last_name;
        }
      }
      
      // Fallback to wallet address if no username found yet
      if (!data.requester_username && data.requester_address) {
        const { data: userByAddress, error: userError } = await supabase
          .from('users')
          .select('username, first_name, last_name')
          .eq('wallet_address', data.requester_address)
          .maybeSingle();
        
        if (!userError && userByAddress) {
          data.requester_username = userByAddress.username;
          data.requester_first_name = userByAddress.first_name;
          data.requester_last_name = userByAddress.last_name;
        } else {
          data.requester_username = null;
        }
      }
      
      // Fetch user data for recipient if specified
      if (data.recipient_user_id) {
        const { data: recipient, error: recipientError } = await supabase
          .from('users')
          .select('username, first_name, last_name')
          .eq('id', data.recipient_user_id)
          .maybeSingle();
        
        if (!recipientError && recipient) {
          data.recipient_username = recipient.username;
          data.recipient_first_name = recipient.first_name;
          data.recipient_last_name = recipient.last_name;
        }
      }
      
      // Fetch user data for payer if paid
      if (data.paid_by) {
        const { data: payer, error: payerError } = await supabase
          .from('users')
          .select('id, username, first_name, last_name')
          .eq('wallet_address', data.paid_by)
          .maybeSingle();
        
        if (!payerError && payer) {
          data.paid_by_user_id = payer.id;
          data.paid_by_username = payer.username;
          data.paid_by_first_name = payer.first_name;
          data.paid_by_last_name = payer.last_name;
        }
      }
    }
    
    res.json(data);
  } catch (error) {
    console.error('[PaymentRequestAPI] ❌ Unexpected error fetching payment request', {
      requestId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
});

// Create payment request (requires authentication)
app.post('/api/payment-requests', 
  authenticateUser,
  [
    body('requesterAddress').notEmpty().withMessage('Requester address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/i).withMessage('Invalid wallet address format'),
    body('amount').isFloat({ min: 0.000001 }).withMessage('Amount must be greater than 0'),
    body('tokenAddress').notEmpty().withMessage('Token address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/i).withMessage('Invalid token address format'),
    body('chainId').notEmpty().withMessage('Chain ID is required'),
    body('chainName').notEmpty().withMessage('Chain name is required'),
    body('tokenSymbol').optional().isString().trim(),
    body('caption').optional().isString().trim().isLength({ max: 500 }).withMessage('Caption too long'),
    body('recipientUserId').optional().isUUID().withMessage('Invalid recipient user ID format')
  ],
  validate,
  async (req, res) => {
  try {
    const {
      requesterAddress,
      recipientUserId, // User ID of the recipient (if request is sent to specific user)
      amount,
      tokenSymbol = 'USDC',
      tokenAddress,
      chainId,
      chainName,
      caption
    } = req.body;
    
    // Use authenticated user ID from token
    const requesterUserId = req.userId;
    
    // Validate wallet address matches authenticated user (if they have one)
    // Note: Users might not have wallet_address set yet, so we allow it
    
    // Use Supabase client instead of direct PostgreSQL for better reliability
    const { supabase } = require('./lib/supabase');
    
    const insertData = {
      requester_address: requesterAddress,
      amount: parseFloat(amount),
      token_symbol: tokenSymbol,
      token_address: tokenAddress,
      chain_id: chainId.toString(),
      chain_name: chainName,
      caption: caption || null,
      status: 'open'
    };
    
    // Add requester_user_id if provided (for authenticated users)
    if (requesterUserId) {
      insertData.requester_user_id = requesterUserId;
    }
    
    // Add recipient_user_id if provided (for requests sent to specific users)
    if (recipientUserId) {
      insertData.recipient_user_id = recipientUserId;
    }
    
    const { data, error } = await supabase
      .from('payment_requests')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating payment request:', error);
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update payment request status (mark as paid) - requires authentication
app.patch('/api/payment-requests/:id/paid',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Invalid payment request ID format'),
    body('txHash').notEmpty().withMessage('Transaction hash is required')
      .matches(/^0x[a-fA-F0-9]{64}$/i).withMessage('Invalid transaction hash format'),
    body('paidBy').notEmpty().withMessage('Paid by address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/i).withMessage('Invalid wallet address format')
  ],
  validate,
  async (req, res) => {
  try {
    const { txHash, paidBy } = req.body;
    const requestId = req.params.id;
    
    console.log('[PaymentRequestAPI] 📝 Updating payment request status', {
      requestId,
      txHash,
      paidBy,
      userId: req.userId,
      hasTxHash: !!txHash,
      hasPaidBy: !!paidBy
    });
    
    // Use Supabase client for consistency and better error handling
    const { supabase } = require('./lib/supabase');
    
    // First, check if the request exists and is open
    const { data: existingRequest, error: fetchError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'open')
      .single();
    
    if (fetchError || !existingRequest) {
      console.error('[PaymentRequestAPI] ❌ Request not found or already paid', {
        requestId,
        error: fetchError?.message,
        exists: !!existingRequest
      });
      return res.status(404).json({ error: 'Payment request not found or already paid' });
    }
    
    console.log('[PaymentRequestAPI] ✅ Request found, updating status', {
      requestId,
      currentStatus: existingRequest.status
    });
    
    // Update the payment request
    // Use explicit timestamp to ensure consistency
    const paidAtTimestamp = new Date().toISOString();
    const updateData = {
      status: 'paid',
      paid_by: paidBy,
      tx_hash: txHash,
      paid_at: paidAtTimestamp
    };
    
    console.log('[PaymentRequestAPI] 🔄 Attempting database update', {
      requestId,
      updateData,
      timestamp: paidAtTimestamp
    });
    
    // First, try to update with status check (prevents race conditions)
    let { data: updatedRequest, error: updateError } = await supabase
      .from('payment_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('status', 'open') // Only update if still open (prevent race conditions)
      .select()
      .single();
    
    if (updateError) {
      console.error('[PaymentRequestAPI] ❌ Error updating payment request', {
        requestId,
        error: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      });
      throw updateError;
    }
    
    if (!updatedRequest) {
      console.error('[PaymentRequestAPI] ❌ Update returned no rows', { 
        requestId,
        possibleReasons: [
          'Request ID not found',
          'Status is already "paid" (race condition)',
          'Status was changed by another process'
        ]
      });
      
      // Try to fetch the current state to see what happened
      const { data: currentRequest } = await supabase
        .from('payment_requests')
        .select('status, tx_hash, paid_by')
        .eq('id', requestId)
        .single();
      
      console.log('[PaymentRequestAPI] 📊 Current request state', {
        requestId,
        currentStatus: currentRequest?.status,
        currentTxHash: currentRequest?.tx_hash,
        currentPaidBy: currentRequest?.paid_by
      });
      
      // If it's already paid, that's actually okay - return success
      if (currentRequest?.status === 'paid') {
        console.log('[PaymentRequestAPI] ✅ Request already marked as paid (concurrent update)', { 
          requestId,
          existingTxHash: currentRequest.tx_hash,
          newTxHash: txHash,
          matches: currentRequest.tx_hash === txHash
        });
        return res.json(currentRequest);
      }
      
      // If status is still 'open' but update failed, try updating without the status check
      // This handles edge cases where the status check might be too strict
      if (currentRequest?.status === 'open') {
        console.log('[PaymentRequestAPI] 🔄 Retrying update without status check', { requestId });
        const { data: retryUpdate, error: retryError } = await supabase
          .from('payment_requests')
          .update(updateData)
          .eq('id', requestId)
          .select()
          .single();
        
        if (!retryError && retryUpdate) {
          console.log('[PaymentRequestAPI] ✅ Retry update successful', {
            requestId,
            newStatus: retryUpdate.status
          });
          
          // Verify the update persisted
          const { data: verifyRetry } = await supabase
            .from('payment_requests')
            .select('status, tx_hash, paid_by, paid_at')
            .eq('id', requestId)
            .single();
          
          if (verifyRetry?.status === 'paid') {
            console.log('[PaymentRequestAPI] ✅ Retry update verified in database', {
              requestId,
              verifiedStatus: verifyRetry.status
            });
            return res.json(retryUpdate);
          } else {
            console.error('[PaymentRequestAPI] ❌ Retry update did not persist', {
              requestId,
              expectedStatus: 'paid',
              actualStatus: verifyRetry?.status
            });
          }
        } else {
          console.error('[PaymentRequestAPI] ❌ Retry update failed', {
            requestId,
            error: retryError?.message
          });
        }
      }
      
      // Last resort: Check if this transaction hash already exists (idempotency check)
      if (txHash) {
        const { data: existingPaidRequest } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('tx_hash', txHash)
          .single();
        
        if (existingPaidRequest && existingPaidRequest.id === requestId) {
          console.log('[PaymentRequestAPI] ✅ Transaction already recorded (idempotency)', {
            requestId,
            txHash,
            existingStatus: existingPaidRequest.status
          });
          return res.json(existingPaidRequest);
        }
      }
      
      return res.status(404).json({ error: 'Payment request not found or already paid' });
    }
    
    console.log('[PaymentRequestAPI] ✅ Payment request updated successfully', {
      requestId,
      newStatus: updatedRequest.status,
      txHash: updatedRequest.tx_hash,
      paidBy: updatedRequest.paid_by,
      paidAt: updatedRequest.paid_at
    });
    
    // Verify the update persisted by fetching it again
    const { data: verifyRequest, error: verifyError } = await supabase
      .from('payment_requests')
      .select('status, tx_hash, paid_by')
      .eq('id', requestId)
      .single();
    
    if (verifyError) {
      console.error('[PaymentRequestAPI] ⚠️ Verification fetch failed', {
        requestId,
        error: verifyError.message
      });
    } else {
      console.log('[PaymentRequestAPI] ✅ Verification - status persisted', {
        requestId,
        verifiedStatus: verifyRequest.status,
        verifiedTxHash: verifyRequest.tx_hash
      });
    }
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('[PaymentRequestAPI] ❌ Unexpected error updating payment request', {
      error: error.message,
      stack: error.stack,
      requestId: req.params.id
    });
    res.status(500).json({ error: error.message || 'Failed to update payment request status' });
  }
});

// Delete payment request (cancel) - requires authentication
app.delete('/api/payment-requests/:id',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Invalid payment request ID format')
  ],
  validate,
  async (req, res) => {
  try {
    // Use Supabase client instead of direct PostgreSQL
    const { supabase } = require('./lib/supabase');
    
    // First, verify the request exists and belongs to the authenticated user
    const { data: existingRequest, error: fetchError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', req.params.id)
      .eq('requester_user_id', req.userId) // Verify ownership by user ID
      .eq('status', 'open')
      .single();
    
    if (fetchError || !existingRequest) {
      return res.status(404).json({ error: 'Payment request not found or cannot be deleted' });
    }
    
    // Delete the request completely
    const { error } = await supabase
      .from('payment_requests')
      .delete()
      .eq('id', req.params.id)
      .eq('requester_user_id', req.userId) // Verify ownership by user ID
      .eq('status', 'open');
    
    if (error) {
      throw error;
    }
    
    res.json({ message: 'Payment request deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel endpoint (kept for backward compatibility, but now deletes) - requires authentication
app.patch('/api/payment-requests/:id/cancel',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Invalid payment request ID format')
  ],
  validate,
  async (req, res) => {
  try {
    // Use Supabase client instead of direct PostgreSQL
    const { supabase } = require('./lib/supabase');
    
    // First, verify the request exists and belongs to the authenticated user
    const { data: existingRequest, error: fetchError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', req.params.id)
      .eq('requester_user_id', req.userId) // Verify ownership by user ID
      .eq('status', 'open')
      .single();
    
    if (fetchError || !existingRequest) {
      return res.status(404).json({ error: 'Payment request not found or cannot be cancelled' });
    }
    
    // Delete the request completely instead of marking as cancelled
    const { error } = await supabase
      .from('payment_requests')
      .delete()
      .eq('id', req.params.id)
      .eq('requester_user_id', req.userId) // Verify ownership by user ID
      .eq('status', 'open');
    
    if (error) {
      throw error;
    }
    
    res.json({ message: 'Payment request deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment request:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PREFERRED WALLETS ENDPOINTS ==========

// Get preferred wallets for a user (requires authentication)
app.get('/api/preferred-wallets',
  authenticateUser,
  [
    query('userId').optional().isUUID().withMessage('Invalid user ID format')
  ],
  validate,
  async (req, res) => {
  try {
    // Use authenticated user's ID, or allow query param for admin access
    const userId = req.query.userId || req.userId;
    
    // Ensure users can only access their own wallets (unless admin)
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own preferred wallets' });
    }

    const { supabase } = require('./lib/supabase');

    const { data, error } = await supabase
      .from('preferred_wallets')
      .select('*')
      .eq('user_id', userId)
      .order('chain_id', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching preferred wallets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update preferred wallet (requires authentication)
app.post('/api/preferred-wallets',
  authenticateUser,
  [
    body('chainId').notEmpty().withMessage('Chain ID is required')
      .isInt({ min: 1 }).withMessage('Chain ID must be a valid integer'),
    body('receivingWalletAddress').notEmpty().withMessage('Receiving wallet address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/i).withMessage('Invalid wallet address format')
  ],
  validate,
  async (req, res) => {
  try {
    console.log('[PreferredWalletsAPI] ========== NEW REQUEST ==========');
    
    // Use authenticated user's ID
    const userId = req.userId;
    const { chainId, receivingWalletAddress } = req.body;

    console.log('[PreferredWalletsAPI] Request received:', {
      userId,
      chainId,
      chainIdType: typeof chainId,
      receivingWalletAddress: receivingWalletAddress ? `${receivingWalletAddress.substring(0, 10)}...` : 'missing',
      addressLength: receivingWalletAddress?.length
    });

    // Validate chain ID
    const chainIdNum = parseInt(String(chainId).trim(), 10);
    const validChainIds = [8453, 1, 56, 137, 42161, 10]; // Base, Ethereum, BNB, Polygon, Arbitrum, Optimism
    
    if (isNaN(chainIdNum) || !validChainIds.includes(chainIdNum)) {
      console.error('[PreferredWalletsAPI] ❌ Invalid chain ID:', {
        received: chainId,
        parsed: chainIdNum,
        validChains: validChainIds
      });
      return res.status(400).json({ 
        error: `Invalid chain ID: ${chainId}. Valid chain IDs are: 8453 (Base), 1 (Ethereum), 56 (BNB), 137 (Polygon), 42161 (Arbitrum), 10 (Optimism)` 
      });
    }

    // Validate wallet address format (EVM addresses must be 0x followed by 40 hex characters)
    if (!/^0x[a-fA-F0-9]{40}$/.test(receivingWalletAddress)) {
      console.error('[PreferredWalletsAPI] Invalid address format:', receivingWalletAddress.substring(0, 20));
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const { supabase } = require('./lib/supabase');

    // First, check if wallet already exists for this user/chain
    // Note: chain_id is stored as string in database
    const chainIdStr = String(chainId);
    const { data: existing } = await supabase
      .from('preferred_wallets')
      .select('id')
      .eq('user_id', userId)
      .eq('chain_id', chainIdStr)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('preferred_wallets')
        .update({
          receiving_wallet_address: receivingWalletAddress.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('preferred_wallets')
        .insert({
          user_id: userId,
          chain_id: chainIdStr,
          receiving_wallet_address: receivingWalletAddress.toLowerCase()
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    res.json(result);
  } catch (error) {
    console.error('Error saving preferred wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete preferred wallet (requires authentication)
app.delete('/api/preferred-wallets/:id',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Invalid wallet ID format')
  ],
  validate,
  async (req, res) => {
  try {
    const walletId = req.params.id;

    const { supabase } = require('./lib/supabase');
    
    // Verify the wallet belongs to the authenticated user
    const { data: existingWallet, error: checkError } = await supabase
      .from('preferred_wallets')
      .select('user_id')
      .eq('id', walletId)
      .single();
    
    if (checkError || !existingWallet) {
      return res.status(404).json({ error: 'Preferred wallet not found' });
    }
    
    if (existingWallet.user_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own preferred wallets' });
    }

    const { error } = await supabase
      .from('preferred_wallets')
      .delete()
      .eq('id', walletId)
      .eq('user_id', req.userId); // Double-check ownership

    if (error) {
      throw error;
    }

    res.json({ message: 'Preferred wallet deleted successfully' });
  } catch (error) {
    console.error('Error deleting preferred wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get preferred wallets for a specific user (for payment sending)
app.get('/api/preferred-wallets/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const { supabase } = require('./lib/supabase');

    const { data, error } = await supabase
      .from('preferred_wallets')
      .select('*')
      .eq('user_id', userId)
      .order('chain_id', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching user preferred wallets:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CONTACTS ENDPOINTS ==========

// Get all contacts for a user (requires authentication)
app.get('/api/contacts',
  authenticateUser,
  async (req, res) => {
  try {
    // Use authenticated user's ID
    const userId = req.userId;

    const { supabase } = require('./lib/supabase');

    // Get contacts with user information
    // Use a simpler approach: get contacts first, then fetch user data
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, contact_user_id, nickname, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (contactsError) {
      // If table doesn't exist, return empty array
      if (contactsError.code === '42P01' || contactsError.message?.includes('does not exist')) {
        console.log('Contacts table does not exist yet. Run the migration first.');
        return res.json([]);
      }
      throw contactsError;
    }

    // Fetch user data for all contacts
    if (contacts && contacts.length > 0) {
      const contactUserIds = contacts.map(c => c.contact_user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, email, profile_image_url')
        .in('id', contactUserIds);

      if (usersError) {
        console.error('Error fetching contact users:', usersError);
        // Continue with empty user data rather than failing
      }

      // Create a map of user_id -> user data
      const userMap = {};
      if (users) {
        users.forEach(user => {
          userMap[user.id] = user;
        });
      }

      // Format the response
      const formattedContacts = contacts.map(contact => ({
        id: contact.id,
        contact_user_id: contact.contact_user_id,
        nickname: contact.nickname,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
        user: userMap[contact.contact_user_id] ? {
          id: userMap[contact.contact_user_id].id,
          username: userMap[contact.contact_user_id].username,
          first_name: userMap[contact.contact_user_id].first_name,
          last_name: userMap[contact.contact_user_id].last_name,
          email: userMap[contact.contact_user_id].email,
          profile_image_url: userMap[contact.contact_user_id].profile_image_url,
          displayName: userMap[contact.contact_user_id].first_name && userMap[contact.contact_user_id].last_name
            ? `${userMap[contact.contact_user_id].first_name} ${userMap[contact.contact_user_id].last_name}`
            : userMap[contact.contact_user_id].first_name || userMap[contact.contact_user_id].email?.split('@')[0] || 'User'
        } : null
      }));

      return res.json(formattedContacts);
    }

    // No contacts found
    return res.json([]);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to load contacts';
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      errorMessage = 'Contacts table does not exist. Please run the database migration first.';
    } else if (error.code === '23503') {
      errorMessage = 'Invalid user reference. Please ensure the user exists.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      code: error.code,
      details: error.details
    });
  }
});

// Add a contact
app.post('/api/contacts', async (req, res) => {
  try {
    const { userId, contactUserId, nickname } = req.body;
    
    if (!userId || !contactUserId) {
      return res.status(400).json({ error: 'Missing userId or contactUserId' });
    }

    if (userId === contactUserId) {
      return res.status(400).json({ error: 'Cannot add yourself as a contact' });
    }

    const { supabase } = require('./lib/supabase');

    // Check if contact already exists
    const { data: existing, error: checkError } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('contact_user_id', contactUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      throw checkError;
    }

    let contactData;
    if (existing) {
      // Update existing contact (e.g., update nickname)
      const { data, error } = await supabase
        .from('contacts')
        .update({
          nickname: nickname || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('id, contact_user_id, nickname, created_at, updated_at')
        .single();

      if (error) throw error;
      contactData = data;
    } else {
      // Create new contact
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: userId,
          contact_user_id: contactUserId,
          nickname: nickname || null
        })
        .select('id, contact_user_id, nickname, created_at, updated_at')
        .single();

      if (error) throw error;
      contactData = data;
    }

    // Fetch user data for the contact
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, first_name, last_name, email, profile_image_url')
      .eq('id', contactData.contact_user_id)
      .single();

    if (userError) {
      console.error('Error fetching contact user:', userError);
      // Return contact without user data rather than failing
    }

    const formatted = {
      id: contactData.id,
      contact_user_id: contactData.contact_user_id,
      nickname: contactData.nickname,
      created_at: contactData.created_at,
      updated_at: contactData.updated_at,
      user: userData ? {
        id: userData.id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        profile_image_url: userData.profile_image_url,
        displayName: userData.first_name && userData.last_name
          ? `${userData.first_name} ${userData.last_name}`
          : userData.first_name || userData.email?.split('@')[0] || 'User'
      } : null
    };

    res.json(formatted);
  } catch (error) {
    console.error('Error adding contact:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to add contact';
    if (error.code === '23505') {
      errorMessage = 'This contact already exists.';
    } else if (error.code === '23503') {
      errorMessage = 'Invalid user reference. The user you are trying to add does not exist.';
    } else if (error.code === '23514') {
      errorMessage = 'Cannot add yourself as a contact.';
    } else if (error.code === '42P01' || error.message?.includes('does not exist')) {
      errorMessage = 'Contacts table does not exist. Please run the database migration first.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      code: error.code,
      details: error.details
    });
  }
});

// Update contact (mainly for nickname) - requires authentication
app.patch('/api/contacts/:id',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Invalid contact ID format'),
    body('nickname').optional().isString().trim().isLength({ max: 50 }).withMessage('Nickname too long')
  ],
  validate,
  async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname } = req.body;
    const userId = req.userId;

    const { supabase } = require('./lib/supabase');

    // Verify the contact belongs to the authenticated user
    const { data: existing, error: checkError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this contact' });
    }

    // Update the contact
    const { data: contactData, error } = await supabase
      .from('contacts')
      .update({
        nickname: nickname || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, contact_user_id, nickname, created_at, updated_at')
      .single();

    if (error) throw error;

    // Fetch user data for the contact
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, first_name, last_name, email, profile_image_url')
      .eq('id', contactData.contact_user_id)
      .single();

    if (userError) {
      console.error('Error fetching contact user:', userError);
      // Return contact without user data rather than failing
    }

    const formatted = {
      id: contactData.id,
      contact_user_id: contactData.contact_user_id,
      nickname: contactData.nickname,
      created_at: contactData.created_at,
      updated_at: contactData.updated_at,
      user: userData ? {
        id: userData.id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        profile_image_url: userData.profile_image_url,
        displayName: userData.first_name && userData.last_name
          ? `${userData.first_name} ${userData.last_name}`
          : userData.first_name || userData.email?.split('@')[0] || 'User'
      } : null
    };

    res.json(formatted);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a contact
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const { supabase } = require('./lib/supabase');

    // Verify the contact belongs to the user
    const { data: existing, error: checkError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this contact' });
    }

    // Delete the contact
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PAYMENT SENDS ENDPOINTS ==========

// Create payment send (record of a direct payment) - requires authentication
app.post('/api/payment-sends',
  authenticateUser,
  [
    body('senderAddress').notEmpty().withMessage('Sender address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/i).withMessage('Invalid sender wallet address format'),
    body('recipientAddress').notEmpty().withMessage('Recipient address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/i).withMessage('Invalid recipient wallet address format'),
    body('amount').isFloat({ min: 0.000001 }).withMessage('Amount must be greater than 0'),
    body('tokenAddress').notEmpty().withMessage('Token address is required')
      .matches(/^0x[a-fA-F0-9]{40}$/i).withMessage('Invalid token address format'),
    body('chainId').notEmpty().withMessage('Chain ID is required'),
    body('chainName').notEmpty().withMessage('Chain name is required'),
    body('txHash').notEmpty().withMessage('Transaction hash is required')
      .matches(/^0x[a-fA-F0-9]{64}$/i).withMessage('Invalid transaction hash format'),
    body('tokenSymbol').optional().isString().trim(),
    body('caption').optional().isString().trim().isLength({ max: 500 }).withMessage('Caption too long'),
    body('recipientUserId').optional().isUUID().withMessage('Invalid recipient user ID format')
  ],
  validate,
  async (req, res) => {
  try {
    console.log('[PaymentSendsAPI] 📥 POST /api/payment-sends - Request received');
    
    const {
      senderAddress,
      recipientAddress,
      recipientUserId,
      amount,
      tokenSymbol = 'USDC',
      tokenAddress,
      chainId,
      chainName,
      caption,
      txHash
    } = req.body;
    
    // Use authenticated user's ID
    const senderUserId = req.userId;

    const { supabase } = require('./lib/supabase');

    const insertData = {
      sender_address: senderAddress,
      recipient_address: recipientAddress,
      amount: parseFloat(amount),
      token_symbol: tokenSymbol,
      token_address: tokenAddress,
      chain_id: chainId.toString(),
      chain_name: chainName,
      caption: caption || null,
      status: 'pending', // Will be updated to 'confirmed' when transaction is confirmed
      tx_hash: txHash
    };

    if (senderUserId) {
      insertData.sender_user_id = senderUserId;
    }

    if (recipientUserId) {
      insertData.recipient_user_id = recipientUserId;
    }

    console.log('[PaymentSendsAPI] 📤 Inserting payment send into database:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('payment_sends')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[PaymentSendsAPI] ❌ Error creating payment send:', error);
      console.error('[PaymentSendsAPI] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('[PaymentSendsAPI] ✅ Payment send created successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Error creating payment send:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment sends (requires authentication - users can only see their own)
app.get('/api/payment-sends',
  authenticateUser,
  [
    query('sender_user_id').optional().isUUID().withMessage('Invalid sender user ID format'),
    query('recipient_user_id').optional().isUUID().withMessage('Invalid recipient user ID format'),
    query('status').optional().isIn(['pending', 'confirmed', 'failed']).withMessage('Invalid status'),
    query('txHash').optional().matches(/^0x[a-fA-F0-9]{64}$/i).withMessage('Invalid transaction hash format')
  ],
  validate,
  async (req, res) => {
  try {
    // Users can only query their own payment sends
    const sender_user_id = req.userId; // Force to authenticated user
    const { recipient_user_id, status, txHash } = req.query;

    console.log('[PaymentSendsAPI] Fetching payment sends', { sender_user_id, recipient_user_id, sender_address, recipient_address, status, txHash });

    const { supabase } = require('./lib/supabase');

    let query = supabase
      .from('payment_sends')
      .select('*')
      .order('created_at', { ascending: false });

    if (sender_user_id) {
      query = query.eq('sender_user_id', sender_user_id);
    }

    if (recipient_user_id) {
      query = query.eq('recipient_user_id', recipient_user_id);
    }

    if (sender_address) {
      query = query.eq('sender_address', sender_address);
    }

    if (recipient_address) {
      query = query.eq('recipient_address', recipient_address);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (txHash) {
      query = query.eq('tx_hash', txHash);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PaymentSendsAPI] Error fetching payment sends:', error);
      throw error;
    }

    console.log('[PaymentSendsAPI] Found payment sends:', data?.length || 0, data);

    // Fetch user data for sender and recipient
    if (data && data.length > 0) {
      const uniqueSenderIds = [...new Set(data.map(s => s.sender_user_id).filter(Boolean))];
      const uniqueRecipientIds = [...new Set(data.map(s => s.recipient_user_id).filter(Boolean))];
      const allUserIds = [...uniqueSenderIds, ...uniqueRecipientIds];
      
      if (allUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, first_name, last_name')
          .in('id', allUserIds);
        
        if (!usersError && users) {
          // Create maps of user_id -> user data
          const userMap = {};
          users.forEach(user => {
            userMap[user.id] = {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name
            };
          });
          
          // Add user data to each payment send
          data.forEach(send => {
            if (send.sender_user_id && userMap[send.sender_user_id]) {
              const user = userMap[send.sender_user_id];
              send.sender_username = user.username;
              send.sender_first_name = user.first_name;
              send.sender_last_name = user.last_name;
            }
            if (send.recipient_user_id && userMap[send.recipient_user_id]) {
              const user = userMap[send.recipient_user_id];
              send.recipient_username = user.username;
              send.recipient_first_name = user.first_name;
              send.recipient_last_name = user.last_name;
            }
          });
        }
      }
      
      // Fallback: fetch user data by wallet address for sends without names
      const sendsNeedingSenderLookup = data.filter(s => 
        (!s.sender_first_name || !s.sender_last_name) && 
        s.sender_address
      );
      const sendsNeedingRecipientLookup = data.filter(s => 
        (!s.recipient_first_name || !s.recipient_last_name) && 
        s.recipient_address
      );
      
      if (sendsNeedingSenderLookup.length > 0 || sendsNeedingRecipientLookup.length > 0) {
        const addressesToFetch = [
          ...new Set([
            ...sendsNeedingSenderLookup.map(s => s.sender_address),
            ...sendsNeedingRecipientLookup.map(s => s.recipient_address)
          ])
        ].filter(Boolean);
        
        console.log('[PaymentSendsAPI] 🔍 Looking up users by wallet address:', addressesToFetch);
        
        if (addressesToFetch.length > 0) {
          const { data: usersByAddress, error: usersError } = await supabase
            .from('users')
            .select('wallet_address, username, first_name, last_name')
            .in('wallet_address', addressesToFetch);
          
          console.log('[PaymentSendsAPI] 📋 Users found by address:', usersByAddress?.length || 0, usersByAddress);
          
          if (!usersError && usersByAddress) {
            // Create a map of address -> user data (case-insensitive)
            const addressUserMap = {};
            usersByAddress.forEach(user => {
              if (user.wallet_address) {
                addressUserMap[user.wallet_address.toLowerCase()] = {
                  username: user.username,
                  first_name: user.first_name,
                  last_name: user.last_name
                };
              }
            });
            
            // Add user data to payment sends that don't have it yet
            data.forEach(send => {
              if (send.sender_address) {
                const senderKey = send.sender_address.toLowerCase();
                if ((!send.sender_first_name || !send.sender_last_name) && addressUserMap[senderKey]) {
                  const user = addressUserMap[senderKey];
                  send.sender_username = user.username || send.sender_username;
                  send.sender_first_name = user.first_name || send.sender_first_name;
                  send.sender_last_name = user.last_name || send.sender_last_name;
                  console.log('[PaymentSendsAPI] ✅ Added sender name for', send.sender_address, ':', user.first_name, user.last_name);
                }
              }
              if (send.recipient_address) {
                const recipientKey = send.recipient_address.toLowerCase();
                if ((!send.recipient_first_name || !send.recipient_last_name) && addressUserMap[recipientKey]) {
                  const user = addressUserMap[recipientKey];
                  send.recipient_username = user.username || send.recipient_username;
                  send.recipient_first_name = user.first_name || send.recipient_first_name;
                  send.recipient_last_name = user.last_name || send.recipient_last_name;
                  console.log('[PaymentSendsAPI] ✅ Added recipient name for', send.recipient_address, ':', user.first_name, user.last_name);
                }
              }
            });
          }
        }
      }
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching payment sends:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update payment send status (mark as confirmed) - requires authentication
app.patch('/api/payment-sends/:id/confirmed',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Invalid payment send ID format'),
    body('txHash').optional().matches(/^0x[a-fA-F0-9]{64}$/i).withMessage('Invalid transaction hash format')
  ],
  validate,
  async (req, res) => {
  try {
    const { id } = req.params;
    const { txHash } = req.body;
    
    // Verify the payment send belongs to the authenticated user
    const { supabase } = require('./lib/supabase');
    const { data: existingSend, error: checkError } = await supabase
      .from('payment_sends')
      .select('sender_user_id')
      .eq('id', id)
      .single();
    
    if (checkError || !existingSend) {
      return res.status(404).json({ error: 'Payment send not found' });
    }
    
    if (existingSend.sender_user_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own payment sends' });
    }

    const updateData = {
      status: 'confirmed',
      confirmed_at: new Date().toISOString()
    };

    if (txHash) {
      updateData.tx_hash = txHash;
    }

    const { data, error } = await supabase
      .from('payment_sends')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating payment send:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for CoinGecko API to avoid CORS issues
app.get('/api/crypto-price', async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Missing ids parameter' });
    }
    
    // Create HTTPS agent with proper SSL handling
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // Allow self-signed certificates (for development)
      // On macOS, sometimes the certificate chain isn't properly configured
      // This allows the connection while still using HTTPS
    });
    
    // Retry logic: try up to 3 times with exponential backoff
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: {
            ids: ids,
            vs_currencies: 'usd'
          },
          timeout: 20000, // 20 second timeout
          httpsAgent: httpsAgent,
          // Add headers to help with rate limiting
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; CryptoApp/1.0)'
          }
        });
        
        // Success - return the data
        return res.json(response.data);
      } catch (attemptError) {
        lastError = attemptError;
        
        // If it's a rate limit error (429), wait longer
        if (attemptError.response?.status === 429) {
          const retryAfter = attemptError.response.headers['retry-after'] || (attempt * 2);
          console.log(`Rate limited. Waiting ${retryAfter} seconds before retry ${attempt}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        
        // If it's a 403 (blocked/forbidden), try fallback price APIs
        if (attemptError.response?.status === 403) {
          console.log('CoinGecko API blocked (403). Trying fallback price APIs...');
          
          // Fallback 1: Try Binance API (no API key required for public endpoints)
          try {
            const binanceSymbols = {
              'usd-coin': 'USDCUSDT',
              'tether': 'USDTUSDT',
              'ethereum': 'ETHUSDT',
              'bitcoin': 'BTCUSDT',
              'binancecoin': 'BNBUSDT',
              'matic-network': 'MATICUSDT',
              'avalanche-2': 'AVAXUSDT',
              'dai': 'DAIUSDT',
              'weth': 'ETHUSDT',
              'wrapped-bitcoin': 'BTCUSDT'
            };
            
            // Try to map CoinGecko IDs to Binance symbols
            const idArray = Array.isArray(ids) ? ids : ids.split(',');
            const binancePrices = {};
            
            for (const id of idArray) {
              const symbol = binanceSymbols[id.trim()];
              if (symbol) {
                try {
                  const binanceResponse = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
                    timeout: 10000,
                    httpsAgent: httpsAgent
                  });
                  
                  if (binanceResponse.data && binanceResponse.data.price) {
                    // Binance returns price in USDT, convert to USD (usually 1:1)
                    binancePrices[id.trim()] = {
                      usd: parseFloat(binanceResponse.data.price)
                    };
                  }
                } catch (binErr) {
                  console.log(`Binance fallback failed for ${id}:`, binErr.message);
                }
              }
            }
            
            // If we got at least one price from Binance, return it
            if (Object.keys(binancePrices).length > 0) {
              console.log(`✅ Using Binance fallback for ${Object.keys(binancePrices).length} token(s)`);
              return res.json(binancePrices);
            }
          } catch (binanceError) {
            console.log('Binance fallback failed:', binanceError.message);
          }
          
          // If all fallbacks fail, try using cached/default prices as last resort
          console.log('All APIs blocked. Using default/cached prices as fallback...');
          const defaultPrices = {
            'usd-coin': { usd: 1.0 },
            'usdc': { usd: 1.0 },
            'tether': { usd: 1.0 },
            'usdt': { usd: 1.0 },
            'ethereum': { usd: 3000.0 },
            'eth': { usd: 3000.0 },
            'bitcoin': { usd: 45000.0 },
            'btc': { usd: 45000.0 },
            'sol': { usd: 100.0 },
            'binancecoin': { usd: 300.0 },
            'bnb': { usd: 300.0 },
            'matic-network': { usd: 0.8 },
            'matic': { usd: 0.8 },
            'avalanche-2': { usd: 35.0 },
            'avax': { usd: 35.0 },
            'dai': { usd: 1.0 },
            'weth': { usd: 3000.0 },
            'wrapped-bitcoin': { usd: 45000.0 }
          };
          
          const idArray = Array.isArray(ids) ? ids : ids.split(',');
          const fallbackPrices = {};
          let foundAny = false;
          
          for (const id of idArray) {
            const cleanId = id.trim().toLowerCase();
            if (defaultPrices[cleanId]) {
              fallbackPrices[cleanId] = defaultPrices[cleanId];
              foundAny = true;
            }
          }
          
          if (foundAny) {
            console.log(`⚠️ Using default prices for ${Object.keys(fallbackPrices).length} token(s) - prices may be outdated`);
            return res.json({
              ...fallbackPrices,
              _warning: 'Using default prices - network blocked price APIs. Prices may be outdated.',
              _timestamp: new Date().toISOString()
            });
          }
          
          // If no default prices available, return error
          return res.status(503).json({
            error: 'Price APIs unavailable',
            details: 'CoinGecko and fallback APIs are blocked by your network. Default prices not available for requested tokens.',
            message: 'Unable to fetch prices. Your network appears to be blocking crypto price APIs.',
            suggestion: 'Try: 1) Disable VPN if using one, 2) Use a different network, 3) Contact your network administrator if on a corporate network.',
            tokens_requested: idArray
          });
        }
        
        // If it's a network/timeout error and we have retries left, wait and retry
        if ((attemptError.code === 'ECONNRESET' || 
             attemptError.code === 'ETIMEDOUT' || 
             attemptError.code === 'ENOTFOUND' ||
             attemptError.code === 'ECONNREFUSED' ||
             attemptError.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
             attemptError.code === 'CERT_HAS_EXPIRED' ||
             attemptError.message?.includes('certificate') ||
             !attemptError.response) && attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`Network/SSL error (${attemptError.code || attemptError.message || 'unknown'}). Retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // If it's the last attempt or a non-retryable error, throw
        throw attemptError;
      }
    }
    
    // If we get here, all retries failed
    throw lastError;
    
  } catch (error) {
    console.error('Error fetching crypto price after retries:', error.message);
    console.error('Error details:', {
      code: error.code,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response) {
      // API returned an error response
      const status = error.response.status;
      let message = 'API returned an error';
      let suggestion = '';
      
      if (status === 403) {
        message = 'CoinGecko API is blocked by your network or firewall';
        suggestion = 'This may be due to DNS filtering, corporate firewall, or geographic restrictions. Try using a different network or VPN.';
      } else if (status === 429) {
        message = 'Rate limit exceeded. Please try again in a moment.';
      } else if (status === 404) {
        message = 'Token not found. Please check the token ID.';
      }
      
      res.status(status).json({ 
        error: 'CoinGecko API error', 
        details: typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : error.response.data,
        message: message,
        suggestion: suggestion
      });
    } else if (error.request || error.code || error.message?.includes('certificate')) {
      // Network error, SSL error, or connection issue
      const isSSLError = error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || 
                         error.code === 'CERT_HAS_EXPIRED' ||
                         error.message?.includes('certificate') ||
                         error.message?.includes('SSL');
      
      res.status(503).json({ 
        error: 'CoinGecko API unavailable', 
        details: isSSLError 
          ? `SSL certificate error: ${error.message || error.code}`
          : `Network error: ${error.code || error.message || 'Connection failed'}`,
        message: isSSLError
          ? 'SSL certificate verification failed. This may be due to network configuration issues.'
          : 'Unable to reach CoinGecko API. Please check your internet connection and try again.',
        suggestion: isSSLError
          ? 'If you are on a corporate network, contact your IT department. Otherwise, try using a different network.'
          : 'Check your internet connection and firewall settings.'
      });
    } else {
      // Other error
      res.status(500).json({ 
        error: 'Failed to fetch crypto price', 
        details: error.message,
        message: 'An unexpected error occurred while fetching prices.'
      });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

