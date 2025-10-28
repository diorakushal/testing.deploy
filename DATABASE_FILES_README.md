# Database Files Summary

This directory contains the complete database setup for your KOI opinion market platform.

## Files Overview

### 1. `supabase_schema.sql` ⭐ **START HERE**
**Complete database schema for Supabase**

This is the main file you need. It includes:
- ✅ All 5 core tables (users, markets, stakes, market_payouts, user_payouts)
- ✅ All indexes for optimal performance
- ✅ Row Level Security (RLS) policies
- ✅ Automatic triggers for data consistency
- ✅ Helper functions for common queries
- ✅ Foreign key constraints
- ✅ Comprehensive documentation

**Usage**: Copy and paste into Supabase SQL Editor → Run

### 2. `supabase_seed_data.sql`
**Sample data to populate your database**

Use this to:
- Test the schema with realistic data
- See how relationships work between tables
- Demo active and resolved markets
- Verify all features function correctly

**Usage**: Run after `supabase_schema.sql` in Supabase SQL Editor

### 3. `SUPABASE_SETUP.md`
**Complete setup guide**

Includes:
- Step-by-step setup instructions
- Database connection configuration
- RLS policy explanation
- Troubleshooting tips
- Production deployment checklist

**Usage**: Follow along while setting up your database

## Quick Start

1. **Go to Supabase Dashboard** → Your Project → SQL Editor

2. **Run the schema**:
   - Open `supabase_schema.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" (or Cmd/Ctrl + Enter)

3. **Verify installation** (optional):
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('users', 'markets', 'stakes', 'market_payouts', 'user_payouts');
   ```

4. **Add sample data** (optional):
   - Open `supabase_seed_data.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run"

5. **Update backend connection**:
   - Copy your Supabase connection details from Project Settings → Database
   - Update `backend/.env` or `backend/server.js` with these credentials

## Schema Highlights

### Core Tables
```
users          → User profiles and statistics
markets        → Opinion markets
stakes         → Individual user stakes
market_payouts → Market-level payout tracking
user_payouts   → User-level payout records
```

### Key Features
- **UUID-based IDs** for all tables
- **Automatic aggregations** via triggers
- **Performance indexes** on all foreign keys
- **Data integrity** through constraints
- **Security** via RLS policies
- **Smart contract integration** fields

### Automatic Triggers
- Market totals update when stakes are added
- User stats update when payouts are claimed
- Wins/losses tracked automatically

### Helper Functions
- `get_market_stats(market_id)` - Get detailed market statistics
- `get_user_leaderboard(limit)` - Get top users by earnings

## Database Flow

```
1. User connects wallet → Creates/updates user record
2. User creates market → Market record inserted
3. Users stake → Stake records created, totals updated
4. Market resolves → Winner calculated, payout records created
5. Winners claim → Payouts distributed, stats updated
```

## Compatibility

✅ **Supabase** (PostgreSQL)  
✅ **Your existing backend/server.js**  
✅ **KOI smart contracts**  
✅ **OpinionMarket.sol**  

## Important Notes

### RLS Policies
The schema includes Row Level Security policies. For backend use:

**Option 1**: Use service role (bypasses RLS)
```javascript
const pool = new Pool({
  // ... your config
  // Service role key bypasses RLS
});
```

**Option 2**: Set wallet context before queries
```javascript
await pool.query('SET app.current_wallet = $1', [walletAddress]);
```

**Option 3**: Disable RLS (for development)
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE markets DISABLE ROW LEVEL SECURITY;
-- ... repeat for other tables
```

### Data Types
- All monetary values use `NUMERIC(20, 6)` for precision
- Timestamps use `TIMESTAMP` (with timezone)
- UUID primary keys for scalability
- VARCHAR for addresses and strings

### Indexes
Indexes are automatically created on:
- All foreign keys
- Frequently queried columns
- Composite queries (user + market, etc.)

This ensures fast queries even with millions of records.

## Production Considerations

Before going to production:

1. **Backups**: Set up automated backups in Supabase
2. **Monitoring**: Enable query performance monitoring
3. **Connection Pooling**: Use Supabase's connection pooler
4. **Rate Limiting**: Implement API rate limits
5. **Data Archival**: Plan for old market archiving
6. **Partitioning**: Consider partitioning large tables
7. **Read Replicas**: Use for heavy read workloads

## Support

For issues or questions:
1. Check `SUPABASE_SETUP.md` for detailed troubleshooting
2. Review Supabase documentation: https://supabase.com/docs
3. Test queries in SQL Editor before using in code

## Migration Path

If you have existing data in `backend/database/schema.sql`:

1. Export existing data if any
2. Run `supabase_schema.sql` to create new schema
3. Import data matching new structure
4. Update any foreign key references from INT to UUID

## Next Steps

After database setup:
1. ✅ Test API endpoints
2. ✅ Verify smart contract integration
3. ✅ Test payout distribution
4. ✅ Load test with sample data
5. ✅ Deploy to production

---

**Ready to go? Start with `supabase_schema.sql` and follow `SUPABASE_SETUP.md`!**
