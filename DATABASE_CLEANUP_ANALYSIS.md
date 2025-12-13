# Database Cleanup Analysis

## Summary
After analyzing the codebase, here are the tables and columns that appear to be **unused** and could potentially be removed:

**Note:** Your platform has pivoted from an opinion market platform to **Blockbook - a crypto payment platform**. The opinion market tables (`stakes`, `markets`, `market_payouts`, `user_payouts`) are legacy and no longer used.

## ❌ Unused Tables (Legacy from Opinion Market Platform)

### 1. `stakes` Table
**Status**: LEGACY - NOT USED (from old opinion market platform)
- Legacy table from when platform was an opinion/prediction market
- No longer relevant since pivot to crypto payment platform
- **Recommendation**: Remove - no longer needed for Blockbook

### 2. `markets` Table
**Status**: LEGACY - NOT USED (from old opinion market platform)
- Legacy table for opinion markets
- No longer relevant since pivot to crypto payment platform
- **Recommendation**: Remove - no longer needed for Blockbook

### 3. `market_payouts` Table
**Status**: LEGACY - NOT USED (from old opinion market platform)
- Defined in schema files but never queried or inserted into
- No references found in `backend/server.js` or other backend files
- **Recommendation**: Remove - legacy from opinion market platform

### 4. `user_payouts` Table  
**Status**: LEGACY - NOT USED (from old opinion market platform)
- Defined in schema files but never queried or inserted into
- No references found in `backend/server.js` or other backend files
- **Recommendation**: Remove - legacy from opinion market platform

## ⚠️ Unused Columns

### 1. `markets.market_contract_id`
**Status**: NOT USED in backend code
- Column exists in schema but never queried or updated
- **Recommendation**: Remove if not needed, or keep if you plan to use it for contract integration

### 2. `payment_requests.wallet_type`
**Status**: NOT USED in backend code
- Column exists in schema but never queried or updated
- **Recommendation**: Remove if not needed

### 3. `payment_requests.requester_wallet`
**Status**: NOT USED in backend code
- Column exists in schema but never queried or updated
- **Note**: `requester_address` is used instead
- **Recommendation**: Remove as it's redundant with `requester_address`

## ✅ Actively Used Tables (Current Blockbook Platform)

These tables are actively used for the crypto payment platform and should be kept:

1. **`users`** - Core user data and profiles
2. **`contacts`** - User contacts/relationships (used in autocomplete/search)
3. **`payment_requests`** - Payment request feature (create requests, accept & pay)
4. **`payment_sends`** - Payment send feature (direct wallet-to-wallet payments)
5. **`preferred_wallets`** - User preferred wallet addresses per chain

## 🔍 Legacy Opinion Market Tables

All opinion market related tables are legacy and can be removed:
- `stakes` - User bets on markets (legacy)
- `markets` - Opinion market data (legacy)
- `market_payouts` - Market-level payout tracking (legacy)
- `user_payouts` - User-level payout tracking (legacy)

These were used for the old opinion/prediction market platform but are no longer relevant for Blockbook (crypto payment platform).

## 📋 Cleanup Recommendations

### High Priority (Safe to Remove - Legacy Tables)
1. **`stakes` table** - Legacy from opinion market platform
2. **`markets` table** - Legacy from opinion market platform
3. **`market_payouts` table** - Legacy from opinion market platform
4. **`user_payouts` table** - Legacy from opinion market platform
5. **`payment_requests.requester_wallet`** - Redundant with `requester_address`
6. **`payment_requests.wallet_type`** - Not used

### Medium Priority (Verify Before Removing)
1. **`markets.market_contract_id`** - May be needed for future contract integration

## 🚨 Important Notes

1. **Backup First**: Always backup your database before removing tables/columns
2. **Check Frontend**: This analysis focused on backend usage. Verify frontend doesn't reference these fields
3. **Future Plans**: If you plan to implement payout tracking features, you might want to keep `market_payouts` and `user_payouts`
4. **Data Migration**: If removing `user_payouts`, ensure any existing data is migrated to `stakes` table if needed

## SQL Cleanup Script (Use with Caution)

```sql
-- ⚠️ BACKUP YOUR DATABASE FIRST! ⚠️

-- Remove legacy opinion market tables
DROP TABLE IF EXISTS stakes CASCADE;
DROP TABLE IF EXISTS markets CASCADE;
DROP TABLE IF EXISTS market_payouts CASCADE;
DROP TABLE IF EXISTS user_payouts CASCADE;

-- Remove unused columns
ALTER TABLE payment_requests DROP COLUMN IF EXISTS wallet_type;
ALTER TABLE payment_requests DROP COLUMN IF EXISTS requester_wallet;
```

## Verification Queries

Run these to verify tables/columns exist before cleanup:

```sql
-- Check if legacy tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('stakes', 'markets', 'market_payouts', 'user_payouts');

-- Check if unused columns exist
SELECT column_name, table_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'payment_requests'
AND column_name IN ('wallet_type', 'requester_wallet');
```
