#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

// Check if .env.local exists and load environment variables
function loadEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    logError('.env.local file not found!');
    process.exit(1);
  }
  
  // Load environment variables
  require('dotenv').config({ path: envPath });
  
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL not found in .env.local!');
    process.exit(1);
  }
  
  logSuccess('Environment configuration loaded');
  return true;
}

// Fix DATABASE_URL for SSL issues
function fixDatabaseUrl() {
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    logError('DATABASE_URL is not set');
    return null;
  }
  
  // Check if it's a Supabase URL
  if (dbUrl.includes('supabase.co')) {
    logInfo('Detected Supabase database, adding SSL parameters...');
    
    // Add SSL parameters to the connection string
    if (!dbUrl.includes('sslmode=')) {
      const separator = dbUrl.includes('?') ? '&' : '?';
      dbUrl += `${separator}sslmode=require&sslcert=&sslkey=&sslrootcert=`;
    }
    
    logInfo('Updated DATABASE_URL with SSL parameters');
  }
  
  return dbUrl;
}

// Run migration with fixed environment
function runMigration() {
  try {
    logInfo('Starting database migration...');
    
    // Set the fixed DATABASE_URL
    const fixedDbUrl = fixDatabaseUrl();
    if (!fixedDbUrl) {
      logError('Failed to fix DATABASE_URL');
      return false;
    }
    
    // Temporarily set the environment variable
    process.env.DATABASE_URL = fixedDbUrl;
    
    logInfo('Running drizzle-kit migrate...');
    
    // Run the migration
    const result = execSync('npx drizzle-kit migrate', { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: fixedDbUrl
      }
    });
    
    logSuccess('Migration completed successfully!');
    return true;
    
  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  log(`${colors.bright}SSL-Aware Database Migration${colors.reset}\n`);
  
  try {
    // Load environment
    if (!loadEnvironment()) {
      process.exit(1);
    }
    
    // Run migration
    if (!runMigration()) {
      process.exit(1);
    }
    
    logSuccess('All done! Your database is now migrated.');
    
  } catch (error) {
    logError(`Script execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  loadEnvironment,
  fixDatabaseUrl,
  runMigration
};
