#!/usr/bin/env node

/**
 * Vercel Deployment Script
 * Handles the complete deployment workflow for the Chinese Writing App
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

let vercelToken = null;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const match = line.match(/^VERCEL_TOKEN=(.+)$/);
      if (match) {
        vercelToken = match[1].trim();
        break;
      }
    }
  }
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

function checkVercelAuth() {
  loadEnv();
  
  if (vercelToken && vercelToken !== 'your_vercel_token_here') {
    log('\n🔐 Using Vercel token from .env', 'blue');
    log('✅ Token configured', 'green');
    return true;
  }
  
  log('\n🔐 Checking Vercel authentication...', 'blue');
  const result = runCommand('vercel whoami', { silent: true });
  
  if (!result.success) {
    log('\n⚠️  Not authenticated with Vercel', 'yellow');
    log('', 'yellow');
    log('To enable deployment, either:', 'yellow');
    log('1. Run: vercel login (requires browser)', 'yellow');
    log('2. Add VERCEL_TOKEN to .env file', 'yellow');
    log('   See .env.example for instructions', 'yellow');
    process.exit(1);
  }
  
  log(`✅ Logged in as: ${result.output.trim()}`, 'green');
  return false;
}

function checkProjectLink() {
  log('\n🔗 Checking project link...', 'blue');
  const vercelDir = path.join(process.cwd(), '.vercel');
  
  if (!fs.existsSync(vercelDir)) {
    if (vercelToken) {
      log('Project not linked. Linking with token...', 'yellow');
      const link = runCommand(`vercel link --yes --token ${vercelToken}`);
      if (!link.success) {
        log('❌ Failed to link project', 'red');
        process.exit(1);
      }
    } else {
      log('Project not linked to Vercel. Linking now...', 'yellow');
      const link = runCommand('vercel link --yes');
      if (!link.success) {
        log('❌ Failed to link project', 'red');
        process.exit(1);
      }
    }
    log('✅ Project linked to Vercel', 'green');
  } else {
    log('✅ Project is already linked', 'green');
  }
}

function deploy() {
  log('\n🚀 Deploying to production...', 'blue');
  log('This may take a minute...\n', 'yellow');
  
  let deploy;
  if (vercelToken && vercelToken !== 'your_vercel_token_here') {
    deploy = runCommand(`vercel --prod --token ${vercelToken} --yes`);
  } else {
    deploy = runCommand('vercel --prod');
  }
  
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
  checkVercelAuth();
  checkProjectLink();
  
  // Deploy
  deploy();
  
  log('\n🎉 Deployment complete!', 'green');
  log('\nYour app is now live! Check the URL above ☝️', 'blue');
  log('\n📱 iPad URL: https://chinese-9kpf4ek2l-wenmingsoh-9763s-projects.vercel.app', 'blue');
}

main();
