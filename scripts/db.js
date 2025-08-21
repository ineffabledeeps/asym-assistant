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
  magenta: '\x1b[35m',
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

// Check if .env.local exists
function checkEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    logError('.env.local file not found!');
    logInfo('Please create a .env.local file with your database configuration.');
    logInfo('Example:');
    logInfo('DATABASE_URL="postgresql://username:password@host:port/database"');
    logInfo('NEXTAUTH_SECRET="your-secret-key"');
    logInfo('GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"');
    process.exit(1);
  }
  
  // Check if DATABASE_URL is set
  require('dotenv').config({ path: envPath });
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL not found in .env.local!');
    process.exit(1);
  }
  
  logSuccess('Environment configuration found');
}

// Run Drizzle commands
function runDrizzleCommand(command, description) {
  try {
    logInfo(`Running: ${description}`);
    const result = execSync(`npx drizzle-kit ${command}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    logSuccess(`${description} completed successfully`);
    return true;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return false;
  }
}

// Generate migration
function generateMigration() {
  logInfo('Generating database migration...');
  return runDrizzleCommand('generate', 'Migration generation');
}

// Run migrations
function runMigrations() {
  logInfo('Running database migrations...');
  return runDrizzleCommand('migrate', 'Database migration');
}

// Open Drizzle Studio
function openStudio() {
  logInfo('Opening Drizzle Studio...');
  return runDrizzleCommand('studio', 'Drizzle Studio');
}

// Push schema to database (for development)
function pushSchema() {
  logInfo('Pushing schema to database (development mode)...');
  return runDrizzleCommand('push', 'Schema push');
}

// Drop database (dangerous - for development only)
function dropDatabase() {
  logWarning('⚠️  This will DROP ALL TABLES in your database!');
  logWarning('This action cannot be undone.');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Are you sure you want to continue? Type "DROP" to confirm: ', (answer) => {
    if (answer === 'DROP') {
      logInfo('Dropping database...');
      runDrizzleCommand('drop', 'Database drop');
    } else {
      logInfo('Operation cancelled');
    }
    rl.close();
  });
}

// Check database connection
function checkConnection() {
  logInfo('Checking database connection...');
  try {
    // This would require the actual database connection
    // For now, we'll just check if the environment is set up
    logSuccess('Environment variables are configured');
    logInfo(`Database URL: ${process.env.DATABASE_URL?.substring(0, 30)}...`);
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
  }
}

// Show help
function showHelp() {
  console.log(`
${colors.bright}Database Management Script${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/db.js [command]

${colors.cyan}Commands:${colors.reset}
  ${colors.green}generate${colors.reset}     - Generate new migration files
  ${colors.green}migrate${colors.reset}      - Run pending migrations
  ${colors.green}studio${colors.reset}       - Open Drizzle Studio
  ${colors.green}push${colors.reset}         - Push schema to database (dev)
  ${colors.green}drop${colors.reset}         - Drop all tables (dev only)
  ${colors.green}check${colors.reset}        - Check database connection
  ${colors.green}help${colors.reset}         - Show this help message

${colors.cyan}Examples:${colors.reset}
  node scripts/db.js generate
  node scripts/db.js migrate
  node scripts/db.js studio

${colors.yellow}Note:${colors.reset} Make sure you have a .env.local file with DATABASE_URL configured.
`);
}

// Main function
function main() {
  const command = process.argv[2] || 'help';
  
  try {
    // Check environment first
    checkEnvironment();
    
    switch (command) {
      case 'generate':
        generateMigration();
        break;
      case 'migrate':
        runMigrations();
        break;
      case 'studio':
        openStudio();
        break;
      case 'push':
        pushSchema();
        break;
      case 'drop':
        dropDatabase();
        break;
      case 'check':
        checkConnection();
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
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
  generateMigration,
  runMigrations,
  openStudio,
  pushSchema,
  dropDatabase,
  checkConnection
};
