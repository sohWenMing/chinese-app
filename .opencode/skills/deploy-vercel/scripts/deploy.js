#!/usr/bin/env node

/**
 * Vercel Deployment Script
 * Handles the complete deployment workflow for the Chinese Writing App
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function checkVercelCLI() {
  log('\n📦 Checking Vercel CLI...', 'blue');
  const result = runCommand('which vercel', { silent: true });
  
  if (!result.success) {
    log('Vercel CLI not found. Installing...', 'yellow');
    const install = runCommand('npm install -g vercel');
    if (!install.success) {
      log('❌ Failed to install Vercel CLI', 'red');
      process.exit(1);
    }
    log('✅ Vercel CLI installed', 'green');
  } else {
    log('✅ Vercel CLI is installed', 'green');
  }
}

function checkVercelLogin() {
  log('\n🔐 Checking Vercel authentication...', 'blue');
  const result = runCommand('vercel whoami', { silent: true });
  
  if (!result.success) {
    log('\n⚠️  Not logged in to Vercel', 'yellow');
    log('Please run: vercel login', 'yellow');
    log('Then run this deploy command again.', 'yellow');
    process.exit(1);
  }
  
  log(`✅ Logged in as: ${result.output.trim()}`, 'green');
  return result.output.trim();
}

function checkProjectLink() {
  log('\n🔗 Checking project link...', 'blue');
  const vercelDir = path.join(process.cwd(), '.vercel');
  
  if (!fs.existsSync(vercelDir)) {
    log('Project not linked to Vercel. Linking now...', 'yellow');
    const link = runCommand('vercel link --yes');
    if (!link.success) {
      log('❌ Failed to link project', 'red');
      process.exit(1);
    }
    log('✅ Project linked to Vercel', 'green');
  } else {
    log('✅ Project is already linked', 'green');
  }
}

function deploy() {
  log('\n🚀 Deploying to production...', 'blue');
  log('This may take a minute...\n', 'yellow');
  
  const deploy = runCommand('vercel --prod');
  if (!deploy.success) {
    log('❌ Deployment failed', 'red');
    process.exit(1);
  }
  
  log('\n✅ Deployment successful!', 'green');
}

function main() {
  log('\n🎯 Starting Vercel Deployment', 'green');
  log('============================', 'green');
  
  // Check prerequisites
  checkVercelCLI();
  checkVercelLogin();
  checkProjectLink();
  
  // Deploy
  deploy();
  
  log('\n🎉 Deployment complete!', 'green');
  log('\nYour app is now live! Check the URL above ☝️', 'blue');
}

main();
