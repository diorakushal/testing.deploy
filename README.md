# Blockbook - Crypto Payment Platform

A non-custodial cryptocurrency payment platform that enables seamless wallet-to-wallet transactions. Create payment requests, send direct payments, and manage your crypto payments across multiple blockchain networks.

## Features

- **Payment Requests**: Create payment requests (like Venmo notes) that anyone can accept and pay
- **Direct Payments**: Send payments directly to other users wallet-to-wallet
- **Multi-Chain Support**: Works across Base, Ethereum, Polygon, BNB Chain, Arbitrum, and Optimism
- **Contact Management**: Add contacts with nicknames for easy payment sending
- **Preferred Wallets**: Set preferred receiving wallets for each chain
- **Non-Custodial**: All transactions are wallet-to-wallet, no funds held by platform
- **Auto Chain-Switch**: Seamless cross-network experience with automatic chain switching

## Tech Stack

### Frontend
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- Wagmi + RainbowKit (Web3 wallet connections)
- Ethers.js (Blockchain interactions)
- Supabase (Authentication)

### Backend
- Node.js / Express
- PostgreSQL (Supabase)
- Ethers.js (Blockchain integration)
- Supabase Auth (Email OTP authentication)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (for database and auth)
- MetaMask or compatible wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blockbook
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up Supabase**
   - Create a Supabase project
   - Run the database schema from `COMPLETE_SUPABASE_SCHEMA.sql`
   - Get your Supabase URL and anon key

4. **Configure environment variables**

   Backend (`backend/.env`):
   ```env
   DATABASE_URL=your_supabase_connection_string
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   Frontend (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

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
│   └── lib/          # Utilities (wagmi, supabase, auth)
├── backend/          # Express API server
│   ├── database/     # Database schema files
│   ├── lib/          # Supabase client
│   └── server.js     # Main server file
└── README.md         # This file
```

## Usage

### Creating a Payment Request

1. Connect your wallet
2. Navigate to the feed or request page
3. Enter amount and optional caption
4. Request is posted to feed
5. Anyone can click "Accept & Pay" to send payment

### Sending a Direct Payment

1. Navigate to the Pay page
2. Select recipient (from contacts or search)
3. Enter amount and optional caption
4. Confirm transaction in wallet
5. Payment is sent wallet-to-wallet

### Managing Contacts

1. Go to Settings
2. Add contacts by searching for usernames
3. Set nicknames for easy identification
4. Contacts appear in payment flows

## Supported Chains

- **Base** (8453) - Default for payments
- **Ethereum** (1)
- **BNB Chain** (56)
- **Polygon** (137)
- **Arbitrum** (42161)
- **Optimism** (10)

## API Endpoints

### Payment Requests
- `GET /api/payment-requests` - Get all payment requests
- `POST /api/payment-requests` - Create payment request
- `PATCH /api/payment-requests/:id/paid` - Mark request as paid
- `DELETE /api/payment-requests/:id` - Cancel request

### Payment Sends
- `GET /api/payment-sends` - Get payment history
- `POST /api/payment-sends` - Record payment send

### Users
- `GET /api/users/:address` - Get user profile
- `POST /api/users` - Create/update user
- `GET /api/users/search` - Search users

### Contacts
- `GET /api/contacts` - Get user's contacts
- `POST /api/contacts` - Add contact
- `PATCH /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Remove contact

### Preferred Wallets
- `GET /api/preferred-wallets` - Get user's preferred wallets
- `POST /api/preferred-wallets` - Set preferred wallet
- `DELETE /api/preferred-wallets/:id` - Remove preferred wallet

## Security Considerations

- All transactions are on-chain and immutable
- Non-custodial - no funds held by platform
- Email-based authentication with OTP verification
- Wallet-to-wallet transfers only
- Multi-chain support with automatic chain switching

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
