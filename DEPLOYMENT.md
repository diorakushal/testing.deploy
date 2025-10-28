# Deployment Guide

## Quick Start

### 1. Prerequisites
```bash
# Install dependencies
npm install -g node-gyp
npm install -g hardhat
```

### 2. Setup Database

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Or use Docker
docker run --name postgres-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# Create database
createdb opinion_market
cd backend
psql opinion_market < database/schema.sql
```

### 3. Configure Environment

#### Backend Configuration
Create `backend/.env`:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=opinion_market
DB_PASSWORD=postgres
DB_PORT=5432

POLYGON_RPC_URL=https://polygon-rpc.com
MARKET_CONTRACT_ADDRESS=

PORT=5000
```

#### Frontend Configuration
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CONTRACT_ADDRESS=
```

### 4. Deploy Smart Contract

#### For Testnet (Mumbai)
```bash
cd contracts
npm install
npm run compile

# Create .env file
echo "PRIVATE_KEY=your_private_key" > .env
echo "MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com" >> .env

# Deploy to Mumbai
npm run deploy:mumbai
```

#### For Mainnet (Polygon)
```bash
cd contracts
npm install
npm run compile

# Update hardhat.config.js with your private key and RPC URL
# Deploy to Polygon
npm run deploy
```

**Important**: Copy the deployed contract address and update both `backend/.env` and `frontend/.env.local`

### 5. Install Dependencies

```bash
# Install all dependencies
./setup.sh

# Or manually
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd contracts && npm install && cd ..
```

### 6. Run the Application

#### Terminal 1 - Backend
```bash
cd backend
npm start
# Server running on http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
# App running on http://localhost:3000
```

### 7. Access the Application

Open your browser and navigate to: http://localhost:3000

## Testing the Application

### 1. Connect MetaMask
- Install MetaMask browser extension
- Add Polygon network (or Mumbai for testnet)
- Import test account with MATIC for gas

### 2. Get Test Tokens

**Mumbai Testnet USDC**:
- Faucet: https://faucet.polygon.technology/
- USDC Token: `0x0FA8781a83E46826621b3DC094cDbC922b47fA6`
- Request test tokens

### 3. Create Your First Market
1. Click "Create Market" button
2. Enter opinion statement
3. Select category and token type
4. Submit transaction
5. Approve gas fees in MetaMask

### 4. Stake on Markets
1. Navigate to any active market
2. Enter stake amount (min $1, max $1,000)
3. Choose "Agree" or "Disagree"
4. Confirm transaction
5. Wait 24 hours for resolution

## Production Deployment

### Backend Deployment (Vercel / Railway / Heroku)

1. Push code to GitHub
2. Connect to deployment platform
3. Set environment variables
4. Deploy

Example for Railway:
```bash
railway login
railway init
railway up
```

### Frontend Deployment (Vercel)

```bash
cd frontend
npm run build
vercel deploy
```

### Database (Supabase / Railway / Neon)

1. Create PostgreSQL database
2. Run migrations
3. Update connection string in backend/.env

## Verification Checklist

- [ ] PostgreSQL database running
- [ ] Database schema created
- [ ] Smart contract deployed
- [ ] Contract address configured in .env files
- [ ] Backend API running
- [ ] Frontend running
- [ ] MetaMask connected
- [ ] Test tokens received
- [ ] Can create markets
- [ ] Can place stakes
- [ ] Markets resolve correctly
- [ ] Payouts work

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Test connection
psql -U postgres -d opinion_market
```

### Contract Deployment Fails
- Check you have MATIC for gas
- Verify RPC URL is correct
- Ensure private key is set in .env
- Try Mumbai testnet first

### Frontend Won't Connect to Backend
- Verify NEXT_PUBLIC_API_URL in frontend/.env.local
- Check backend is running on correct port
- Check CORS settings in backend

### Transactions Failing
- Ensure wallet is connected
- Check token approvals
- Verify sufficient balance
- Try testnet first

## Support

For issues or questions:
1. Check logs in terminal
2. Review browser console
3. Check MetaMask transaction errors
4. Verify all .env files are configured

## Next Steps

- Add more comprehensive error handling
- Implement UI improvements
- Add more testing
- Set up monitoring/logging
- Configure CI/CD pipeline

