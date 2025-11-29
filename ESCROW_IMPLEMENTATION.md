# Escrow-Based "Send" Implementation

## Overview

The Pay mode now uses an escrow-based system where funds are held in a smart contract until the recipient accepts (claims) the payment. If the recipient never accepts, the sender can cancel and receive funds back.

## Multi-Chain Support

Supports the following chains:
- **Base** (Chain ID: 8453)
- **Ethereum** (Chain ID: 1)
- **BNB Chain** (Chain ID: 56)
- **Polygon** (Chain ID: 137)

Each chain has its own escrow contract instance. No cross-chain complexity - everything stays within the same chain.

## Smart Contract

### XelliEscrow.sol

Located at: `contracts/contracts/XelliEscrow.sol`

**Key Features:**
- Accepts any ERC-20 token
- Payment IDs are local to each chain (0, 1, 2, ...)
- Funds held in escrow until claimed or cancelled
- Sender can cancel if payment expires or has no expiry
- Recipient can claim at any time (if not expired)

**Functions:**
- `createPayment(recipient, token, amount, expiry)` - Creates escrow payment
- `claimPayment(paymentId)` - Recipient claims payment
- `cancelPayment(paymentId)` - Sender cancels payment
- `getPayment(paymentId)` - View payment details

**Events:**
- `PaymentCreated` - Emitted when payment is created
- `PaymentClaimed` - Emitted when payment is claimed
- `PaymentCancelled` - Emitted when payment is cancelled

## Deployment

### Deploy to Each Chain

```bash
cd contracts
npm install
npm run compile
```

Deploy to each chain:

```bash
# Base
npx hardhat run scripts/deploy-escrow.js --network base

# Ethereum
npx hardhat run scripts/deploy-escrow.js --network mainnet

# BNB Chain
npx hardhat run scripts/deploy-escrow.js --network bsc

# Polygon
npx hardhat run scripts/deploy-escrow.js --network polygon
```

The deployment script automatically updates `frontend/lib/escrowConfig.ts` with the contract addresses.

### Update Hardhat Config

The `hardhat.config.js` has been updated to include all supported networks. Make sure to set the appropriate RPC URLs in your `.env` file:

```env
PRIVATE_KEY=your_private_key
BASE_RPC_URL=https://mainnet.base.org
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
POLYGON_RPC_URL=https://polygon-rpc.com
```

## Database Schema

### Escrow Payments Table

Run the migration:

```bash
psql your_database < backend/database/escrow_payments_schema.sql
```

**Table Structure:**
- `id` - UUID (primary key)
- `onchain_id` - Payment ID from smart contract
- `sender_address` - Sender's wallet address
- `recipient_address` - Recipient's wallet address
- `chain_id` - Chain ID (8453, 1, 56, 137)
- `token_address` - ERC-20 token address
- `token_symbol` - Token symbol (USDC, USDT, etc.)
- `amount` - Amount in token's smallest unit
- `expiry` - Expiry timestamp (NULL = no expiry)
- `status` - pending, claimed, cancelled, expired
- `tx_hash_create` - Transaction hash when created
- `tx_hash_claim` - Transaction hash when claimed
- `tx_hash_cancel` - Transaction hash when cancelled
- Timestamps: `created_at`, `updated_at`, `claimed_at`, `cancelled_at`

## Backend API Endpoints

### Create Escrow Payment
```
POST /api/escrow-payments
Body: {
  onchainId: number,
  senderAddress: string,
  recipientAddress: string,
  chainId: number,
  tokenAddress: string,
  tokenSymbol: string,
  amount: string,
  expiry: number | null,
  txHashCreate: string
}
```

### Get Escrow Payment
```
GET /api/escrow-payments/:id
```

### Get Escrow Payments (with filters)
```
GET /api/escrow-payments?senderAddress=...&recipientAddress=...&status=...&chainId=...
```

### Sync Escrow Payment (after claim/cancel)
```
POST /api/escrow-payments/:id/sync
Body: {
  txHashClaim?: string,
  txHashCancel?: string
}
```

## Frontend Components

### CreateMarketSidebar (Updated)

The Pay mode now:
1. Checks if escrow contract is deployed on selected chain
2. Switches to correct chain if needed
3. Approves token spending (if needed)
4. Creates escrow payment via `createPayment()`
5. Parses `PaymentCreated` event
6. Saves payment to backend

### EscrowPaymentCard (New)

Component for displaying and interacting with escrow payments:
- Shows payment details (amount, token, chain, status)
- "Accept Payment" button for recipients
- "Cancel" button for senders
- Handles chain switching automatically
- Syncs with backend after claim/cancel

## User Flows

### Sender Flow (Pay Mode)

1. User selects "Pay" mode
2. Selects chain, token, amount, recipient
3. Clicks "Pay crypto"
4. Wallet switches to correct chain (if needed)
5. Approves token spending (if needed)
6. Creates escrow payment
7. Payment is held in escrow contract
8. Recipient receives notification/link

### Recipient Flow (Accept/Claim)

1. Recipient views payment (via link or feed)
2. Connects wallet
3. Wallet switches to correct chain (if needed)
4. Clicks "Accept Payment"
5. Calls `claimPayment()` on escrow contract
6. Funds are transferred to recipient
7. Payment status updated to "claimed"

### Sender Cancel Flow

1. Sender views their outgoing payments
2. Sees pending payment that hasn't been claimed
3. Connects wallet (must be sender address)
4. Wallet switches to correct chain (if needed)
5. Clicks "Cancel"
6. Calls `cancelPayment()` on escrow contract
7. Funds are returned to sender
8. Payment status updated to "cancelled"

## Important Notes

1. **No Cross-Chain**: Each payment is tied to a specific chain. No bridging or cross-chain messaging.

2. **Token Approval**: Users need to approve the escrow contract to spend tokens. The frontend requests max approval for better UX.

3. **Chain Switching**: The frontend automatically switches the wallet to the correct chain when needed.

4. **Event Parsing**: The frontend parses `PaymentCreated` events from transaction receipts to get the on-chain payment ID.

5. **Backend Sync**: After on-chain transactions (claim/cancel), the frontend syncs with the backend to update payment status.

## Next Steps

1. Deploy escrow contracts to all chains
2. Update `frontend/lib/escrowConfig.ts` with deployed addresses
3. Run database migration
4. Test on each chain
5. Add UI for viewing incoming/outgoing escrow payments in feed

## Testing

To test the escrow system:

1. Deploy contract to a testnet (Base Sepolia, Sepolia, BSC Testnet, Mumbai)
2. Update `escrowConfig.ts` with testnet addresses
3. Create a payment in Pay mode
4. Switch to recipient wallet and claim
5. Test cancel flow as sender

