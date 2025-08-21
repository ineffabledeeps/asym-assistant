#!/usr/bin/env node

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

// Check environment files
function checkEnvironmentFiles() {
  const projectRoot = process.cwd();
  
  logInfo('Checking environment files...');
  
  // Check for .env.local
  const envLocalPath = path.join(projectRoot, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    logSuccess('.env.local found');
    
    // Read and parse .env.local
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    // Check for required variables
    logInfo('Environment variables found:');
    Object.entries(envVars).forEach(([key, value]) => {
      if (key === 'DATABASE_URL') {
        logSuccess(`${key}: ${value.substring(0, 30)}...`);
      } else if (key.includes('SECRET') || key.includes('KEY')) {
        logInfo(`${key}: ${value.substring(0, 10)}...`);
      } else {
        logInfo(`${key}: ${value}`);
      }
    });
    
    // Check for missing required variables
    const requiredVars = ['DATABASE_URL'];
    const missingVars = requiredVars.filter(varName => !envVars[varName]);
    
    if (missingVars.length > 0) {
      logError(`Missing required environment variables: ${missingVars.join(', ')}`);
      return false;
    }
    
    return true;
  } else {
    logError('.env.local not found');
    logInfo('Please create a .env.local file with your database configuration');
    return false;
  }
}

// Check if dotenv is working
function checkDotenv() {
  logInfo('Checking dotenv functionality...');
  
  try {
    // Try to load .env.local using dotenv
    require('dotenv').config({ path: '.env.local' });
    
    if (process.env.DATABASE_URL) {
      logSuccess('dotenv loaded DATABASE_URL successfully');
      logInfo(`Value: ${process.env.DATABASE_URL.substring(0, 30)}...`);
      return true;
    } else {
      logError('dotenv did not load DATABASE_URL');
      return false;
    }
  } catch (error) {
    logError(`dotenv error: ${error.message}`);
    return false;
  }
}

// Check current process.env
function checkProcessEnv() {
  logInfo('Checking current process.env...');
  
  if (process.env.DATABASE_URL) {
    logSuccess('DATABASE_URL found in process.env');
    logInfo(`Value: ${process.env.DATABASE_URL.substring(0, 30)}...`);
    return true;
  } else {
    logWarning('DATABASE_URL not found in process.env');
    return false;
  }
}

// Main function
function main() {
  log(`${colors.bright}Environment Checker${colors.reset}\n`);
  
  const envFilesOk = checkEnvironmentFiles();
  console.log('');
  
  const dotenvOk = checkDotenv();
  console.log('');
  
  const processEnvOk = checkProcessEnv();
  console.log('');
  
  // Summary
  if (envFilesOk && dotenvOk && processEnvOk) {
    logSuccess('All environment checks passed!');
    logInfo('You should be able to run database operations now.');
  } else {
    logError('Some environment checks failed.');
    logInfo('Please fix the issues above before running database operations.');
  }
  
  console.log('');
  logInfo('To run database operations, use:');
  logInfo('  npm run db:check    - Check database connection');
  logInfo('  npm run db:migrate  - Run migrations');
  logInfo('  npm run db:generate - Generate migrations');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentFiles,
  checkDotenv,
  checkProcessEnv
};
