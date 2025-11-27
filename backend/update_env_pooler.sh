#!/bin/bash
# Update .env file with Supabase connection pooler (more reliable)

cat > .env << 'ENVFILE'
# Supabase Database Configuration
# Using Connection Pooler (recommended for server applications)
DATABASE_URL=postgresql://postgres.robjixmkmrmryrqzivdd:Kushal%4013@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Individual parameters (Connection Pooler)
DB_USER=postgres.robjixmkmrmryrqzivdd
DB_PASSWORD=Kushal@13
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres

# Alternative: Direct connection (if pooler doesn't work)
# DB_HOST=db.robjixmkmrmryrqzivdd.supabase.co
# DB_PORT=5432
# DB_USER=postgres

# Supabase API Configuration
SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw

# Server Configuration
PORT=5000

# Blockchain Configuration
POLYGON_RPC_URL=https://polygon-rpc.com
MARKET_CONTRACT_ADDRESS=
ENVFILE

echo "✅ .env file updated with Supabase Connection Pooler"
echo ""
echo "⚠️  IMPORTANT: Get the correct connection string from Supabase Dashboard:"
echo "   1. Go to: https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd"
echo "   2. Settings → Database → Connection string"
echo "   3. Copy the 'Connection pooling' URI"
echo "   4. Update DATABASE_URL in .env if different"
