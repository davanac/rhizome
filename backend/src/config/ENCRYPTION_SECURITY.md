# Encryption Security Documentation

## Overview

This document describes the encryption system used in Rhizome to protect sensitive data, particularly blockchain private keys. The system has been upgraded from an insecure SHA-256 based implementation to a secure scrypt-based key derivation function.

## Security Upgrade (v2.0)

### What Changed

**Before (INSECURE):**
- Used SHA-256 to derive encryption keys from passwords
- No salt (same password → same key)
- Fast hashing = vulnerable to brute-force attacks
- Could crack weak passwords in minutes/hours

**After (SECURE):**
- Uses scrypt for key derivation (OWASP recommended)
- Random salt per encryption (different ciphertext each time)
- Slow hashing (>10ms) = resistant to brute-force attacks
- Would take years to crack even weak passwords

### Backward Compatibility

The new system automatically detects and handles both old and new encrypted data:

- **New data**: Encrypted with scrypt (version byte `0x01`)
- **Old data**: Automatically detected and decrypted with legacy SHA-256 method
- **Migration**: Use `migrate-encryption.js` to upgrade old data to new format

## Technical Details

### Encryption Format

**New Format (Version 1 - Scrypt):**
```
[version:1][salt:32][iv:16][encrypted_data:variable]
```

- `version`: 1 byte (0x01 = scrypt)
- `salt`: 32 bytes (random, unique per encryption)
- `iv`: 16 bytes (random initialization vector)
- `encrypted_data`: Variable length AES-256-CBC encrypted data

**Legacy Format (Version 0 - SHA-256):**
```
[iv:16][encrypted_data:variable]
```

- No version byte (auto-detected)
- No salt (security issue)
- `iv`: 16 bytes
- `encrypted_data`: Variable length AES-256-CBC encrypted data

### Scrypt Parameters

Following OWASP recommendations:

```javascript
N = 16384  // CPU/memory cost (2^14)
r = 8      // Block size
p = 1      // Parallelization
keyLen = 32 // 256-bit key
```

These parameters make key derivation take approximately 10-50ms on modern hardware, which:
- Is acceptable for legitimate users (barely noticeable)
- Makes brute-force attacks computationally infeasible
- Provides strong resistance to GPU/ASIC attacks

### Algorithms Used

- **Key Derivation**: scrypt (new) or SHA-256 (legacy compatibility only)
- **Encryption**: AES-256-CBC
- **Random Generation**: `crypto.randomBytes()` (cryptographically secure)

## Usage

### Basic Encryption/Decryption

```javascript
import { setKey, getKey } from './keyutils.js';

// Encrypt data
const password = process.env.MASTER_KEY_PASSWORD;
const privateKey = '0x1234...';
const encrypted = setKey(password, privateKey);

// Decrypt data
const decrypted = getKey(password, encrypted);
console.log(decrypted); // '0x1234...'
```

### Store in JSON File

```javascript
// Encrypt and store in cfr.json
const jsonKey = 'rhizome.mainnet.deployer';
setKey(password, privateKey, jsonKey);

// Decrypt from cfr.json by key name
const decrypted = getKey(password, jsonKey);
```

### File Location

By default, encrypted data is stored in:
```
~/.rhizome/cfr.json
```

You can customize the location with an environment variable:
```bash
export CFR_FILE_PATH="/custom/path/to/cfr.json"
```

## Migration Guide

### When to Migrate

You should migrate if:
- You see warnings about "LEGACY SHA-256 method" in logs
- You have encrypted data from before this security upgrade
- You want to ensure maximum security for your private keys

### How to Migrate

1. **Backup your current `cfr.json` file:**
   ```bash
   cp ~/.rhizome/cfr.json ~/.rhizome/cfr.json.backup
   ```

2. **Run the migration script:**
   ```bash
   cd backend
   MASTER_KEY_PASSWORD="your-password" node src/config/migrate-encryption.js
   ```

3. **Verify the migration:**
   - The script creates an automatic timestamped backup
   - Check that your application still works correctly
   - Verify no "LEGACY" warnings appear in logs

### Migration Script Features

- ✅ Automatic backup creation
- ✅ Detects which keys need migration
- ✅ Interactive confirmation prompts
- ✅ Handles partial failures gracefully
- ✅ Detailed logging of migration process

## Security Best Practices

### Password Strength

Even with scrypt, password strength matters:

- ✅ **Good**: `export MASTER_KEY_PASSWORD="$(openssl rand -base64 32)"`
- ⚠️ **Weak**: `export MASTER_KEY_PASSWORD="password123"`

**Recommendation**: Use at least 20 random characters for production.

### Environment Variables

Never hardcode passwords in code:

```javascript
// ❌ NEVER DO THIS
const password = "my-secret-password";

// ✅ ALWAYS USE ENV VARS
const password = process.env.MASTER_KEY_PASSWORD;
```

### File Permissions

Protect your `cfr.json` file:

```bash
chmod 600 ~/.rhizome/cfr.json
```

### Production Deployment

For production:

1. Generate a strong random password:
   ```bash
   openssl rand -base64 32
   ```

2. Store it securely (e.g., AWS Secrets Manager, HashiCorp Vault)

3. Set it as an environment variable in your deployment

4. Never commit `cfr.json` to version control (it's gitignored)

## Testing

Run security tests:

```bash
cd backend
npm run test:security
```

Tests verify:
- ✅ Encryption produces different ciphertext each time (random salt)
- ✅ Decryption works correctly
- ✅ Legacy format compatibility
- ✅ Wrong password returns null
- ✅ Corrupted data returns null
- ✅ Unicode and large data handling
- ✅ Key derivation takes sufficient time (anti-brute-force)
- ✅ Salt and IV randomness

## Troubleshooting

### "Cannot decrypt" errors

**Cause**: Wrong password or corrupted data

**Solution**:
1. Verify `MASTER_KEY_PASSWORD` is correct
2. Check if `cfr.json` is corrupted (restore from backup)
3. Check file permissions

### "LEGACY SHA-256 method" warnings

**Cause**: You're using old encrypted data

**Solution**: Run the migration script (see Migration Guide above)

### "scrypt too slow" performance issues

**Cause**: scrypt is intentionally slow for security

**Impact**: ~10-50ms per decryption (usually acceptable)

**If problematic**: Consider caching decrypted keys in memory (but be aware of security implications)

## Security Audit Trail

| Date | Issue | Resolution |
|------|-------|------------|
| 2025-10-07 | CodeQL: SHA-256 password hashing (CRITICAL) | Upgraded to scrypt with migration support |
| 2025-10-07 | No salt in encryption | Added 32-byte random salt per encryption |
| 2025-10-07 | Fast key derivation vulnerable to brute-force | Implemented scrypt with N=16384 |

## References

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [scrypt: A new key derivation function](https://www.tarsnap.com/scrypt.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback)

## Support

For security concerns, please:
1. Check this documentation first
2. Review `results.md` security audit report
3. Run tests with `npm run test:security`
4. Contact the development team for urgent security issues
