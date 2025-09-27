#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function logHeader(message) {
  log('\n' + '='.repeat(50), 'blue');
  log(message, 'blue');
  log('='.repeat(50), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    logError(`Node.js version ${nodeVersion} is too old`);
    logInfo('Please upgrade to Node.js 18+ from https://nodejs.org/');
    process.exit(1);
  }
  
  logSuccess(`Node.js ${nodeVersion} is installed`);
}

// Check if npm is available
function checkNpm() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm ${npmVersion} is installed`);
  } catch (error) {
    logError('npm is not installed');
    process.exit(1);
  }
}

// Install dependencies
function installDependencies() {
  logHeader('Installing Dependencies');
  
  try {
    logInfo('Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    logInfo('Installing backend dependencies...');
    execSync('cd backend && npm install', { stdio: 'inherit', shell: true });
    
    logInfo('Installing frontend dependencies...');
    execSync('cd frontend && npm install', { stdio: 'inherit', shell: true });
    
    logSuccess('All dependencies installed');
  } catch (error) {
    logError('Failed to install dependencies');
    logError(error.message);
    process.exit(1);
  }
}

// Create necessary directories
function createDirectories() {
  logHeader('Creating Directories');
  
  const dirs = [
    'backend/database',
    'backend/logs',
    'scripts'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logSuccess(`Created directory: ${dir}`);
    } else {
      logInfo(`Directory already exists: ${dir}`);
    }
  });
}

// Setup environment files
function setupEnvFiles() {
  logHeader('Setting up Environment Files');
  
  // Backend .env
  if (!fs.existsSync('backend/.env')) {
    if (fs.existsSync('backend/.env.example')) {
      fs.copyFileSync('backend/.env.example', 'backend/.env');
      logSuccess('Created backend/.env from example');
    } else {
      // Create basic .env file
      const envContent = `# OpenWeather API Key
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5000

# Database
DB_PATH=./database/air_quality.db
`;
      fs.writeFileSync('backend/.env', envContent);
      logSuccess('Created backend/.env');
    }
    logWarning('Please add your OpenWeather API key to backend/.env');
  } else {
    logInfo('backend/.env already exists');
  }
  
  // Frontend .env.local
  if (!fs.existsSync('frontend/.env.local')) {
    if (fs.existsSync('frontend/.env.example')) {
      fs.copyFileSync('frontend/.env.example', 'frontend/.env.local');
      logSuccess('Created frontend/.env.local from example');
    } else {
      // Create basic .env.local file
      const envContent = `# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# App Configuration
NEXT_PUBLIC_APP_NAME=AirSense
NEXT_PUBLIC_APP_VERSION=1.0.0
`;
      fs.writeFileSync('frontend/.env.local', envContent);
      logSuccess('Created frontend/.env.local');
    }
  } else {
    logInfo('frontend/.env.local already exists');
  }
}

// Check API key configuration
function checkApiKey() {
  logHeader('Checking API Configuration');
  
  try {
    const envContent = fs.readFileSync('backend/.env', 'utf8');
    if (envContent.includes('your_openweather_api_key_here')) {
      logWarning('OpenWeather API key not configured');
      logInfo('Please:');
      logInfo('1. Visit https://openweathermap.org/api');
      logInfo('2. Sign up for a free account');
      logInfo('3. Get your API key');
      logInfo('4. Replace "your_openweather_api_key_here" in backend/.env');
      return false;
    } else {
      logSuccess('API key appears to be configured');
      return true;
    }
  } catch (error) {
    logWarning('Could not read backend/.env file');
    return false;
  }
}

// Main setup function
function main() {
  logHeader('AirSense Setup Script');
  logInfo('This script will set up the AirSense application');
  
  checkNodeVersion();
  checkNpm();
  createDirectories();
  installDependencies();
  setupEnvFiles();
  
  const apiConfigured = checkApiKey();
  
  if (apiConfigured) {
    logHeader('Setup Complete!');
    logSuccess('AirSense is ready to run');
    logInfo('Run "npm run dev" to start the application');
  } else {
    logHeader('Setup Almost Complete!');
    logWarning('Please configure your OpenWeather API key');
    logInfo('Then run "npm run dev" to start the application');
  }
  
  logInfo('');
  logInfo('Next steps:');
  logInfo('1. Configure OpenWeather API key in backend/.env (if not done)');
  logInfo('2. Run: npm run dev');
  logInfo('3. Open: http://localhost:5000');
  logInfo('');
  logInfo('For help, see README.md or create an issue on GitHub');
}

// Run the setup
main();