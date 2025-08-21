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

// Load environment variables
function loadEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    logError('.env.local file not found!');
    process.exit(1);
  }
  
  require('dotenv').config({ path: envPath });
  
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL not found in .env.local!');
    process.exit(1);
  }
  
  logSuccess('Environment configuration loaded');
  return true;
}

// Create a custom drizzle config for migrations
function createMigrationConfig() {
  const configPath = path.join(process.cwd(), 'drizzle.migrate.config.ts');
  
  const configContent = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
`;
  
  try {
    fs.writeFileSync(configPath, configContent);
    logSuccess('Created temporary migration config');
    return configPath;
  } catch (error) {
    logError(`Failed to create migration config: ${error.message}`);
    return null;
  }
}

// Clean up temporary config
function cleanupConfig(configPath) {
  try {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      logInfo('Cleaned up temporary migration config');
    }
  } catch (error) {
    logWarning(`Failed to cleanup config: ${error.message}`);
  }
}

// Run migration with custom config
function runMigration(configPath) {
  try {
    logInfo('Starting database migration with custom config...');
    
    // Set environment variable to disable SSL verification for migrations
    const env = {
      ...process.env,
      NODE_TLS_REJECT_UNAUTHORIZED: '0'
    };
    
    logInfo('Running drizzle-kit migrate with NODE_TLS_REJECT_UNAUTHORIZED=0...');
    
    const result = execSync(`npx drizzle-kit migrate --config ${configPath}`, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: env
    });
    
    logSuccess('Migration completed successfully!');
    return true;
    
  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    return false;
  }
}

// Alternative: Try to run SQL directly
function runSqlDirectly() {
  try {
    logInfo('Attempting to run migration SQL directly...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_narrow_inhumans.sql');
    if (!fs.existsSync(migrationPath)) {
      logError('Migration file not found');
      return false;
    }
    
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    logInfo('Migration SQL content loaded');
    
    // For now, just show what we would run
    logInfo('Migration SQL to run:');
    console.log(sqlContent);
    
    logWarning('Direct SQL execution not implemented yet');
    logInfo('You can manually run this SQL in your database client');
    
    return false;
    
  } catch (error) {
    logError(`Failed to read migration: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  log(`${colors.bright}Custom Database Migration${colors.reset}\n`);
  
  try {
    // Load environment
    if (!loadEnvironment()) {
      process.exit(1);
    }
    
    // Try custom config approach first
    const configPath = createMigrationConfig();
    if (configPath) {
      if (runMigration(configPath)) {
        cleanupConfig(configPath);
        logSuccess('Migration completed successfully!');
        return;
      }
      cleanupConfig(configPath);
    }
    
    // Fallback to direct SQL approach
    logInfo('Trying alternative approach...');
    if (runSqlDirectly()) {
      logSuccess('Migration completed successfully!');
      return;
    }
    
    logError('All migration approaches failed');
    logInfo('Please check your database connection and SSL settings');
    logInfo('You may need to run the migration manually in your database client');
    
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
  createMigrationConfig,
  runMigration,
  runSqlDirectly
};
