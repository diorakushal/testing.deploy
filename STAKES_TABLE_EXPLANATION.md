# Stakes Table - Legacy/Unused Table

## ⚠️ IMPORTANT: This is a LEGACY table from your old opinion market platform

## Overview
The `stakes` table is a **legacy table** from when your platform was an opinion market/prediction market. Since you've pivoted to **Blockbook - a crypto payment platform**, this table is **no longer used**.

## Current Platform
Your platform is now **Blockbook** - a crypto payment platform for:
- Creating payment requests
- Sending direct payments
- Managing contacts and preferred wallets
- Multi-chain crypto transactions

## Legacy Purpose (No Longer Relevant)

The `stakes` table was used to track:
1. **User bets** - When users placed money on opinion markets (agree or disagree)
2. **Payout tracking** - Calculated winnings and whether they've been claimed
3. **Market statistics** - Used to calculate total stakes on each side of a market

## Table Structure

```sql
CREATE TABLE stakes (
  id UUID PRIMARY KEY,
  market_id UUID NOT NULL,           -- Which market this stake is on
  user_wallet VARCHAR(255) NOT NULL, -- Who placed the stake
  amount NUMERIC(20, 6) NOT NULL,    -- How much they staked
  side SMALLINT NOT NULL,            -- 1 = Agree, 2 = Disagree
  created_at TIMESTAMP,             -- When the stake was placed
  payout NUMERIC(20, 6),            -- Calculated winnings (if winner)
  claimed BOOLEAN DEFAULT FALSE,     -- Whether user claimed their winnings
  claimed_at TIMESTAMP,             -- When winnings were claimed
  tx_hash VARCHAR(255),             -- Blockchain transaction hash
  block_number BIGINT               -- Blockchain block number
);
```

## How It Works

### 1. **When a User Places a Bet**
- User connects wallet and stakes money on a market (Agree or Disagree)
- A new row is created in `stakes` table with:
  - `market_id` - The market they're betting on
  - `user_wallet` - Their wallet address
  - `amount` - How much they're betting
  - `side` - 1 for Agree, 2 for Disagree
  - `tx_hash` - The blockchain transaction hash

### 2. **Automatic Updates via Triggers**
When a stake is inserted, database triggers automatically:
- Update `markets.total_agree_stakes` or `markets.total_disagree_stakes`
- Update `users.total_staked` for that user

### 3. **When Market Resolves**
- The market is marked as resolved with a winner (1 = Agree won, 2 = Disagree won)
- For winning stakes, `payout` is calculated based on:
  - Their stake amount
  - Total winning pool
  - Platform rake (typically 5%)

### 4. **When User Claims Winnings**
- `claimed` is set to `TRUE`
- `claimed_at` is recorded
- User stats are updated (wins/losses, total_earnings)

## Usage in Your Application

### Backend Usage
- **Database triggers** automatically update market totals when stakes are inserted
- **Database triggers** update user statistics when stakes are claimed
- Used to calculate market statistics and user performance

### Frontend Usage
- **Profile pages** display user's recent stakes
- Shows stake amount, side (Agree/Disagree), and payout status
- Displays win/loss information for resolved markets

### Smart Contract Integration
- The blockchain contracts also track stakes on-chain
- The database `stakes` table mirrors on-chain data for faster queries
- `tx_hash` and `block_number` link database records to blockchain transactions

## Key Fields Explained

| Field | Purpose |
|-------|---------|
| `market_id` | Links stake to a specific market |
| `user_wallet` | Identifies who placed the stake |
| `amount` | How much money was staked |
| `side` | 1 = Agree, 2 = Disagree |
| `payout` | Calculated winnings (only for winners) |
| `claimed` | Whether user has withdrawn their winnings |
| `tx_hash` | Blockchain transaction reference |

## Example Data Flow

1. **User stakes $100 on "Agree" side:**
   ```
   INSERT INTO stakes (market_id, user_wallet, amount, side, tx_hash)
   VALUES ('market-uuid', '0x123...', 100, 1, '0xabc...')
   ```
   → Trigger updates `markets.total_agree_stakes += 100`

2. **Market resolves with "Agree" as winner:**
   ```
   UPDATE stakes SET payout = 150 WHERE market_id = '...' AND side = 1
   ```
   (Payout calculated based on pool size and rake)

3. **User claims winnings:**
   ```
   UPDATE stakes SET claimed = TRUE, claimed_at = NOW() WHERE id = '...'
   ```
   → Trigger updates `users.total_earnings` and `users.wins`

## Relationship to Other Tables

- **`markets`** - Each stake belongs to one market
- **`users`** - Each stake belongs to one user (by wallet_address)
- **`market_payouts`** - Would track market-level payout info (currently unused)
- **`user_payouts`** - Would track user-level payouts (currently unused, functionality handled by `stakes.payout`)

## Why It's Important

The `stakes` table is **essential** because it:
- Tracks all betting activity
- Enables payout calculations
- Powers user statistics and leaderboards
- Provides transaction history
- Links database records to blockchain transactions

## Current Status: UNUSED / LEGACY

The `stakes` table (along with `markets`, `market_payouts`, and `user_payouts`) are **legacy tables** from your old opinion market platform. They are **NOT used** in your current Blockbook crypto payment platform.

## Recommendation

Since you've pivoted to a crypto payment platform, you can likely **remove these legacy tables**:
- ❌ `stakes` - Not used
- ❌ `markets` - Not used  
- ❌ `market_payouts` - Not used
- ❌ `user_payouts` - Not used

**Current active tables for Blockbook:**
- ✅ `users` - User profiles
- ✅ `payment_requests` - Payment request feature
- ✅ `payment_sends` - Payment send history
- ✅ `contacts` - User contacts
- ✅ `preferred_wallets` - User preferred wallets per chain

## Cleanup

Before removing, verify:
1. No frontend code references these tables
2. No backend API endpoints query them
3. No important historical data needs to be preserved

See `DATABASE_CLEANUP_ANALYSIS.md` for detailed cleanup recommendations.
