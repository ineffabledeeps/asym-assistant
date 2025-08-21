#!/usr/bin/env tsx

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message: string): void {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function logSuccess(message: string): void {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logInfo(message: string): void {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logWarning(message: string): void {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

// Check if .env.local exists
function checkEnvironment(): void {
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
  
  // Load environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars: Record<string, string> = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      envVars[key.trim()] = value.trim();
    }
  });
  
  if (!envVars.DATABASE_URL) {
    logError('DATABASE_URL not found in .env.local!');
    process.exit(1);
  }
  
  // Set environment variables
  Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  logSuccess('Environment configuration found');
}

// Run Drizzle commands
function runDrizzleCommand(command: string, description: string): boolean {
  try {
    logInfo(`Running: ${description}`);
    execSync(`npx drizzle-kit ${command}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    logSuccess(`${description} completed successfully`);
    return true;
  } catch (error) {
    logError(`${description} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

// Generate migration
function generateMigration(): boolean {
  logInfo('Generating database migration...');
  return runDrizzleCommand('generate', 'Migration generation');
}

// Run migrations
function runMigrations(): boolean {
  logInfo('Running database migrations...');
  return runDrizzleCommand('migrate', 'Database migration');
}

// Open Drizzle Studio
function openStudio(): boolean {
  logInfo('Opening Drizzle Studio...');
  return runDrizzleCommand('studio', 'Drizzle Studio');
}

// Push schema to database (for development)
function pushSchema(): boolean {
  logInfo('Pushing schema to database (development mode)...');
  return runDrizzleCommand('push', 'Schema push');
}

// Drop database (dangerous - for development only)
function dropDatabase(): void {
  logWarning('⚠️  This will DROP ALL TABLES in your database!');
  logWarning('This action cannot be undone.');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Are you sure you want to continue? Type "DROP" to confirm: ', (answer: string) => {
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
function checkConnection(): void {
  logInfo('Checking database connection...');
  try {
    logSuccess('Environment variables are configured');
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      logInfo(`Database URL: ${dbUrl.substring(0, 30)}...`);
    }
  } catch (error) {
    logError(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Show help
function showHelp(): void {
  console.log(`
${colors.bright}Database Management Script${colors.reset}

${colors.cyan}Usage:${colors.reset}
  npx tsx scripts/db.ts [command]

${colors.cyan}Commands:${colors.reset}
  ${colors.green}generate${colors.reset}     - Generate new migration files
  ${colors.green}migrate${colors.reset}      - Run pending migrations
  ${colors.green}studio${colors.reset}       - Open Drizzle Studio
  ${colors.green}push${colors.reset}         - Push schema to database (dev)
  ${colors.green}drop${colors.reset}         - Drop all tables (dev only)
  ${colors.green}check${colors.reset}        - Check database connection
  ${colors.green}help${colors.reset}         - Show this help message

${colors.cyan}Examples:${colors.reset}
  npx tsx scripts/db.ts generate
  npx tsx scripts/db.ts migrate
  npx tsx scripts/db.ts studio

${colors.yellow}Note:${colors.reset} Make sure you have a .env.local file with DATABASE_URL configured.
`);
}

// Main function
function main(): void {
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
    logError(`Script execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  generateMigration,
  runMigrations,
  openStudio,
  pushSchema,
  dropDatabase,
  checkConnection
};
