#!/bin/sh
set -e

# Rhizome Backend Startup Script
# This script is executed by the systemd service to start the Rhizome backend

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="${SCRIPT_DIR}"

# Source environment variables from systemd
if [ -f /etc/default/rhizome ]; then
    set -a
    . /etc/default/rhizome
    set +a
fi

# Build DATABASE_URL from individual components
if [ -n "${DB_HOST}" ]; then
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# Log startup
echo "[$(date)] Starting Rhizome Backend..."
echo "[$(date)] Working directory: $APP_DIR"
echo "[$(date)] Node version: $(node --version)"
echo "[$(date)] Environment: ${NODE_ENV:-production}"

# Change to app directory
cd "$APP_DIR"

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
    echo "[$(date)] Installing dependencies..."
    npm ci --production
fi

# ==============================================================================
# WALLET SETUP FOR DOCKER/TESTNET
# ==============================================================================

# Determine cfr.json path
if [ -n "${CFR_FILE_PATH}" ]; then
    CFR_PATH="${CFR_FILE_PATH}"
else
    CFR_PATH="$HOME/.rhizome/cfr.json"
fi

echo "[$(date)] Checking wallet setup..."
echo "[$(date)] CFR file path: ${CFR_PATH}"

# Check if wallet already exists
if [ -f "${CFR_PATH}" ]; then
    echo "[$(date)] ✅ Wallet found at ${CFR_PATH}"
    echo "[$(date)] Using existing wallet (mounted or previously generated)"
else
    echo "[$(date)] 🔑 No wallet found at ${CFR_PATH}"

    # In production, wallet must be provided - do not generate
    if [ "${NODE_ENV}" = "production" ]; then
        echo "[$(date)] ❌ ERROR: Production environment requires a pre-configured wallet"
        echo "[$(date)] Please ensure CFR_FILE_PATH is set and the wallet file exists"
        echo "[$(date)] Or provide PRIVATE_KEY environment variable"
        exit 1
    fi

    # For development/testnet, allow wallet generation
    echo "[$(date)] Setting up new wallet for ${NODE_ENV:-development} environment..."

    # Check if PRIVATE_KEY is provided via environment
    if [ -n "${PRIVATE_KEY}" ]; then
        echo "[$(date)] 📥 Using provided PRIVATE_KEY from environment"
    else
        echo "[$(date)] 🎲 Generating random wallet for testnet"
    fi

    # Run wallet generation script
    node generate-wallet.js

    if [ $? -eq 0 ]; then
        echo "[$(date)] ✅ Wallet setup complete"
    else
        echo "[$(date)] ❌ Wallet setup failed"
        exit 1
    fi
fi

# ==============================================================================
# START APPLICATION
# ==============================================================================

echo "[$(date)] Starting server..."
exec node src/server.js
