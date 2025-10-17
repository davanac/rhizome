# Authentication Documentation

This folder contains all documentation related to authentication and wallet management in the Rhizome platform.

## Overview

Rhizome uses **Web3Auth** for user authentication, providing social login capabilities while maintaining non-custodial wallet control. The system has been migrated from a custom mnemonic-based approach to Web3Auth's MPC (Multi-Party Computation) infrastructure.

## Documentation Index

### 🔐 Core Authentication
- **[Security](security.md)** - Cryptographic signature verification and security measures
- **[Migration Guide](migration-guide.md)** - Complete guide for migrating from mnemonic-based wallets

### 📋 Implementation Details
- **[Web3Auth Integration](web3auth-integration.md)** - Technical implementation details
- **[API Reference](api-reference.md)** - Authentication endpoints and usage

## Quick Start

1. **Setup Web3Auth**: Get Client ID from [dashboard.web3auth.io](https://dashboard.web3auth.io)
2. **Configure Environment**: Set `VITE_WEB3AUTH_CLIENT_ID` 
3. **Run Migration**: Execute database migration script
4. **Test Authentication**: Verify social login flow

## Key Features

- ✅ **Social Login** - Google, Email, Facebook, etc.
- ✅ **No Seed Phrases** - Users don't manage mnemonics
- ✅ **Cryptographic Security** - Signature-based authentication
- ✅ **Replay Protection** - Nonce-based challenge system
- ✅ **Non-Custodial** - Users control their keys via Web3Auth MPC

## Security Architecture

```
User Login → Web3Auth → Get Nonce → Sign Message → Verify Signature → JWT Tokens
```

### Authentication Flow
1. User authenticates with Web3Auth (social login)
2. Frontend requests unique nonce from backend
3. User signs authentication message with Web3Auth wallet
4. Backend verifies signature and wallet ownership
5. JWT tokens issued for session management

## Migration Status

| Component | Status | Details |
|-----------|--------|---------|
| Frontend | ✅ Complete | Web3Auth service, context, updated components |
| Backend | ✅ Complete | Signature verification, nonce management |
| Database | ✅ Complete | Migration script, new schema |
| Security | ✅ Complete | Cryptographic verification implemented |

## Legacy Wallet System

The old mnemonic-based wallet documentation has been preserved in `/documentation/wallet/` for reference, but **should not be used for new development**.

### Deprecated Components
- `generateWallet()` - Use Web3Auth login instead
- `deriveWallet()` - Web3Auth provides single wallet per user
- `encrypt()`/`decrypt()` - Web3Auth handles key management
- Mnemonic storage and display

## Support & Troubleshooting

### Common Issues
- **Web3Auth Modal Not Showing**: Check Client ID configuration
- **Signature Verification Failed**: Ensure nonce is fresh and message format is correct
- **Database Errors**: Verify migration was completed successfully

### Resources
- [Web3Auth Documentation](https://web3auth.io/docs)
- [Web3Auth Dashboard](https://dashboard.web3auth.io)
- [Web3Auth Community](https://web3auth.io/community)

## Contributing

When updating authentication documentation:
1. Keep security documentation up to date
2. Update migration guides for any breaking changes  
3. Document new endpoints in API reference
4. Test all code examples before committing