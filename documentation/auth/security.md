# Secure Web3Auth Authentication Flow

## Overview

The authentication system now uses cryptographic signatures to verify user identity, preventing spoofing attacks where malicious users could impersonate others by simply sending fake wallet addresses.

## Security Features

### 1. **Nonce-Based Authentication**
- Each login attempt requires a unique, time-limited nonce
- Nonces expire after 5 minutes
- Used nonces are immediately invalidated to prevent replay attacks

### 2. **Cryptographic Signature Verification**
- Users must sign a specific message with their Web3Auth wallet
- Backend verifies the signature matches the claimed wallet address
- Impossible to fake without the actual private key

### 3. **Time-Limited Challenges**
- Authentication challenges expire after 5 minutes
- Prevents stale signature reuse

## Authentication Flow

### Step 1: User Initiates Login
```javascript
// Frontend
const result = await loginWithWeb3Auth();
```

### Step 2: Web3Auth Login
```javascript
// User authenticates with Web3Auth (Google, email, etc.)
const web3AuthUser = await web3AuthService.login();
// Returns: { address, web3authId, email, name, ... }
```

### Step 3: Request Authentication Nonce
```javascript
// Frontend requests nonce from backend
POST /auth/auth-nonce
{
  "walletAddress": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D"
}

// Backend responds with:
{
  "success": true,
  "nonce": "a1b2c3d4e5f6...",
  "timestamp": "2023-12-01T10:30:00.000Z"
}
```

### Step 4: Sign Authentication Message
```javascript
// Frontend creates standardized message
const message = `Sign this message to authenticate with Rhizome.

Nonce: ${nonce}
Web3Auth ID: ${web3authId}
Timestamp: ${timestamp}`;

// User signs with Web3Auth
const signature = await web3AuthService.signMessage(message);
```

### Step 5: Verify & Authenticate
```javascript
// Frontend sends signed authentication
POST /auth/login
{
  "web3authId": "user@gmail.com",
  "walletAddress": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D",
  "signature": "0x1234...",
  "email": "user@gmail.com",
  "name": "John Doe",
  "verifier": "google",
  "typeOfLogin": "google"
}

// Backend:
// 1. Retrieves stored nonce for wallet address
// 2. Recreates the exact message that should have been signed
// 3. Verifies signature using ethers.verifyMessage()
// 4. Checks recovered address matches claimed address
// 5. Creates/updates user in database
// 6. Returns JWT tokens
```

## Backend Security Implementation

### Nonce Storage
```javascript
// In-memory store (use Redis in production)
const nonceStore = new Map();

// Nonce structure:
{
  nonce: "random_32_byte_hex",
  timestamp: "2023-12-01T10:30:00.000Z", 
  expiryTime: 1701428100000 // 5 minutes from creation
}
```

### Signature Verification
```javascript
export const verifyAuthSignature = (walletAddress, signature, web3authId) => {
  const stored = nonceStore.get(walletAddress.toLowerCase());
  
  // Check nonce exists and hasn't expired
  if (!stored || Date.now() > stored.expiryTime) {
    return false;
  }
  
  // Recreate exact message
  const message = `Sign this message to authenticate with Rhizome.

Nonce: ${stored.nonce}
Web3Auth ID: ${web3authId}
Timestamp: ${stored.timestamp}`;
  
  // Verify signature
  const recoveredAddress = ethers.verifyMessage(message, signature);
  
  // Clean up used nonce
  nonceStore.delete(walletAddress.toLowerCase());
  
  return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
};
```

## Attack Prevention

### 1. **Replay Attack Prevention**
- **Problem**: Attacker intercepts a valid signature and reuses it
- **Solution**: Nonces are single-use and expire after 5 minutes

### 2. **Impersonation Prevention**
- **Problem**: Attacker claims to own someone else's wallet address
- **Solution**: Must provide valid signature proving ownership of private key

### 3. **Man-in-the-Middle Prevention**
- **Problem**: Attacker intercepts and modifies authentication data
- **Solution**: Any modification invalidates the cryptographic signature

### 4. **Time-Based Attacks**
- **Problem**: Attacker uses old signatures or tries to predict nonces
- **Solution**: Time-limited nonces with cryptographically secure randomness

## Error Handling

### Common Error Responses

```javascript
// No nonce found (expired or never requested)
{
  "success": false,
  "message": "Invalid signature - authentication failed",
  "errorCode": "invalid-signature"
}

// Signature verification failed
{
  "success": false, 
  "message": "Invalid signature - authentication failed",
  "errorCode": "invalid-signature"
}

// Missing required fields
{
  "success": false,
  "message": "Missing Web3Auth credentials or signature",
  "errorKey": 164406
}
```

## API Endpoints

### POST `/auth/auth-nonce`
Generate authentication nonce for wallet address.

**Request:**
```json
{
  "walletAddress": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D"
}
```

**Response:**
```json
{
  "success": true,
  "nonce": "a1b2c3d4e5f6789...",
  "timestamp": "2023-12-01T10:30:00.000Z"
}
```

### POST `/auth/login`
Authenticate with Web3Auth and signature.

**Request:**
```json
{
  "web3authId": "user@gmail.com",
  "walletAddress": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D", 
  "signature": "0x1234567890abcdef...",
  "email": "user@gmail.com",
  "name": "John Doe",
  "verifier": "google",
  "typeOfLogin": "google"
}
```

**Response:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "userId": "uuid-here",
      "email": "user@gmail.com",
      "walletAddress": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D",
      "profiles": [...]
    }
  },
  "isNewUser": false
}
```

## Production Considerations

### 1. **Nonce Storage**
Replace in-memory Map with Redis for scalability:
```javascript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export const generateAuthNonce = async (walletAddress) => {
  const nonce = crypto.randomBytes(32).toString('hex');
  const timestamp = new Date().toISOString();
  
  await redis.setex(
    `nonce:${walletAddress.toLowerCase()}`,
    300, // 5 minutes
    JSON.stringify({ nonce, timestamp })
  );
  
  return { nonce, timestamp };
};
```

### 2. **Rate Limiting**
Add rate limiting to nonce generation:
```javascript
app.register(require('@fastify/rate-limit'), {
  max: 5, // 5 requests per minute per IP
  timeWindow: '1 minute'
});
```

### 3. **Monitoring**
Log authentication attempts:
```javascript
console.log(`Auth attempt: ${walletAddress} via ${verifier} - ${success ? 'SUCCESS' : 'FAILED'}`);
```

## Security Benefits

1. **Cryptographically Secure**: Uses the same ECDSA signatures that secure Ethereum
2. **Non-Repudiation**: Only the private key owner can create valid signatures  
3. **Replay Protection**: Each authentication uses a unique, time-limited challenge
4. **Tamper Detection**: Any modification to signed data invalidates the signature
5. **Zero Secrets**: No shared secrets or API keys that can be compromised

This implementation ensures that only users who actually control a wallet address can authenticate as that user, making impersonation attacks cryptographically impossible.