# Authentication API Reference

## Overview

This document provides detailed API specifications for the Web3Auth authentication system in Rhizome.

## Base URL

```
http://localhost:3000/auth  # Development
https://api.rhizome.xyz/auth  # Production
```

## Authentication Endpoints

### Generate Authentication Nonce

Generate a unique nonce for cryptographic authentication challenge.

**Endpoint:** `POST /auth-nonce`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "walletAddress": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "nonce": "a1b2c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890",
  "timestamp": "2023-12-01T10:30:00.000Z",
  "messageTemplate": "Sign this message to authenticate with Rhizome.\n\nNonce: {nonce}\nWeb3Auth ID: {web3authId}\nTimestamp: {timestamp}"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Wallet address required",
  "errorKey": 164407
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid wallet address format",
  "errorKey": 164408
}
```

**Validation:**
- `walletAddress` must be a valid Ethereum address (0x + 40 hex characters)
- Rate limited to 5 requests per minute per IP

**Nonce Properties:**
- **Uniqueness**: Cryptographically secure random 32-byte hex string
- **Expiration**: 5 minutes from generation
- **Single Use**: Invalidated after successful authentication

---

### Web3Auth Login

Authenticate user with Web3Auth credentials and cryptographic signature.

**Endpoint:** `POST /login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "web3authId": "user@gmail.com",
  "walletAddress": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D",
  "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
  "email": "user@gmail.com",
  "name": "John Doe",
  "profileImage": "https://example.com/avatar.jpg",
  "verifier": "google",
  "typeOfLogin": "google"
}
```

**Required Fields:**
- `web3authId`: Unique identifier from Web3Auth
- `walletAddress`: Ethereum wallet address
- `signature`: ECDSA signature of authentication message

**Optional Fields:**
- `email`: User email address
- `name`: User display name
- `profileImage`: Avatar URL
- `verifier`: OAuth provider used (google, facebook, etc.)
- `typeOfLogin`: Type of authentication method

**Response (Success - 200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@gmail.com",
      "walletAddress": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D",
      "isAdmin": false,
      "profiles": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "username": "johndoe",
          "avatar_url": "https://example.com/avatar.jpg",
          "wallet_address": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D"
        }
      ],
      "primaryProfile": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "johndoe",
        "type": "individual"
      }
    }
  },
  "isNewUser": true
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Missing Web3Auth credentials or signature",
  "errorKey": 164406
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "message": "Invalid signature - authentication failed",
  "errorKey": 182540,
  "errorCode": "invalid-signature"
}
```

**Signature Verification Process:**

1. **Retrieve Nonce**: Backend finds stored nonce for wallet address
2. **Reconstruct Message**: Creates exact message that should have been signed:
   ```
   Sign this message to authenticate with Rhizome.

   Nonce: a1b2c3d4e5f6789abcdef...
   Web3Auth ID: user@gmail.com
   Timestamp: 2023-12-01T10:30:00.000Z
   ```
3. **Verify Signature**: Uses `ethers.verifyMessage()` to recover signer address
4. **Compare Addresses**: Recovered address must match `walletAddress`
5. **Invalidate Nonce**: Used nonce is immediately deleted

---

### Legacy Email/Password Login

**⚠️ Deprecated:** This endpoint is maintained for backward compatibility but should not be used for new development.

**Endpoint:** `POST /login`

**Request Body (Legacy):**
```json
{
  "hashedEmail": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "hashedPassword": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

**Response:**
```json
{
  "success": false,
  "message": "Please use Web3Auth for authentication",
  "errorCode": "use-web3auth"
}
```

---

## Token Management

### Refresh Token

Renew expired access token using refresh token.

**Endpoint:** `POST /refresh-token`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {refreshToken}
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@gmail.com",
      "isAdmin": false
    }
  }
}
```

---

### Logout

Invalidate user session and tokens.

**Endpoint:** `POST /logout`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Information Endpoints

### Get Current User

Retrieve current user information using access token.

**Endpoint:** `GET /me`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@gmail.com",
    "walletAddress": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D",
    "isAdmin": false,
    "profiles": [],
    "primaryProfile": null
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Unauthorized",
  "errorCode": "invalid-token"
}
```

---

## Legacy Wallet Endpoints

### Get Wallet (Deprecated)

**⚠️ Deprecated:** This endpoint returns Web3Auth user information instead of encrypted wallet data.

**Endpoint:** `GET /wallet`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "web3auth": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "web3auth_id": "user@gmail.com",
    "wallet_address": "0x742d35Cc6669Ba39C4cCe90D6C5E4D7C5E5e8b5D",
    "verifier": "google",
    "type_of_login": "google",
    "created_at": "2023-12-01T10:30:00.000Z"
  }
}
```

---

## Email Validation

### Check Email Availability

**Endpoint:** `GET /check-email-available/:email`

**Parameters:**
- `email`: Email address to check

**Response (Available):**
```json
{
  "success": true,
  "available": true,
  "message": "Email is available"
}
```

**Response (Taken):**
```json
{
  "success": false,
  "available": false,
  "message": "Email already exists",
  "errorCode": "email-already-exists"
}
```

---

## Error Codes Reference

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `invalid-signature` | Signature verification failed | 500 |
| `nonce-expired` | Authentication nonce has expired | 400 |
| `nonce-not-found` | No nonce found for wallet address | 400 |
| `invalid-wallet-address` | Wallet address format is invalid | 400 |
| `missing-credentials` | Required authentication data missing | 400 |
| `web3auth-not-connected` | Web3Auth service not initialized | 500 |
| `invalid-token` | JWT token is invalid or expired | 401 |
| `email-already-exists` | Email address already registered | 400 |
| `use-web3auth` | Legacy method, use Web3Auth instead | 400 |

---

## Rate Limiting

### Authentication Endpoints

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `POST /auth-nonce` | 5 requests | 1 minute |
| `POST /login` | 10 requests | 1 minute |
| `POST /refresh-token` | 20 requests | 1 minute |

### Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1638360000
```

---

## SDK Usage Examples

### Frontend (JavaScript)

```javascript
import { loginWithWeb3Auth, getAuthNonce } from '@api/controllers/auth.controller';

// Authenticate user
const user = await loginWithWeb3Auth('google');

// Manual nonce usage
const nonce = await getAuthNonce(walletAddress);
const signature = await signMessage(authMessage);
const result = await loginRequest(null, null, {
  web3authId,
  walletAddress,
  signature,
  // ... other fields
});
```

### Backend (Node.js)

```javascript
import { verifyAuthSignature, generateAuthNonce } from '#services/auth.service.js';

// Generate nonce
const { nonce, timestamp } = generateAuthNonce(walletAddress);

// Verify signature
const isValid = verifyAuthSignature(walletAddress, signature, web3authId);
```

---

## Testing

### Authentication Flow Test

```javascript
describe('Web3Auth Authentication', () => {
  test('complete authentication flow', async () => {
    // 1. Request nonce
    const nonceResponse = await request(app)
      .post('/auth/auth-nonce')
      .send({ walletAddress });
    
    expect(nonceResponse.status).toBe(200);
    expect(nonceResponse.body.nonce).toBeDefined();
    
    // 2. Sign message and authenticate
    const signature = signMessage(authMessage, privateKey);
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        web3authId,
        walletAddress,
        signature,
        // ... other fields
      });
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.accessToken).toBeDefined();
  });
});
```

---

## Security Considerations

### Message Signing

The authentication message format is standardized and must be followed exactly:

```
Sign this message to authenticate with Rhizome.

Nonce: {nonce}
Web3Auth ID: {web3authId}
Timestamp: {timestamp}
```

Any deviation will cause signature verification to fail.

### Nonce Management

- Nonces are single-use and automatically expire after 5 minutes
- Failed authentication attempts do not consume nonces
- Successful authentication immediately invalidates the nonce

### Token Security

- Access tokens expire after 77 days (configurable)
- Refresh tokens are stored server-side and can be revoked
- All sensitive operations require valid access tokens

### Production Deployment

- Use Redis for nonce storage in production
- Implement proper rate limiting
- Enable HTTPS for all endpoints
- Monitor authentication failures
- Set up proper logging and alerting