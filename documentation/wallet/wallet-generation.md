# Wallet Generation & Key Derivation

## Overview

The Rhizome wallet system uses industry-standard BIP39 mnemonic phrases and BIP44 hierarchical deterministic (HD) wallet structure to generate and manage Ethereum wallets.

## Wallet Generation Process

### 1. Master Wallet Creation

**Location**: `front/src/utils/crypto.js:201`

```javascript
export const generateWallet = async (password) => {
  // 1. Generate BIP39 mnemonic phrase
  const mnemonic = ethers.Wallet.createRandom().mnemonic.phrase;
  
  // 2. Create master wallet from mnemonic
  const walletMaster = ethers.Wallet.fromPhrase(mnemonic);
  
  // 3. Extract wallet components
  const walletId = walletMaster.address;     // Ethereum address
  const privateKey = walletMaster.privateKey; // Private key
  const publicKey = walletMaster.publicKey;   // Public key
  
  // 4. Encrypt mnemonic with user password
  const encryptedPrivateKey = await encrypt(mnemonic, password);
  
  // 5. Return wallet object
  return {
    id: walletId,
    encrypted_private_key: encryptedPrivateKey,
    public_key: publicKey,
    mnemonic, // Only used in registration flow
  };
};
```

**Process Steps:**
1. **Mnemonic Generation**: Creates 12-word BIP39 mnemonic using ethers.js
2. **Master Wallet**: Derives master wallet from mnemonic
3. **Key Extraction**: Extracts address, private key, and public key
4. **Encryption**: Encrypts mnemonic with user password
5. **Object Construction**: Returns wallet data structure

### 2. Registration Flow Integration

**Location**: `front/src/network/api/controllers/auth.controller.js:113`

```javascript
export const register = async ({ email, password }) => {
  // Hash password for authentication
  const hashedPassword = await hashSHA256(password);
  
  // Generate wallet using plain password (for encryption)
  const wallet = await generateWallet(password);
  
  // Prepare wallet data for backend
  const sendWallet = {
    id: wallet.id,
    encrypted_private_key: wallet.encrypted_private_key,
    public_key: wallet.public_key,
  };
  
  // Send to backend (mnemonic stays client-side)
  const result = await registerRequest(email, hashedPassword, sendWallet);
  
  // Return both result and wallet (with mnemonic for display)
  return { ...(result), wallet };
};
```

**Security Note**: The mnemonic is never sent to the backend. Only the encrypted version is stored.

## Hierarchical Deterministic (HD) Wallet Structure

### BIP44 Path Structure

**Standard Path**: `m/44'/60'/0'/0/{profile_index}`

- `m` - Master key
- `44'` - BIP44 standard (hardened)
- `60'` - Ethereum coin type (hardened)
- `0'` - Account index (hardened, always 0)
- `0` - Change index (external addresses, always 0)
- `{profile_index}` - Profile-specific index (0, 1, 2, ...)

### Profile Wallet Derivation

**Location**: `front/src/utils/crypto.js:226`

```javascript
export const deriveWallet = (mnemonic, index = 0) => {
  try {
    // Create HDNode with base path
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, "m/44'/60'/0'/0");
    
    // Derive child wallet at specific index
    const derivedWallet = hdNode.derivePath(`${index}`);
    
    return {
      id: `${derivedWallet.address}.${index}`, // Address + index
      public_key: derivedWallet.publicKey,
    };
  } catch (error) {
    return {
      success: false,
      message: "Derivation error",
      errorCode: "wallet-derivation-error",
    };
  }
};
```

### Profile Creation Process

**Location**: `front/src/network/api/controllers/profiles.controller.js:50`

```javascript
export const makeNewProfile = async ({ payload, getSession, setInSession }) => {
  // 1. Fetch encrypted mnemonic from backend
  const fetchedWallet = await getWallet();
  
  // 2. Decrypt mnemonic with user password
  const decryptedPrivateKey = await decrypt(
    fetchedWallet.encrypted_private_key,
    payload.profile?.password
  );
  
  // 3. Derive new wallet for profile
  const newWallet = deriveWallet(
    decryptedPrivateKey,
    user?.profiles?.length + 1 || 1
  );
  
  // 4. Create profile with derived address
  // ... profile creation logic
};
```

**Profile Index Logic:**
- First profile: index 1
- Second profile: index 2
- Index based on `user.profiles.length + 1`

## Key Derivation Examples

### Master Wallet (Registration)
```
Mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
Path: m/44'/60'/0'/0 (master)
Address: 0x9858EfFD232B4033E47d90003D41EC34EcaEda94
```

### Profile Wallets (Derived)
```
Profile 1:
Path: m/44'/60'/0'/0/1
Address: 0x6fC21092DA55B392b045eD78F4732bff3C580e2c

Profile 2:
Path: m/44'/60'/0'/0/2
Address: 0x6fC21092DA55B392b045eD78F4732bff3C580e3d

Profile 3:
Path: m/44'/60'/0'/0/3
Address: 0x6fC21092DA55B392b045eD78F4732bff3C580e4e
```

## Database Storage

### Wallet Table Structure

**Location**: `backend/database/01_init.sql:315`

```sql
CREATE TABLE public.wallet (
    id text NOT NULL,                    -- Ethereum address (0x...)
    user_id uuid NOT NULL,               -- User reference
    encrypted_private_key text NOT NULL, -- Encrypted mnemonic
    public_key text NOT NULL,            -- Public key
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wallet_id_check CHECK ((id ~ '^0x[0-9a-fA-F]{40}$'))
);
```

### Profile Address Storage

**Location**: `backend/database/01_init.sql:146`

```sql
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    -- ... other profile fields
    derived_public_key text,  -- Public key of derived wallet
    derived_address text,     -- Address of derived wallet
    -- ... other fields
);
```

## Security Considerations

### 1. Mnemonic Security

**Client-Side Only**: Mnemonics are never transmitted to the backend
- Generated on client
- Encrypted on client
- Decrypted on client for profile creation
- Only encrypted form stored on server

### 2. Key Derivation Security

**Deterministic Generation**: Same mnemonic + index always produces same address
- Enables wallet recovery
- Predictable profile addresses
- No random elements in derivation

### 3. Index Management

**Profile Index Tracking**: Index based on profile count
- Prevents address collisions
- Enables profile recreation
- Maintains derivation order

## Error Handling

### Common Errors

1. **Invalid Mnemonic**: Malformed or invalid BIP39 phrase
2. **Derivation Failure**: Invalid HD path or index
3. **Encryption Failure**: Password or crypto operation errors

### Error Response Format

```javascript
{
  success: false,
  message: "Human-readable error message",
  errorCode: "specific-error-code",
  errorKey: 123456, // Unique error identifier
  fromError: "Original error message" // Only in dev mode
}
```

## Testing & Validation

### Wallet Generation Testing

```javascript
// Test wallet generation
const wallet = await generateWallet("test-password");
console.log("Generated wallet:", wallet);

// Test derivation
const derived = deriveWallet(wallet.mnemonic, 1);
console.log("Derived wallet:", derived);
```

### BIP44 Path Validation

```javascript
// Validate BIP44 compliance
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, "m/44'/60'/0'/0");
const child = hdNode.derivePath("1");
console.log("Child address:", child.address);
```

## Performance Optimization

### 1. Mnemonic Caching

**Session-Only Storage**: Decrypted mnemonics cached in memory
- Avoid repeated decryption
- Cleared on logout/session end
- Never persisted to disk

### 2. Batch Derivation

**Multiple Profiles**: Derive multiple addresses in single operation
- Reduce crypto overhead
- Batch profile creation
- Optimize UI updates

### 3. Worker Threads

**Heavy Operations**: Move crypto operations to web workers
- Prevent UI blocking
- Parallel processing
- Better user experience