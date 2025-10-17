# Rhizome Documentation

Welcome to the Rhizome platform documentation. This documentation covers all aspects of the blockchain-based collaborative project management platform with NFT minting capabilities.

## 📚 Documentation Structure

### 🔐 Authentication & Security
- **[Authentication Overview](auth/README.md)** - Web3Auth integration and security
- **[Migration Guide](auth/migration-guide.md)** - Migrating from mnemonic-based wallets
- **[Security Documentation](auth/security.md)** - Cryptographic verification and attack prevention
- **[Web3Auth Integration](auth/web3auth-integration.md)** - Technical implementation details
- **[API Reference](auth/api-reference.md)** - Authentication endpoints and usage

### 💰 Legacy Wallet System (Deprecated)
- **[Wallet Overview](wallet/README.md)** - ⚠️ Legacy mnemonic-based system
- **[Architecture](wallet/architecture-overview.md)** - Old HD wallet structure
- **[Security](wallet/security.md)** - Previous security model
- **[API Reference](wallet/api-reference.md)** - Deprecated wallet endpoints

> **⚠️ Note:** The wallet documentation is kept for historical reference only. **All new development should use Web3Auth authentication.**

## 🚀 Quick Start

### For Developers

1. **Authentication**: Use Web3Auth for all new user authentication
2. **Environment**: Set up `VITE_WEB3AUTH_CLIENT_ID` from [dashboard.web3auth.io](https://dashboard.web3auth.io)
3. **Database**: Run migration script to update schema
4. **Testing**: Verify social login flow works correctly

### For New Contributors

1. Read the [Authentication Overview](auth/README.md)
2. Review the [Migration Guide](auth/migration-guide.md) to understand the changes
3. Check [CLAUDE.md](../CLAUDE.md) for development guidelines
4. Test the authentication flow locally

## 🏗️ Platform Architecture

### Frontend Stack
- **React** + **TypeScript** + **Vite**
- **TailwindCSS** + **shadcn-ui**
- **Web3Auth** for authentication
- **React Query** for server state
- **ethers.js** for blockchain interaction

### Backend Stack
- **Fastify** (Node.js) + **PostgreSQL**
- **JWT** authentication with Web3Auth integration
- **ethers.js** for smart contract interaction
- **Signature verification** for security

### Blockchain
- **Solidity** smart contracts
- **Optimism/Base/Ethereum** testnets
- **NFT minting** capabilities
- **Admin wallet** for gasless operations

## 🔄 Migration Status

The platform has been successfully migrated from a custom mnemonic-based wallet system to Web3Auth:

| Component | Status | Documentation |
|-----------|--------|---------------|
| **Authentication** | ✅ Complete | [Auth Docs](auth/) |
| **Frontend Integration** | ✅ Complete | [Web3Auth Integration](auth/web3auth-integration.md) |
| **Backend Security** | ✅ Complete | [Security Docs](auth/security.md) |
| **Database Schema** | ✅ Complete | [Migration Guide](auth/migration-guide.md) |
| **Legacy Cleanup** | ✅ Complete | [Wallet Docs](wallet/) (deprecated) |

## 📋 Key Changes Summary

### ✅ What's New (Web3Auth)
- Social login (Google, Email, Facebook, etc.)
- No seed phrases to manage
- MPC-based key management
- Cryptographic signature verification
- Built-in recovery mechanisms
- Simplified user experience

### ❌ What's Deprecated (Legacy Wallet)
- BIP39 mnemonic generation
- HD wallet derivation
- Password-based encryption
- Manual seed phrase backup
- Complex wallet management

## 🛡️ Security Features

### Current (Web3Auth)
- **Cryptographic Signatures**: Users must prove wallet ownership
- **Nonce-Based Authentication**: Prevents replay attacks
- **Time-Limited Challenges**: 5-minute expiration
- **MPC Key Management**: Distributed key shares
- **Social Recovery**: Built-in account recovery

### Legacy (Deprecated)
- Password-based mnemonic encryption
- HD wallet derivation
- Client-side key generation
- Manual backup requirements

## 📖 API Documentation

### Authentication Endpoints
- `POST /auth/auth-nonce` - Generate authentication challenge
- `POST /auth/login` - Web3Auth login with signature verification
- `POST /auth/refresh-token` - Refresh access tokens
- `GET /auth/me` - Get current user information

### Legacy Endpoints (Deprecated)
- `GET /auth/wallet` - Now returns Web3Auth user info
- Legacy email/password login - Returns error directing to Web3Auth

## 🧪 Testing

### Authentication Testing
```javascript
// Test Web3Auth login flow
const user = await loginWithWeb3Auth('google');
expect(user.address).toMatch(/^0x[0-9a-fA-F]{40}$/);

// Test signature verification
const isValid = verifyAuthSignature(address, signature, web3authId);
expect(isValid).toBe(true);
```

### Security Testing
- Nonce expiration handling
- Signature verification with invalid data
- Replay attack prevention
- Rate limiting compliance

## 🔧 Development Guidelines

### Authentication
- **Always use Web3Auth** for new user authentication
- **Never use legacy wallet functions** (`generateWallet`, `deriveWallet`, etc.)
- **Verify signatures** on the backend for security
- **Handle errors gracefully** with proper user feedback

### Code Style
- Follow existing patterns in the codebase
- Use TypeScript for new frontend components
- Include error handling and validation
- Add tests for critical authentication flows

### Security
- **Never trust client-side data** without verification
- **Always verify signatures** on the backend
- **Use nonces** to prevent replay attacks
- **Log authentication attempts** for monitoring

## 🆘 Troubleshooting

### Common Issues

| Issue | Solution | Documentation |
|-------|----------|---------------|
| Web3Auth modal not showing | Check Client ID configuration | [Integration Guide](auth/web3auth-integration.md) |
| Signature verification fails | Verify message format matches exactly | [Security Docs](auth/security.md) |
| Database migration errors | Check permissions and run script manually | [Migration Guide](auth/migration-guide.md) |
| Legacy wallet functions failing | Replace with Web3Auth equivalents | [API Reference](auth/api-reference.md) |

### Support Resources
- [Web3Auth Documentation](https://web3auth.io/docs)
- [Web3Auth Community](https://web3auth.io/community)
- [Project Issue Tracker](https://github.com/your-org/rhizome/issues)

## 📝 Contributing to Documentation

When updating documentation:

1. **Keep it organized** - Use the established folder structure
2. **Update indexes** - Add new docs to relevant README files
3. **Cross-reference** - Link related documentation
4. **Test examples** - Verify all code examples work
5. **Version control** - Document breaking changes
6. **Keep it current** - Remove outdated information

### Documentation Standards
- Use clear, concise language
- Include code examples where helpful
- Document error conditions and solutions
- Provide context for design decisions
- Keep security implications in mind

---

**Last Updated:** December 2024  
**Version:** 2.0 (Web3Auth Migration Complete)