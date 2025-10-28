#!/bin/bash

echo "🚀 Setting up Opinion Market Platform..."

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all || {
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    echo "Installing contract dependencies..."
    cd contracts && npm install && cd ..
}

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Create database
echo "🗄️  Creating database..."
createdb opinion_market 2>/dev/null || echo "Database already exists"

# Run migrations
echo "📊 Setting up database schema..."
cd backend
psql opinion_market < database/schema.sql
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure environment variables in backend/.env and frontend/.env.local"
echo "2. Deploy smart contract: cd contracts && npm run deploy"
echo "3. Update contract addresses in .env files"
echo "4. Start backend: cd backend && npm start"
echo "5. Start frontend: cd frontend && npm run dev"

