# Web3Auth Migration Guide

## Overview

This guide documents the migration from the custom mnemonic-based wallet system to Web3Auth, a modern authentication and key management solution that eliminates seed phrases while maintaining non-custodial wallet control.

## Key Changes

### Before (Mnemonic-Based System)
- Users generated BIP39 mnemonics locally
- Mnemonics encrypted with user passwords
- HD wallet derivation for multiple profiles
- Users responsible for backing up seed phrases
- Complex wallet management code

### After (Web3Auth System)
- Social login (Google, Email, etc.)
- No seed phrases to manage
- MPC-based key management
- Built-in recovery mechanisms
- Simplified codebase

## Implementation Summary

### Frontend Changes

1. **New Files Created:**
   - `/front/src/services/web3auth.service.js` - Core Web3Auth service
   - `/front/src/contexts/Web3AuthContext.tsx` - React context for Web3Auth
   - `/front/.env.example` - Environment variables template

2. **Modified Files:**
   - `/front/src/network/api/controllers/auth.controller.js` - Added Web3Auth login methods
   - `/front/src/network/api/controllers/profiles.controller.js` - Removed wallet derivation
   - `/front/src/utils/crypto.js` - Simplified to use Web3Auth for signing
   - `/front/src/components/SignUpForm.tsx` - Removed mnemonic modal, added Web3Auth flow

### Backend Changes

1. **New Files Created:**
   - `/backend/migrations/1600000004000_web3auth-migration.sql` - Database migration script

2. **Modified Files:**
   - `/backend/src/services/auth.service.js` - Added Web3Auth authentication
   - `/backend/src/controllers/auth.controller.js` - Added Web3Auth endpoints
   - `/backend/src/services/profiles.service.js` - Added helper functions

### Database Changes

1. **Removed:**
   - `wallet` table (no longer needed)
   - `derived_address` and `derived_public_key` columns from profiles

2. **Added:**
   - `web3auth_users` table for Web3Auth user data
   - `wallet_address` column to profiles and participants tables

## Setup Instructions

### 1. Create Web3Auth Account

1. Visit [https://dashboard.web3auth.io](https://dashboard.web3auth.io)
2. Sign up for a free account
3. Create a new project
4. Configure authentication providers (Google, Email, etc.)
5. Copy your Client ID

### 2. Configure Environment Variables

Create a `.env` file in the frontend directory:

```env
# Web3Auth Configuration
VITE_WEB3AUTH_CLIENT_ID=your_client_id_here
VITE_WEB3AUTH_NETWORK=sapphire_devnet  # Use sapphire_mainnet for production
```

### 3. Run Database Migration

Execute the migration to update your database schema:

```bash
cd backend
npm run migrate
```

### 4. Install Dependencies

Frontend dependencies are already installed via:
```bash
cd front
npm install
```

### 5. Update Application Wrapper

Wrap your application with the Web3Auth provider in your main App component:

```jsx
import { Web3AuthProvider } from './contexts/Web3AuthContext';

function App() {
  return (
    <Web3AuthProvider>
      {/* Your app components */}
    </Web3AuthProvider>
  );
}
```

## Usage Examples

### Login with Web3Auth

```javascript
import { loginWithWeb3Auth } from '@api/controllers/auth.controller';

// Login with default provider (shows modal)
const result = await loginWithWeb3Auth();

// Login with specific provider
const result = await loginWithWeb3Auth('google');
```

### Sign Messages

```javascript
import { signMessage } from '@utils/crypto';

// Sign a message with Web3Auth
const signature = await signMessage("0x..." /* hex message */);
```

### Get Wallet Address

```javascript
import { getWalletAddress } from '@utils/crypto';

const address = await getWalletAddress();
```

## API Changes

### Authentication Endpoints

The `/api/auth/login` endpoint now accepts Web3Auth credentials:

```javascript
// Web3Auth login request
POST /api/auth/login
{
  "web3authId": "user_web3auth_id",
  "email": "user@example.com",
  "walletAddress": "0x...",
  "verifier": "google",
  "typeOfLogin": "google"
}
```

### Profile Creation

Profiles now use the Web3Auth wallet address instead of derived addresses:

```javascript
// Profile creation no longer requires password for wallet derivation
POST /api/profiles
{
  "username": "johndoe",
  "walletAddress": "0x..." // From Web3Auth
}
```

## Migration Checklist

- [ ] Create Web3Auth account and get Client ID
- [ ] Update environment variables
- [ ] Run database migration
- [ ] Test authentication flow
- [ ] Test profile creation
- [ ] Test message signing
- [ ] Verify blockchain interactions
- [ ] Update any custom integrations

## Benefits of Migration

1. **Better User Experience**
   - No seed phrases to remember
   - Familiar social login
   - Faster onboarding

2. **Enhanced Security**
   - MPC-based key management
   - No private keys stored locally
   - Built-in recovery options

3. **Simplified Codebase**
   - Removed complex wallet derivation logic
   - Less encryption/decryption code
   - Cleaner authentication flow

4. **Future-Proof**
   - Regular security updates from Web3Auth
   - Support for new authentication methods
   - Cross-platform compatibility

## Troubleshooting

### Common Issues

1. **Web3Auth Modal Not Appearing**
   - Check Client ID is correct
   - Verify Web3Auth is initialized
   - Check browser console for errors

2. **Authentication Fails**
   - Ensure database migration was run
   - Check backend logs for errors
   - Verify Web3Auth configuration

3. **Wallet Address Not Available**
   - Ensure user is logged in with Web3Auth
   - Check Web3Auth connection status
   - Verify provider is set correctly

## Support

For Web3Auth-specific issues:
- Documentation: [https://web3auth.io/docs](https://web3auth.io/docs)
- Support: [https://web3auth.io/community](https://web3auth.io/community)

For application-specific issues:
- Check the project's issue tracker
- Review the migration commits
- Contact the development team

## Rollback Plan

If you need to rollback to the mnemonic-based system:

1. Restore database from backup
2. Revert code changes
3. Redeploy previous version

Note: New users created with Web3Auth will not be accessible after rollback.

## Next Steps

After successful migration:

1. Monitor authentication metrics
2. Gather user feedback
3. Consider adding more authentication providers
4. Implement additional Web3Auth features (MFA, session management)