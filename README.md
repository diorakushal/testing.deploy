# Opinion Market Platform - MVP

A social opinion market platform where users create debates, stake cryptocurrency with blind voting, and monetize their opinions.

## Features

- **Blind Voting**: Users cannot see how others voted during the 24-hour market period
- **Crypto Staking**: Stake USDC or USDT on opinions
- **Auto-Resolution**: Markets automatically resolve after 24 hours
- **Winner Takes All**: Winners split the losing side's pool (minus 5% rake)
- **Trending Markets**: Discover popular opinion markets
- **Market Creation**: Create your own opinion markets
- **Wallet Integration**: MetaMask support for seamless transactions

## Tech Stack

### Frontend
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- Ethers.js (Web3)
- React Hook Form

### Backend
- Node.js / Express
- PostgreSQL
- Ethers.js (Blockchain integration)
- Node-Cron (Auto-resolution)

### Smart Contracts
- Solidity 0.8.20
- Hardhat
- OpenZeppelin Contracts
- Polygon Network

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- MetaMask extension
- Polygon network access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd opinion-market-platform
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up PostgreSQL database**
   ```bash
   cd backend
   createdb opinion_market
   psql opinion_market < database/schema.sql
   ```

4. **Configure environment variables**

   Backend (`backend/.env`):
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=opinion_market
   DB_PASSWORD=postgres
   DB_PORT=5432
   
   POLYGON_RPC_URL=https://polygon-rpc.com
   MARKET_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
   ```

   Frontend (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
   ```

5. **Deploy smart contract**
   ```bash
   cd contracts
   npm install
   npm run compile
   npm run deploy
   ```
   
   Update `.env` files with the deployed contract address.

### Running the Application

1. **Start the backend**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
.
├── frontend/          # Next.js frontend application
│   ├── app/          # App router pages
│   ├── components/   # React components
│   └── contracts/    # Contract deployment info
├── backend/          # Express API server
│   ├── database/     # Database schema
│   ├── contracts/    # Contract ABI
│   └── server.js     # Main server file
├── contracts/        # Smart contracts
│   ├── contracts/    # Solidity files
│   └── scripts/      # Deployment scripts
└── README.md         # This file
```

## Usage

### Creating a Market

1. Connect your MetaMask wallet
2. Click "Create Market"
3. Enter your opinion statement (e.g., "Drake > Kendrick")
4. Select category and token type
5. Submit transaction

### Placing a Stake

1. Navigate to a market
2. Enter stake amount ($1-$1,000)
3. Click "Agree" or "Disagree"
4. Confirm transaction in MetaMask
5. Wait 24 hours for resolution

### Claiming Winnings

1. After market resolution, navigate to your profile
2. If you won, claim your payout
3. Winnings are automatically calculated (original stake + proportional winnings)

## Smart Contract Details

- **Network**: Polygon (gas-efficient)
- **Tokens**: USDC & USDT
- **Rake**: 5% from winning pool
- **Duration**: 24 hours per market
- **Resolution**: Automatic via cron job

## API Endpoints

- `GET /api/markets` - Get markets feed
- `GET /api/markets/:id` - Get market details
- `POST /api/markets` - Create new market
- `POST /api/stakes` - Record stake
- `GET /api/users/:address` - Get user profile
- `POST /api/users` - Create/update user

## Development

### Running Tests
```bash
cd contracts
npm test
```

### Database Migrations
```bash
cd backend
npm run migrate
```

### Building for Production
```bash
cd frontend
npm run build
```

## Security Considerations

- All transactions are on-chain and immutable
- Rake percentage is transparent (5%)
- No KYC required for MVP
- Stablecoins only (USDC/USDT) to minimize volatility
- Smart contract uses OpenZeppelin security standards

## Roadmap

- [ ] User profiles with avatars
- [ ] Creator monetization (Phase 2)
- [ ] Social features (comments, shares)
- [ ] Mobile app
- [ ] Additional token support
- [ ] KYC integration (optional)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

