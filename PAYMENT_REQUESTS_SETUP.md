# Payment Requests Feature Setup

## Overview

The payment requests feature allows users to post payment requests (like Venmo notes) that anyone can accept and pay directly from their wallet. The system automatically switches to the correct chain and sends USDC payments wallet-to-wallet.

## Database Setup

1. Run the payment requests schema:
```sql
-- Run this SQL in your database
\i backend/database/payment_requests_schema.sql
```

Or manually create the table:
```sql
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_address VARCHAR(255) NOT NULL,
    amount NUMERIC(20, 6) NOT NULL,
    token_symbol VARCHAR(10) DEFAULT 'USDC',
    token_address VARCHAR(255) NOT NULL,
    chain_id INTEGER NOT NULL,
    chain_name VARCHAR(50) NOT NULL,
    caption TEXT,
    status VARCHAR(20) DEFAULT 'open',
    paid_by VARCHAR(255),
    tx_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);
```

## Backend API Endpoints

- `GET /api/payment-requests` - Get all payment requests (query params: `status`, `requester_address`)
- `GET /api/payment-requests/:id` - Get single payment request
- `POST /api/payment-requests` - Create payment request
- `PATCH /api/payment-requests/:id/paid` - Mark request as paid
- `PATCH /api/payment-requests/:id/cancel` - Cancel request

## Frontend Components

### PaymentRequestCard
Displays a payment request in the feed with:
- Amount and token info
- Caption/description
- Accept & Pay button (auto-switches chain)
- Status indicators (Open/Paid)

### CreatePaymentRequestComposer
Sidebar component for creating payment requests:
- Amount input
- Optional caption
- Posts to Base mainnet by default

## How It Works

1. **Create Request**: User enters amount (USDC) and optional caption
2. **Post**: Request is saved to database and displayed in feed
3. **Accept**: Anyone clicks "Accept & Pay"
   - Wallet auto-switches to Base (if needed)
   - ERC-20 transfer is initiated
   - Transaction is sent wallet-to-wallet
4. **Verification**: On transaction success, request is marked as paid
5. **Update**: Feed refreshes to show paid status

## Chain Support

Currently supports:
- **Base Mainnet** (chainId: 8453) - Default
- **Base Sepolia** (chainId: 84532) - Testnet

USDC addresses:
- Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Event Listener (Optional)

A background service can monitor ERC-20 transfers to automatically mark requests as paid:

```bash
node backend/scripts/payment-listener.js
```

This runs every 30 seconds and checks for matching transfers. The frontend also updates status immediately on transaction success, so this is mainly a backup.

## Environment Variables

Add to `.env`:
```
BASE_RPC_URL=https://mainnet.base.org
```

## Usage

1. Navigate to the main feed
2. Click "Payments" tab in the header
3. Create a payment request in the sidebar (connect wallet first)
4. Requests appear in the feed
5. Anyone can click "Accept & Pay" to send payment
6. Wallet will switch to Base automatically if needed
7. Transaction is sent directly to requester's address

## Features

✅ Non-custodial - No funds held by platform
✅ Auto chain-switch - Seamless cross-network experience
✅ Social context - Captions create identity + trust
✅ Wallet-native - Uses WalletConnect / MetaMask
✅ Real-time updates - Status updates on payment
✅ Event listener - Backend can detect payments automatically

## Future Enhancements

- Support for multiple chains (Arbitrum, Polygon)
- Support for multiple tokens (DAI, USDT)
- Payment request expiration
- Recurring payment requests
- Integration with on-chain social platforms (Farcaster, Lens)

