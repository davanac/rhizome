# Rhizome Wallet Architecture Documentation

## Overview

The Rhizome platform implements a custom wallet management system for user authentication and identity management. Unlike traditional Web3 applications that rely on external wallet providers (MetaMask, WalletConnect), Rhizome generates and manages its own Ethereum wallets internally.

## Table of Contents

1. [Architecture Overview](./architecture-overview.md)
2. [Wallet Generation & Key Derivation](./wallet-generation.md)
3. [Encryption & Storage](./encryption-storage.md)
4. [Message Signing & Verification](./message-signing.md)
5. [API Reference](./api-reference.md)
6. [Security Considerations](./security.md)

## Key Features

- **Self-Custody Wallets**: Users control their own private keys through mnemonic phrases
- **HD Wallet Structure**: Hierarchical Deterministic wallets for multiple profiles per user
- **Password-Based Encryption**: Mnemonics encrypted using user passwords
- **Server-Side Transaction Signing**: All blockchain operations handled by admin wallet
- **Profile-Based Identity**: Each user profile gets a unique derived Ethereum address

## Quick Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  User Registration                                           │
│  ├── Generate Mnemonic (BIP39)                              │
│  ├── Derive Master Wallet                                   │
│  ├── Encrypt Mnemonic with Password (PBKDF2 + AES-GCM)     │
│  └── Send Encrypted Data to Backend                         │
│                                                              │
│  Profile Creation                                            │
│  ├── Fetch Encrypted Mnemonic from Backend                  │
│  ├── Decrypt with User Password                             │
│  ├── Derive Child Wallet (BIP44 Path)                       │
│  └── Store Derived Address with Profile                     │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
├─────────────────────────────────────────────────────────────┤
│  Wallet Storage (PostgreSQL)                                 │
│  ├── Encrypted Private Key (Mnemonic)                       │
│  ├── Public Key                                             │
│  └── Ethereum Address                                       │
│                                                              │
│  Blockchain Operations                                       │
│  └── Admin Wallet Signs All Transactions                    │
└─────────────────────────────────────────────────────────────┘
```

## Component Locations

- **Frontend Wallet Utilities**: `/front/src/utils/crypto.js`
- **Authentication Controller**: `/front/src/network/api/controllers/auth.controller.js`
- **Profile Controller**: `/front/src/network/api/controllers/profiles.controller.js`
- **Backend Auth Service**: `/backend/src/services/auth.service.js`
- **Blockchain Service**: `/backend/src/services/blockchain.service.js`
- **Database Schema**: `/backend/database/01_init.sql`