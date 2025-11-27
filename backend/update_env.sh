#!/bin/bash
# Update .env file with Supabase credentials

cat > .env << 'ENVFILE'
# Supabase Database Configuration
# Direct PostgreSQL connection
DATABASE_URL=postgresql://postgres:Kushal%4013@db.robjixmkmrmryrqzivdd.supabase.co:5432/postgres

# Individual parameters
DB_USER=postgres
DB_PASSWORD=Kushal@13
DB_HOST=db.robjixmkmrmryrqzivdd.supabase.co
DB_PORT=5432
DB_NAME=postgres

# Supabase API Configuration
SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw

# Server Configuration
PORT=5000

# Blockchain Configuration
POLYGON_RPC_URL=https://polygon-rpc.com
MARKET_CONTRACT_ADDRESS=
ENVFILE

echo "✅ .env file updated with Supabase credentials"
