# Codebase Cleanup Summary - Opinion Market to Blockbook Pivot

## Overview
This document summarizes all cleanup done to remove legacy opinion market code after pivoting to Blockbook (crypto payment platform).

## Database Cleanup

### Tables Removed
- ✅ `stakes` - User bets on markets (legacy)
- ✅ `markets` - Opinion market data (legacy)
- ✅ `market_payouts` - Market-level payout tracking (legacy)
- ✅ `user_payouts` - User-level payout tracking (legacy)

### Columns Removed from `users` table
- ✅ `markets_created` - Number of markets created
- ✅ `total_staked` - Total amount staked
- ✅ `total_earnings` - Total earnings from markets
- ✅ `wins` - Number of winning bets
- ✅ `losses` - Number of losing bets

### Columns Removed from `payment_requests` table
- ✅ `wallet_type` - Unused column
- ✅ `requester_wallet` - Redundant with `requester_address`

## Frontend Cleanup

### Files Renamed
- ✅ `CreateMarketSidebar.tsx` → `CreatePaymentSidebar.tsx`
  - Updated all imports in:
    - `frontend/app/pay/page.tsx`
    - `frontend/app/request/page.tsx`
    - `frontend/app/pay-request/page.tsx`

### Files Updated
- ✅ `frontend/app/profile/page.tsx`
  - Removed legacy stats display (markets_created, wins, losses, win rate)
  - Removed "Your Markets" section
  - Removed "Recent Stakes" section
  - Removed "Total Staked" and "Total Earnings" displays
  - Cleaned up User interface (removed legacy fields)

- ✅ `frontend/components/CreatePaymentSidebar.tsx`
  - Updated component name from `CreateMarketSidebar` to `CreatePaymentSidebar`
  - Updated all console.log messages to use new name

- ✅ `frontend/components/MockData.tsx`
  - Added deprecation comment

- ✅ `frontend/components/Comments.tsx`
  - Added deprecation comment (component no longer used)

- ✅ `frontend/components/SidebarWrapper.tsx`
  - Removed `/market` route from knownRoutes (no longer exists)

## Backend Cleanup

### Files Removed/Deprecated
- ✅ `backend/scripts/seed-mock-data.js`
  - Deleted (seeded opinion market data)
  - Created `.DEPRECATED` file with explanation

## Current Active Tables (Blockbook)

1. **`users`** - User profiles (cleaned)
2. **`contacts`** - User contacts/relationships
3. **`payment_requests`** - Payment request feature
4. **`payment_sends`** - Payment send history
5. **`preferred_wallets`** - Preferred wallets per chain

## Remaining Legacy Files (Documentation/Schema)

These files are kept for reference but are not used:
- `COMPLETE_SUPABASE_SCHEMA.sql` - Contains legacy schema
- `supabase_schema.sql` - Contains legacy schema
- `backend/database/schema.sql` - Contains legacy schema
- `backend/database/payout_schema.sql` - Legacy payout schema
- `supabase_seed_data.sql` - Legacy seed data
- `contracts/contracts/KOI.sol` - Legacy smart contract
- `contracts/contracts/OpinionMarket.sol` - Legacy smart contract
- Various markdown documentation files

## Cleanup Scripts Created

1. `cleanup_legacy_tables.sql` - Removes legacy tables and functions
2. `cleanup_users_table.sql` - Removes legacy columns from users table

## Verification

After cleanup, verify:
- ✅ No frontend code references `markets`, `stakes`, or opinion market features
- ✅ No backend API endpoints query legacy tables
- ✅ Database schema matches Blockbook requirements
- ✅ All imports updated to use `CreatePaymentSidebar`
- ✅ Profile page no longer displays legacy stats

## Notes

- Smart contracts in `contracts/` directory are legacy and not used
- Some documentation files still reference opinion markets but are kept for historical reference
- The platform is now fully focused on crypto payments (Blockbook)
