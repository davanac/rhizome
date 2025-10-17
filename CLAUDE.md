# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rhizome is a blockchain-based platform for collaborative project management with NFT minting capabilities. It consists of:
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn-ui + Web3Auth
- **Backend**: Fastify (Node.js) + PostgreSQL + JWT auth + Signature verification
- **Blockchain**: Solidity smart contracts on Optimism/Base/Ethereum testnets

## ⚠️ Authentication System Migration

**IMPORTANT**: The platform has migrated from mnemonic-based wallets to Web3Auth. Always use Web3Auth for authentication.

### ✅ Current System (Web3Auth)
- Social login (Google, Email, etc.)
- No seed phrases to manage
- MPC-based key management
- Cryptographic signature verification

### ❌ Legacy System (Deprecated)
- Do NOT use: `generateWallet()`, `deriveWallet()`, `encrypt()`, `decrypt()`
- Do NOT implement mnemonic-based authentication
- Legacy wallet documentation is in `/documentation/wallet/` for reference only

## Essential Commands

### Frontend Development (in `/front`)
```bash
npm run dev        # Start dev server with Chrome
npm run build      # Production build
npm run lint       # Run ESLint
```

### Backend Development (in `/backend`)
```bash
npm run dev        # Start with nodemon (auto-reload)
npm run start      # Production mode
docker-compose up  # Start PostgreSQL database
```

### Database Migrations (in `/backend`)
```bash
npm run migrate              # Run all pending migrations
npm run migrate:down         # Rollback last migration
npm run migrate:create <name> # Create new migration file
```

### Smart Contract Development (in `/backend`)
```bash
npx hardhat compile                                      # Compile contracts
npx hardhat test                                        # Run contract tests
npx hardhat node                                        # Local blockchain
npx hardhat run src/web3/scripts/deploy.js --network [network]  # Deploy
```

## Architecture Overview

### Frontend Architecture
- **Authentication**: Web3Auth for social login and wallet management
- **State Management**: React Query for server state, Web3AuthContext for auth
- **Routing**: React Router with protected routes via `ProtectedRoute` component
- **API Communication**: Centralized in `/front/src/utils/api.ts` with JWT handling
- **Component Structure**: 
  - Pages in `/front/src/pages/`
  - Reusable components in `/front/src/components/`
  - Web3Auth context in `/front/src/contexts/Web3AuthContext.tsx`
  - shadcn-ui components for consistent UI

### Backend Architecture
- **API Structure**: RESTful endpoints organized by feature
  - Auth endpoints: `/api/auth/*` (Web3Auth integration with signature verification)
  - Blockchain operations: `/api/blockchain/*`
  - Project management: `/api/projects/*`
  - User profiles: `/api/profiles/*`
- **Authentication**: JWT tokens with Web3Auth integration and signature verification
- **Security**: Cryptographic signature verification prevents spoofing attacks
- **Database**: PostgreSQL with raw SQL queries (no ORM)
- **Database Migrations**: Automated using node-pg-migrate (Flyway-like for Node.js)
  - Migrations in `/backend/migrations/` directory
  - Auto-run on production deployment
  - Manual control in development mode
  - Version tracked in `pgmigrations` table
- **Smart Contract Integration**: Uses ethers.js to interact with deployed contracts

### Smart Contracts
- **ProjectsRegistry.sol**: Main contract for managing projects
- **RhizomeNFT.sol**: ERC-721 contract for minting participant NFTs
- **Deployment**: Configured for Optimism Sepolia, Base Sepolia, and Ethereum Sepolia testnets

## Key Development Patterns

### Web3Auth Authentication (Frontend)
```typescript
import { useWeb3Auth } from '@/contexts/Web3AuthContext';
import { loginWithWeb3Auth } from '@api/controllers/auth.controller';

// Use Web3Auth context
const { login, logout, isConnected, user } = useWeb3Auth();

// Or use controller directly
const result = await loginWithWeb3Auth('google');
```

### Message Signing (Frontend)
```typescript
import { signMessage } from '@utils/crypto';

// Sign with Web3Auth (replaces old mnemonic-based signing)
const signature = await signMessage(messageToSign);
```

### Protected Routes (Frontend)
```typescript
// Routes requiring authentication use ProtectedRoute wrapper
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### Signature Verification (Backend)
```javascript
import { verifyAuthSignature, generateAuthNonce } from '#services/auth.service.js';

// Generate nonce for authentication challenge
const { nonce, timestamp } = generateAuthNonce(walletAddress);

// Verify signature proves wallet ownership
const isValid = verifyAuthSignature(walletAddress, signature, web3authId);
```

### Database Queries (Backend)
```javascript
// Direct PostgreSQL queries in /backend/src/database/index.js
const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// Web3Auth users table
const web3authUser = await pool.query(
  'SELECT * FROM web3auth_users WHERE web3auth_id = $1',
  [web3authId]
);
```

### Database Migrations (Backend)
```bash
# Run migrations manually in development
cd backend
npm run migrate

# Create a new migration
npm run migrate:create add-new-column

# Rollback last migration (use with caution)
npm run migrate:down
```

Migrations are SQL files in `/backend/migrations/` directory:
- Named with timestamp prefix: `1600000000000_migration-name.sql`
- Automatically run in production on server startup
- Version tracked in `pgmigrations` table
- Run sequentially in order

### Smart Contract Interaction (Backend)
```javascript
// Contract calls via /backend/src/services/blockchainService.js
const contract = new ethers.Contract(contractAddress, abi, signer);
await contract.methodName(params);
```

## Environment Variables

### Frontend (.env)
- `VITE_API_URL` - Backend API URL
- `VITE_WEB3AUTH_CLIENT_ID` - Web3Auth Client ID from dashboard.web3auth.io
- `VITE_WEB3AUTH_NETWORK` - Web3Auth network (sapphire_devnet/sapphire_mainnet)

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Server port (default: 3000)
- `FRONTEND_URL` - Frontend URL for CORS
- Blockchain RPC URLs and private keys for each network

## Testing

- **Smart Contracts**: Tests in `/backend/src/web3/test/` using Hardhat and Chai
- **Frontend/Backend**: No unit tests implemented yet

## Database Schema

Key tables:
- `users` - User accounts and authentication
- `web3auth_users` - Web3Auth authentication data and wallet addresses
- `projects` - Project metadata
- `participants` - Project participants and NFT data (now uses wallet_address)
- `profiles` - User profiles (now uses wallet_address instead of derived_address)
- `invitations` - Project invitations
- `images` - Uploaded image references

### ⚠️ Deprecated Tables
- `wallet` - Removed (was used for mnemonic-based wallets)

## Documentation

All documentation is organized in the `/documentation/` folder by theme:

### 📁 `/documentation/auth/` - Authentication (Current)
- **[README.md](documentation/auth/README.md)** - Authentication overview
- **[migration-guide.md](documentation/auth/migration-guide.md)** - Web3Auth migration guide
- **[security.md](documentation/auth/security.md)** - Cryptographic security details
- **[web3auth-integration.md](documentation/auth/web3auth-integration.md)** - Technical integration
- **[api-reference.md](documentation/auth/api-reference.md)** - API endpoints

### 📁 `/documentation/wallet/` - Legacy Wallet (Deprecated)
- Contains historical mnemonic-based wallet documentation
- **DO NOT USE** for new development - kept for reference only

## Development Guidelines

### ✅ Authentication Best Practices
1. **Always use Web3Auth** for new authentication features
2. **Verify signatures on backend** to prevent spoofing attacks  
3. **Use nonces** to prevent replay attacks
4. **Handle errors gracefully** with proper user feedback
5. **Test authentication flows** thoroughly

### ❌ What NOT to Do
1. **Never use legacy wallet functions**: `generateWallet()`, `deriveWallet()`, `encrypt()`, `decrypt()`
2. **Never implement mnemonic-based authentication**
3. **Never trust client-side data** without cryptographic verification
4. **Never skip signature verification** on sensitive operations

### 🔐 Security Requirements
- All authentication must use cryptographic signatures
- Backend must verify signatures using `verifyAuthSignature()`
- Nonces must be used for all authentication challenges
- Failed authentication attempts must be logged

### 📚 Documentation Standards
- Keep authentication docs in `/documentation/auth/`
- Update API reference for any endpoint changes
- Document error codes and solutions
- Include code examples that work