#!/usr/bin/env node

/**
 * Generate Wallet Script for Docker Testing
 *
 * This script generates a random Ethereum wallet for testnet use and stores
 * the encrypted private key in cfr.json using KeyUtils.
 *
 * Usage: node generate-wallet.js
 */

import { ethers } from 'ethers';
import { setKey } from './src/config/keyutils.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Get configuration from environment
const MASTER_KEY_PASSWORD = process.env.MASTER_KEY_PASSWORD || 'docker-test-password';
const MASTER_KEY_ID = process.env.MASTER_KEY_ID || 'rhizome.docker.testnet';
const PRIVATE_KEY = process.env.PRIVATE_KEY || null;

// Determine cfr.json path
const getCfrPath = () => {
  if (process.env.CFR_FILE_PATH) {
    return path.resolve(process.env.CFR_FILE_PATH);
  }
  const homeDir = os.homedir();
  return path.join(homeDir, '.rhizome', 'cfr.json');
};

const cfrPath = getCfrPath();

console.log('========================================');
console.log('🔑 WALLET SETUP FOR DOCKER');
console.log('========================================');

let wallet;
let privateKey;

// Check if user provided a private key via environment
if (PRIVATE_KEY) {
  console.log('📥 Using provided private key from PRIVATE_KEY env var...');
  try {
    wallet = new ethers.Wallet(PRIVATE_KEY);
    privateKey = PRIVATE_KEY;
    console.log('✅ Private key validated');
  } catch (error) {
    console.error('❌ Invalid private key provided:', error.message);
    process.exit(1);
  }
} else {
  console.log('🎲 Generating random wallet for testnet...');
  wallet = ethers.Wallet.createRandom();
  privateKey = wallet.privateKey;
  console.log('✅ Random wallet generated');
}

const address = wallet.address;

// Encrypt and store the private key
try {
  console.log(`💾 Encrypting and storing private key to: ${cfrPath}`);

  // Ensure directory exists
  const dir = path.dirname(cfrPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Encrypt and save
  setKey(MASTER_KEY_PASSWORD, privateKey, MASTER_KEY_ID);

  console.log('✅ Private key encrypted and saved');
} catch (error) {
  console.error('❌ Failed to encrypt/save private key:', error.message);
  process.exit(1);
}

// Display wallet information
console.log('========================================');
console.log('💰 WALLET READY FOR FUNDING');
console.log('========================================');
console.log('Address: ', address);
console.log('========================================');
console.log('📡 Fund this address on Optimism Sepolia:');
console.log('   https://app.optimism.io/faucet');
console.log('========================================');
