#!/bin/bash
# Final .env setup with all Supabase credentials

cat > .env << 'ENVFILE'
# ==============================================================================
# SUPABASE DATABASE CONFIGURATION
# ==============================================================================
# Get the exact connection string from:
# https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd/settings/database
# Copy from "Connection pooling" → "Transaction" mode
# ==============================================================================

# Connection String (update with exact string from Supabase dashboard)
# Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:[PORT]/postgres
DATABASE_URL=postgresql://postgres.robjixmkmrmryrqzivdd:Kushal%4013@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Individual Parameters (Connection Pooler - Transaction Mode)
DB_USER=postgres.robjixmkmrmryrqzivdd
DB_PASSWORD=Kushal@13
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres

# Alternative: Direct Connection (if pooler doesn't work)
# Uncomment and use these if connection pooler fails:
# DB_HOST=db.robjixmkmrmryrqzivdd.supabase.co
# DB_PORT=5432
# DB_USER=postgres

# ==============================================================================
# SUPABASE API CONFIGURATION
# ==============================================================================
SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw

# ==============================================================================
# SERVER CONFIGURATION
# ==============================================================================
PORT=5000

# ==============================================================================
# BLOCKCHAIN CONFIGURATION
# ==============================================================================
POLYGON_RPC_URL=https://polygon-rpc.com
MARKET_CONTRACT_ADDRESS=
ENVFILE

echo "✅ .env file configured with Supabase credentials"
echo ""
echo "📋 Configuration Summary:"
echo "   Supabase URL: https://robjixmkmrmryrqzivdd.supabase.co"
echo "   API Key: Set"
echo "   Database: Using Connection Pooler (port 6543)"
echo ""
echo "⚠️  IMPORTANT: If connection fails, get exact connection string from:"
echo "   https://supabase.com/dashboard/project/robjixmkmrmryrqzivdd/settings/database"
