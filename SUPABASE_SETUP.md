# Supabase Database Setup Guide

This guide will help you set up the complete database schema for the KOI opinion market platform on Supabase.

## Prerequisites

1. A Supabase account (https://supabase.com)
2. A Supabase project created
3. Basic knowledge of SQL

## Setup Steps

### 1. Access Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Select your project
3. Navigate to the **SQL Editor** in the left sidebar

### 2. Run the Schema Script

1. Open the `supabase_schema.sql` file in your codebase
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

The script will create:
- ✅ 5 main tables (users, markets, stakes, market_payouts, user_payouts)
- ✅ All necessary indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic updates
- ✅ Helper functions for common queries

### 3. Verify Schema Creation

Run this query to verify all tables were created:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'markets', 'stakes', 'market_payouts', 'user_payouts');
```

### 4. Update Backend Connection (Optional but Recommended)

If you want to use Supabase's connection pooler for better performance, update your `backend/server.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

// Update these values from your Supabase project settings
const pool = new Pool({
  user: process.env.SUPABASE_DB_USER || 'postgres',
  host: process.env.SUPABASE_DB_HOST || 'db.your-project.supabase.co',
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  port: process.env.SUPABASE_DB_PORT || 5432,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});
```

Get these values from: **Project Settings → Database**

### 5. Test the Schema

Run these test queries to ensure everything works:

```sql
-- Test 1: Insert a test user
INSERT INTO users (wallet_address, username)
VALUES ('0x1234567890123456789012345678901234567890', 'TestUser')
RETURNING *;

-- Test 2: Insert a test market
INSERT INTO markets (
    creator_address, 
    title, 
    description, 
    category, 
    ends_at, 
    smart_contract_address
)
VALUES (
    '0x1234567890123456789012345678901234567890',
    'Test Market',
    'This is a test market',
    'other',
    NOW() + INTERVAL '1 day',
    '0x0000000000000000000000000000000000000000'
)
RETURNING *;

-- Test 3: Insert a test stake
INSERT INTO stakes (market_id, user_wallet, amount, side)
SELECT 
    m.id,
    '0x1234567890123456789012345678901234567890',
    100.00,
    1
FROM markets m
WHERE m.title = 'Test Market'
RETURNING *;

-- Test 4: Verify automatic totals update
SELECT 
    id, 
    title, 
    total_agree_stakes, 
    total_disagree_stakes 
FROM markets 
WHERE title = 'Test Market';

-- Test 5: Get market stats
SELECT * FROM get_market_stats(
    (SELECT id FROM markets WHERE title = 'Test Market')
);

-- Test 6: Get leaderboard
SELECT * FROM get_user_leaderboard(10);

-- Cleanup (optional)
DELETE FROM stakes WHERE market_id IN (SELECT id FROM markets WHERE title = 'Test Market');
DELETE FROM markets WHERE title = 'Test Market';
DELETE FROM users WHERE username = 'TestUser';
```

## Row Level Security (RLS) Notes

The schema includes RLS policies for basic security. For production:

1. **Authentication Setup**: You'll need to set the `app.current_wallet` setting when making queries from your backend:

```javascript
await pool.query('SET app.current_wallet = $1', [userWalletAddress]);
```

2. **Service Role**: For backend services that need full access, you can:
   - Use Supabase's service role key (bypasses RLS)
   - Or connect directly to PostgreSQL without RLS

3. **Custom Policies**: Adjust the RLS policies in the schema to match your security requirements.

## Key Features

### Automatic Updates
- Market totals update automatically when stakes are inserted
- User stats update when payouts are claimed

### Performance Indexes
- Indexes on all foreign keys
- Indexes on frequently queried columns
- Composite indexes for common query patterns

### Helper Functions
- `get_market_stats(market_id)`: Get detailed statistics for a market
- `get_user_leaderboard(limit)`: Get top users by earnings

### Data Integrity
- Foreign key constraints ensure data consistency
- Cascade deletes clean up related records
- Unique constraints prevent duplicate entries

## Database Structure

```
users
  ├── markets (created by user)
  └── stakes (placed by user)

markets
  ├── stakes (on this market)
  ├── market_payouts (if resolved)
  └── user_payouts (for this market)

stakes
  ├── belongs to → users
  └── belongs to → markets

market_payouts
  └── belongs to → markets

user_payouts
  ├── belongs to → users
  └── belongs to → markets
```

## Production Checklist

- [ ] Set up database backups in Supabase
- [ ] Configure connection pooling
- [ ] Review and adjust RLS policies
- [ ] Set up database monitoring
- [ ] Create database migrations for future changes
- [ ] Add indexes for any custom queries you add
- [ ] Test with realistic data volumes

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the entire schema script
- Check that you're connected to the correct database

### RLS blocking queries
- Temporarily disable RLS: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
- Or use service role connection for backend

### Performance issues
- Check that indexes were created: `Place tables have been completed, check for index names with \d+ table_name`
- Use EXPLAIN ANALYZE to identify slow queries
- Consider partitioning large tables if data grows significantly

## Next Steps

1. Update your backend `.env` file with Supabase credentials
2. Test the API endpoints to ensure database integration works
3. Deploy and monitor the production database
4. Set up automated backups and monitoring

For more help, check the [Supabase Documentation](https://supabase.com/docs).
