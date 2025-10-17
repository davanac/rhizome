# API Reference

## Overview

This document provides a comprehensive reference for all wallet-related functions, classes, and services in the Rhizome platform.

## Frontend API

### Crypto Utilities (`/front/src/utils/crypto.js`)

#### `generateWallet(password)`

Generates a new Ethereum wallet with BIP39 mnemonic phrase and encrypts it with the user's password.

**Parameters:**
- `password` (string): User's password for encryption

**Returns:**
```javascript
{
  id: string,                    // Ethereum address (0x...)
  encrypted_private_key: string, // Encrypted mnemonic
  public_key: string,            // Public key
  mnemonic: string              // Plaintext mnemonic (registration only)
}
```

**Example:**
```javascript
const wallet = await generateWallet("user-password-123");
console.log(wallet.id); // "0x742d35Cc6634C0532925a3b8D456ba"
```

#### `deriveWallet(mnemonic, index)`

Derives a child wallet from the master mnemonic using BIP44 path.

**Parameters:**
- `mnemonic` (string): BIP39 mnemonic phrase
- `index` (number): Profile index (0, 1, 2, ...)

**Returns:**
```javascript
{
  id: string,        // Address.index format
  public_key: string // Public key
}
```

**Example:**
```javascript
const derived = deriveWallet(mnemonic, 1);
console.log(derived.id); // "0x742d35Cc6634C0532925a3b8D456ba.1"
```

#### `encrypt(mnemonic, password)`

Encrypts a mnemonic phrase using PBKDF2 key derivation and AES-GCM encryption.

**Parameters:**
- `mnemonic` (string): BIP39 mnemonic phrase
- `password` (string): User's password

**Returns:**
```javascript
string // "IV.SALT.ENCRYPTED_DATA" format
```

**Example:**
```javascript
const encrypted = await encrypt(mnemonic, "password");
console.log(encrypted); // "dGVzdA==.0x1234...89AB.ZW5jcnlwdA=="
```

#### `decrypt(encryptedData, password)`

Decrypts an encrypted mnemonic phrase.

**Parameters:**
- `encryptedData` (string): Encrypted mnemonic in "IV.SALT.ENCRYPTED_DATA" format
- `password` (string): User's password

**Returns:**
```javascript
string // Decrypted mnemonic phrase
```

**Error Format:**
```javascript
{
  success: false,
  message: string,
  errorCode: string,
  errorKey: number,
  fromError?: string
}
```

**Example:**
```javascript
const decrypted = await decrypt(encryptedData, "password");
console.log(decrypted); // "abandon abandon abandon..."
```

#### `signMessage(mnemonic, profileIndex, message)`

Signs a message using a derived profile wallet.

**Parameters:**
- `mnemonic` (string): BIP39 mnemonic phrase
- `profileIndex` (number): Profile index for key derivation
- `message` (string|Uint8Array): Message to sign

**Returns:**
```javascript
string // ECDSA signature
```

**Example:**
```javascript
const signature = await signMessage(mnemonic, 1, "Hello World");
console.log(signature); // "0x1234567890abcdef..."
```

#### `verifySignature(message, signature, expectedAddress)`

Verifies a message signature against an expected address.

**Parameters:**
- `message` (string): Original message
- `signature` (string): ECDSA signature
- `expectedAddress` (string): Expected signer address

**Returns:**
```javascript
boolean // true if signature is valid
```

**Example:**
```javascript
const isValid = verifySignature("Hello World", signature, "0x742d35...");
console.log(isValid); // true
```

### Authentication Controller (`/front/src/network/api/controllers/auth.controller.js`)

#### `register({ email, password })`

Registers a new user with wallet generation.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:**
```javascript
{
  user: object,     // User data
  wallet: object,   // Wallet data with mnemonic
  error: object|null
}
```

**Example:**
```javascript
const result = await register({
  email: "user@example.com",
  password: "secure-password"
});
```

#### `login({ email, password })`

Authenticates a user and retrieves their session.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:**
```javascript
{
  user: object,     // User data
  error: object|null
}
```

#### `logout()`

Clears the user session.

**Returns:**
```javascript
void
```

### Profiles Controller (`/front/src/network/api/controllers/profiles.controller.js`)

#### `makeNewProfile({ payload, getSession, setInSession })`

Creates a new profile with derived wallet address.

**Parameters:**
- `payload` (object): Profile creation data
- `getSession` (function): Session getter function
- `setInSession` (function): Session setter function

**Returns:**
```javascript
{
  success: boolean,
  profile?: object,
  error?: object
}
```

**Example:**
```javascript
const result = await makeNewProfile({
  payload: {
    profile: {
      firstName: "John",
      lastName: "Doe",
      password: "user-password"
    }
  },
  getSession,
  setInSession
});
```

## Backend API

### Auth Service (`/backend/src/services/auth.service.js`)

#### `register(email, hashedPassword, wallet)`

Registers a new user and stores their wallet data.

**Parameters:**
- `email` (string): User's email address
- `hashedPassword` (string): SHA256 hashed password
- `wallet` (object): Wallet data object

**Returns:**
```javascript
{
  success: boolean,
  user?: object,
  auth?: object,
  error?: object
}
```

#### `getWallet(userId)`

Retrieves wallet data for a specific user.

**Parameters:**
- `userId` (string): User UUID

**Returns:**
```javascript
{
  id: string,
  encrypted_private_key: string,
  public_key: string,
  created_at: string
}
```

### Blockchain Service (`/backend/src/services/blockchain.service.js`)

#### `getNFT(contractAddress, tokenId)`

Retrieves NFT metadata from a smart contract.

**Parameters:**
- `contractAddress` (string): NFT contract address
- `tokenId` (string): Token ID

**Returns:**
```javascript
{
  owner: string,
  metadataURI: string,
  decodedMetadata: string
}
```

#### `registerProject(projectUrl, projectHash, participants, signatures)`

Registers a project on the blockchain with participant signatures.

**Parameters:**
- `projectUrl` (string): Project URL
- `projectHash` (string): Project hash
- `participants` (string[]): Participant addresses
- `signatures` (string[]): Participant signatures

**Returns:**
```javascript
{
  success: boolean,
  transactionHash?: string,
  error?: object
}
```

## Database Schema

### Wallet Table

```sql
CREATE TABLE public.wallet (
    id text NOT NULL,                    -- Ethereum address
    user_id uuid NOT NULL,               -- User reference
    encrypted_private_key text NOT NULL, -- Encrypted mnemonic
    public_key text NOT NULL,            -- Public key
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wallet_id_check CHECK ((id ~ '^0x[0-9a-fA-F]{40}$'))
);
```

### Profiles Table

```sql
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    -- ... other profile fields
    derived_public_key text,  -- Profile public key
    derived_address text,     -- Profile address
    -- ... other fields
);
```

### Project Participants Table

```sql
CREATE TABLE public.project_participants (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    role_id integer NOT NULL,
    contribution integer DEFAULT 0,
    contribution_description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_signed boolean DEFAULT false,
    signature text,                      -- ECDSA signature
    signed_at timestamp with time zone,
    nft_address text,
    nft_token_id text,
    nft_token_uri text
);
```

## Error Codes

### Common Error Codes

| Code | Description | Location |
|------|-------------|----------|
| `sign-message-error` | Message signing failed | crypto.js:36 |
| `verify-signature-error` | Signature verification failed | crypto.js:54 |
| `invalid-iv` | Invalid initialization vector | crypto.js:118 |
| `invalid-encrypted-mnemonic` | Invalid encrypted data | crypto.js:136 |
| `import-key-error` | Key import failed | crypto.js:156 |
| `decrypt-error` | Decryption failed | crypto.js:192 |
| `wallet-derivation-error` | Wallet derivation failed | crypto.js:250 |
| `login-error` | Login failed | auth.controller.js:59 |
| `register-error` | Registration failed | auth.controller.js:142 |
| `check-email-error` | Email check failed | auth.controller.js:95 |
| `fetch-wallet-error` | Wallet retrieval failed | profiles.controller.js:66 |

### Error Response Format

```javascript
{
  success: false,
  message: string,        // Human-readable error message
  errorCode: string,      // Specific error code
  errorKey: number,       // Unique error identifier
  fromError?: string      // Original error (dev mode only)
}
```

## Constants

### Cryptographic Constants

```javascript
const CRYPTO_CONSTANTS = {
  PBKDF2_ITERATIONS: 100000,
  AES_KEY_LENGTH: 256,
  IV_LENGTH: 12,
  SALT_LENGTH: 16,
  BIP44_PATH: "m/44'/60'/0'/0",
  ETHEREUM_COIN_TYPE: 60
};
```

### Network Constants

```javascript
const NETWORK_CONSTANTS = {
  OPTIMISM_SEPOLIA: {
    chainId: 11155420,
    rpcUrl: "https://sepolia.optimism.io"
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org"
  },
  ETHEREUM_SEPOLIA: {
    chainId: 11155111,
    rpcUrl: "https://sepolia.infura.io/v3/..."
  }
};
```

## Usage Examples

### Complete Registration Flow

```javascript
// 1. Register user with wallet
const registrationResult = await register({
  email: "user@example.com",
  password: "secure-password"
});

// 2. Display mnemonic to user
if (registrationResult.wallet) {
  console.log("Save this mnemonic:", registrationResult.wallet.mnemonic);
}

// 3. Create first profile
const profileResult = await makeNewProfile({
  payload: {
    profile: {
      firstName: "John",
      lastName: "Doe",
      password: "secure-password"
    }
  },
  getSession,
  setInSession
});
```

### Message Signing Flow

```javascript
// 1. Get decrypted mnemonic
const wallet = await getWallet();
const mnemonic = await decrypt(wallet.encrypted_private_key, password);

// 2. Sign project participation
const participationMessage = {
  projectId: "proj-123",
  participantAddress: profile.derived_address,
  role: "contributor",
  timestamp: Date.now()
};

const messageHash = ethers.keccak256(
  ethers.toUtf8Bytes(JSON.stringify(participationMessage))
);

const signature = await signMessage(mnemonic, profile.index, messageHash);

// 3. Verify signature
const isValid = verifySignature(
  messageHash,
  signature,
  profile.derived_address
);
```

### Profile Creation Flow

```javascript
// 1. Fetch user wallet
const fetchedWallet = await getWallet();

// 2. Decrypt mnemonic
const decryptedMnemonic = await decrypt(
  fetchedWallet.encrypted_private_key,
  userPassword
);

// 3. Derive new profile wallet
const profileIndex = user.profiles.length + 1;
const newWallet = deriveWallet(decryptedMnemonic, profileIndex);

// 4. Create profile with derived address
const profileData = {
  firstName: "Jane",
  lastName: "Doe",
  derivedAddress: newWallet.id.split('.')[0],
  derivedPublicKey: newWallet.public_key
};
```