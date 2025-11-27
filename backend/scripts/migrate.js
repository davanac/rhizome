#!/usr/bin/env node
// path: scripts/migrate.js
// Wrapper script for node-pg-migrate that constructs DATABASE_URL from individual env vars

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Construct DATABASE_URL from individual variables if not already set
if (!process.env.DATABASE_URL) {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const name = process.env.DB_NAME || 'rhizome';
  const user = process.env.DB_USER || '';
  const pass = process.env.DB_PASS || '';

  process.env.DATABASE_URL = `postgresql://${user}:${pass}@${host}:${port}/${name}`;
}

// Get the migration command (up, down, create, etc.)
const args = process.argv.slice(2);
if (args.length === 0) {
  args.push('up');
}

// Run node-pg-migrate with the constructed DATABASE_URL
const migratePath = path.join(__dirname, '../node_modules/.bin/node-pg-migrate');
const child = spawn(migratePath, args, {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

child.on('close', (code) => {
  process.exit(code);
});
