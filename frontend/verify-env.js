#!/usr/bin/env node
/**
 * Frontend Environment Variables Verification Script
 * 
 * This script checks that all required environment variables are set
 * Run: node verify-env.js
 */

// Note: Next.js loads .env.local automatically, but we need to check it manually
const fs = require('fs');
const path = require('path');

// Try to load .env.local
const envPath = path.join(__dirname, '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
} else {
  console.log('⚠️  .env.local file not found!\n');
}

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anon/public key',
};

const optionalVars = {
  'NEXT_PUBLIC_API_URL': 'Backend API URL (defaults to http://localhost:5000/api)',
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID': 'WalletConnect project ID (optional)',
};

console.log('🔍 Checking frontend environment variables...\n');

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
for (const [varName, description] of Object.entries(requiredVars)) {
  // Check both env file and process.env (for Next.js)
  const value = envVars[varName] || process.env[varName];
  if (value) {
    const displayValue = varName.includes('KEY') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: MISSING - ${description}`);
    hasErrors = true;
  }
}

// Check optional variables
console.log('\n📝 Optional Variables:');
for (const [varName, description] of Object.entries(optionalVars)) {
  const value = envVars[varName] || process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (${description})`);
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ ERRORS FOUND: Some required variables are missing!');
  console.log('\nPlease set the missing variables in your .env.local file.');
  console.log('See ENV_SETUP_GUIDE.md for instructions.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
  console.log('Your frontend is ready to start.');
  process.exit(0);
}

