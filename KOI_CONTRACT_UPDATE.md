# KOI Smart Contract Integration Complete

## What Changed

### 1. New Smart Contract (`contracts/contracts/KOI.sol`)
- Replaced `OpinionMarket.sol` with cleaner `KOI.sol` implementation
- Uses `uint256` market IDs instead of `bytes32`
- Separate functions: `stakeAgree()` and `stakeDisagree()`
- Clearer structure with better event emissions
- Uses `uint8` for winner/side values

### 2. Updated Deployment Script
- New file: `contracts/scripts/deploy-koi.js`
- Simplified deployment with token array
- Automatically saves deployment info to frontend

### 3. Frontend Updates
- **CreateMarketModal.tsx**: Updated to use new `createMarket()` signature
- **Market Detail Page**: Uses `stakeAgree()` and `stakeDisagree()` functions
- Updated ABI references throughout

### 4. Backend Updates
- **server.js**: Uses new KOI.json ABI
- Market ID conversion from string to uint256
- Updated resolution logic

## Key Differences from Old Contract

| Feature | Old Contract | New KOI Contract |
|---------|-------------|------------------|
| Market ID Type | bytes32 | uint256 |
| Staking Function | One function with side param | Two separate functions |
| Market Counter | Manual tracking | Built-in `marketCounter` |
| Winner Type | uint256 | uint8 |
| Market Duration | Parameter | Constant (24 hours) |

## How to Deploy

### 1. Install Contract Dependencies
```bash
cd contracts
npm install
```

### 2. Compile Contract
```bash
npm run compile
```

### 3. Deploy to Mumbai Testnet (for testing)
```bash
# Make sure you have .env file with PRIVATE_KEY and RPC URL
npm run deploy:mumbai
```

### 4. Deploy to Polygon Mainnet
```bash
npm run deploy
```

### 5. Update Environment Variables

After deployment, copy the contract address and update:

**backend/.env**:
```env
MARKET_CONTRACT_ADDRESS=YOUR_DEPLOYED_ADDRESS
```

**frontend/.env.local**:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_DEPLOYED_ADDRESS
```

### 6. Restart Servers

```bash
# Backend
cd backend
npm start

# Frontend (new terminal)
cd frontend
npm run dev
```

## Smart Contract Functions

### Creating Markets
```solidity
function createMarket(string memory _title, address _stakingToken) 
    returns (uint256 marketId)
```

### Staking
```solidity
function stakeAgree(uint256 _marketId, uint256 _amount)
function stakeDisagree(uint256 _marketId, uint256 _amount)
```

### Market Resolution
```solidity
function resolveMarket(uint256 _marketId)
```

### Claiming Winnings
```solidity
function claimWinnings(uint256 _marketId)
```

## Testing the Integration

1. **Create a Market**
   - Open http://localhost:3000 (or 3001)
   - Click "Create Market"
   - Enter opinion statement
   - Confirm transaction in MetaMask

2. **Place a Stake**
   - Navigate to market
   - Enter stake amount
   - Click "Agree" or "Disagree"
   - Confirm transaction

3. **Wait for Resolution**
   - Market resolves after 24 hours
   - Or call `resolveMarket()` manually

4. **Claim Winnings**
   - Winners can claim proportional share
   - Losers don't get refunds (by design)

## Security Features

- ✅ ReentrancyGuard on all state-changing functions
- ✅ Only supported tokens (USDC/USDT)
- ✅ One stake per user per market
- ✅ Market duration enforcement
- ✅ Winner determined by total stakes
- ✅ 5% platform rake

## Next Steps

1. **Deploy to Testnet** - Test on Mumbai with test tokens
2. **Deploy to Mainnet** - When ready for production
3. **Add Monitoring** - Track market creation, stakes, resolutions
4. **Gas Optimization** - Review and optimize if needed

## Files Modified

- ✅ `contracts/contracts/KOI.sol` (new)
- ✅ `contracts/scripts/deploy-koi.js` (new)
- ✅ `backend/contracts/KOI.json` (new ABI)
- ✅ `backend/server.js` (updated integration)
- ✅ `frontend/components/CreateMarketModal.tsx` (updated)
- ✅ `frontend/app/market/[id]/page.tsx` (updated)

All integrations are complete and ready for deployment! 🚀

