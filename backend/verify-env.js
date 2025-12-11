#!/usr/bin/env node
/**
 * Environment Variables Verification Script
 * 
 * This script checks that all required environment variables are set
 * Run: node verify-env.js
 */

require('dotenv').config();

const requiredVars = {
  'SUPABASE_URL': 'Supabase project URL',
  'SUPABASE_ANON_KEY': 'Supabase anon/public key',
};

// Check for database connection - either DATABASE_URL or all DB_* vars
const dbVars = {
  'DATABASE_URL': 'Database connection string (alternative to individual DB vars)',
};

const dbIndividualVars = {
  'DB_USER': 'Database user',
  'DB_HOST': 'Database host',
  'DB_NAME': 'Database name',
  'DB_PASSWORD': 'Database password',
  'DB_PORT': 'Database port (optional, defaults to 5432)',
};

const optionalVars = {
  'PORT': 'Server port (optional, defaults to 5000)',
  'ALLOWED_ORIGINS': 'CORS allowed origins (optional, defaults to localhost:3000)',
  'FRONTEND_URL': 'Frontend URL for CORS (optional)',
};

console.log('🔍 Checking environment variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('📋 Required Variables:');
for (const [varName, description] of Object.entries(requiredVars)) {
  if (process.env[varName]) {
    const value = process.env[varName];
    const displayValue = varName.includes('KEY') || varName.includes('PASSWORD') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: MISSING - ${description}`);
    hasErrors = true;
  }
}

// Check database configuration
console.log('\n📊 Database Configuration:');
const hasDatabaseUrl = !!process.env.DATABASE_URL;

if (hasDatabaseUrl) {
  const dbUrl = process.env.DATABASE_URL;
  const displayUrl = dbUrl.replace(/:[^:@]+@/, ':****@'); // Hide password
  console.log(`  ✅ DATABASE_URL: ${displayUrl}`);
} else {
  console.log('  ⚠️  DATABASE_URL: Not set (will try individual DB vars)');
  hasWarnings = true;
  
  // Check individual DB vars
  let missingDbVars = [];
  for (const [varName, description] of Object.entries(dbIndividualVars)) {
    if (varName === 'DB_PORT') {
      // Port is optional
      if (process.env[varName]) {
        console.log(`  ✅ ${varName}: ${process.env[varName]}`);
      } else {
        console.log(`  ⚠️  ${varName}: Not set (will use default: 5432)`);
      }
    } else {
      if (process.env[varName]) {
        const value = varName === 'DB_PASSWORD' 
          ? '****' 
          : process.env[varName];
        console.log(`  ✅ ${varName}: ${value}`);
      } else {
        console.log(`  ❌ ${varName}: MISSING - ${description}`);
        missingDbVars.push(varName);
        hasErrors = true;
      }
    }
  }
  
  if (missingDbVars.length > 0) {
    console.log(`\n  ⚠️  Missing database variables: ${missingDbVars.join(', ')}`);
    console.log('  💡 Either set DATABASE_URL or set all individual DB_* variables');
  }
}

// Check optional variables
console.log('\n📝 Optional Variables:');
for (const [varName, description] of Object.entries(optionalVars)) {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: ${process.env[varName]}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (${description})`);
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ ERRORS FOUND: Some required variables are missing!');
  console.log('\nPlease set the missing variables in your .env file.');
  console.log('See ENV_SETUP_GUIDE.md for instructions.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS: Some optional variables are not set.');
  console.log('The server should still work, but some features may be limited.');
  process.exit(0);
} else {
  console.log('✅ All required environment variables are set!');
  console.log('Your backend is ready to start.');
  process.exit(0);
}
