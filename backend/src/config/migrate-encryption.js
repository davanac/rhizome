#!/usr/bin/env node

/**
 * Migration Utility for Encrypted Keys
 *
 * This script migrates encrypted data from the old insecure SHA-256 based encryption
 * to the new secure scrypt-based encryption.
 *
 * Usage:
 *   node src/config/migrate-encryption.js
 *
 * Or with specific parameters:
 *   MASTER_KEY_PASSWORD="your-password" MASTER_KEY_ID="your-key-id" node src/config/migrate-encryption.js
 *
 * The script will:
 * 1. Load the cfr.json file containing encrypted keys
 * 2. Decrypt each key using the old SHA-256 method
 * 3. Re-encrypt using the new scrypt method
 * 4. Create a backup of the original file
 * 5. Save the newly encrypted data
 *
 * IMPORTANT: This script requires the correct MASTER_KEY_PASSWORD to decrypt existing keys.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import the new keyutils (which includes both old and new methods)
import { setKey, getKey } from './keyutils.js';

// Configuration
const getJsonPath = () => {
  if (process.env.CFR_FILE_PATH) {
    return path.resolve(process.env.CFR_FILE_PATH);
  }
  const homeDir = os.homedir();
  return path.join(homeDir, '.rhizome', 'cfr.json');
};

const jsonPath = getJsonPath();

// Create readline interface for user prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

/**
 * Creates a backup of the cfr.json file
 */
const createBackup = () => {
  if (!fs.existsSync(jsonPath)) {
    console.log('❌ No cfr.json file found at:', jsonPath);
    return false;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = jsonPath.replace('.json', `.backup-${timestamp}.json`);

  try {
    fs.copyFileSync(jsonPath, backupPath);
    console.log('✅ Backup created:', backupPath);
    return backupPath;
  } catch (error) {
    console.error('❌ Failed to create backup:', error.message);
    return false;
  }
};

/**
 * Detects if a value is using legacy encryption
 */
const isLegacyEncryption = (encryptedValue) => {
  try {
    const data = Buffer.from(encryptedValue, 'base64');
    // Legacy format doesn't have version byte or is too short for new format
    // New format: [version:1][salt:32][iv:16][encrypted_data] = minimum 49 bytes
    // Legacy format: [iv:16][encrypted_data] = minimum 16 bytes

    if (data.length < 49) {
      return true; // Definitely legacy
    }

    // Check if first byte is a valid version
    if (data[0] === 0 || data[0] === 1) {
      return false; // New format with version byte
    }

    return true; // No version byte = legacy
  } catch (error) {
    return false;
  }
};

/**
 * Migrates a single encrypted value from legacy to new format
 */
const migrateValue = (password, encryptedValue) => {
  try {
    // Decrypt using the automatic detection (will use legacy method)
    const decrypted = getKey(password, encryptedValue);

    if (!decrypted) {
      throw new Error('Failed to decrypt value');
    }

    // Re-encrypt using the new method (will use scrypt)
    // Note: We don't pass jsonKey here as we'll update the JSON manually
    const reencrypted = setKey(password, decrypted);

    return reencrypted;
  } catch (error) {
    throw new Error(`Migration failed: ${error.message}`);
  }
};

/**
 * Main migration function
 */
const migrate = async () => {
  console.log('========================================');
  console.log('🔐 ENCRYPTION MIGRATION UTILITY');
  console.log('========================================');
  console.log();
  console.log('This tool migrates encrypted keys from SHA-256 to scrypt-based encryption.');
  console.log('Location:', jsonPath);
  console.log();

  // Check if file exists
  if (!fs.existsSync(jsonPath)) {
    console.log('❌ No cfr.json file found. Nothing to migrate.');
    console.log('If you have encrypted keys elsewhere, please set CFR_FILE_PATH environment variable.');
    return;
  }

  // Load current data
  let json;
  try {
    json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (error) {
    console.error('❌ Failed to read cfr.json:', error.message);
    return;
  }

  const keys = Object.keys(json);

  if (keys.length === 0) {
    console.log('ℹ️  No encrypted keys found in cfr.json');
    return;
  }

  console.log(`Found ${keys.length} encrypted key(s):`);

  // Analyze each key
  const legacyKeys = [];
  const modernKeys = [];

  keys.forEach((key) => {
    const isLegacy = isLegacyEncryption(json[key]);
    if (isLegacy) {
      legacyKeys.push(key);
      console.log(`  ⚠️  ${key} - LEGACY (needs migration)`);
    } else {
      modernKeys.push(key);
      console.log(`  ✅ ${key} - MODERN (already using scrypt)`);
    }
  });

  console.log();

  if (legacyKeys.length === 0) {
    console.log('✅ All keys are already using modern encryption. No migration needed!');
    return;
  }

  console.log(`${legacyKeys.length} key(s) need migration.`);
  console.log();

  // Get password
  const password = process.env.MASTER_KEY_PASSWORD || await question('Enter MASTER_KEY_PASSWORD: ');

  if (!password) {
    console.log('❌ Password is required for migration');
    return;
  }

  console.log();

  // Confirm migration
  const confirm = await question(`Migrate ${legacyKeys.length} key(s)? (yes/no): `);

  if (confirm.toLowerCase() !== 'yes') {
    console.log('Migration cancelled.');
    return;
  }

  console.log();

  // Create backup
  console.log('Creating backup...');
  const backupPath = createBackup();

  if (!backupPath) {
    console.log('❌ Cannot proceed without backup');
    return;
  }

  console.log();

  // Migrate each legacy key
  console.log('Starting migration...');
  let successCount = 0;
  let failCount = 0;

  for (const key of legacyKeys) {
    try {
      console.log(`  Migrating: ${key}...`);
      const newEncrypted = migrateValue(password, json[key]);
      json[key] = newEncrypted;
      successCount++;
      console.log(`  ✅ ${key} migrated successfully`);
    } catch (error) {
      failCount++;
      console.error(`  ❌ ${key} migration failed:`, error.message);
    }
  }

  console.log();

  if (failCount > 0) {
    console.log(`⚠️  ${failCount} key(s) failed to migrate.`);
    console.log('Original file backed up at:', backupPath);
    console.log();

    const proceedAnyway = await question('Save partial migration results? (yes/no): ');

    if (proceedAnyway.toLowerCase() !== 'yes') {
      console.log('Migration cancelled. Original file unchanged.');
      return;
    }
  }

  // Save updated file
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf8');
    console.log('✅ Migration complete!');
    console.log();
    console.log('Summary:');
    console.log(`  ✅ Successfully migrated: ${successCount}`);
    console.log(`  ❌ Failed: ${failCount}`);
    console.log(`  📁 Backup saved to: ${backupPath}`);
    console.log();
    console.log('Your encrypted keys now use secure scrypt-based encryption.');
  } catch (error) {
    console.error('❌ Failed to save migrated data:', error.message);
    console.error('Original backup is safe at:', backupPath);
  }
};

// Run migration
migrate()
  .then(() => {
    rl.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration error:', error);
    rl.close();
    process.exit(1);
  });
