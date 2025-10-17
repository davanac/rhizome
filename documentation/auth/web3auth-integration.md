# Web3Auth Integration Documentation

## Architecture Overview

Web3Auth provides a seamless authentication experience while maintaining the security of blockchain wallets. The integration replaces the previous mnemonic-based wallet system.

## Frontend Integration

### Web3Auth Service

The core service handles all Web3Auth interactions:

**File:** `/front/src/services/web3auth.service.js`

```javascript
class Web3AuthService {
  async init() { /* Initialize Web3Auth Modal */ }
  async login(provider) { /* Authenticate user */ }
  async logout() { /* Clear session */ }
  async signMessage(message) { /* Sign with user wallet */ }
  async getAddress() { /* Get wallet address */ }
}
```

### React Context

Provides Web3Auth state management across the app:

**File:** `/front/src/contexts/Web3AuthContext.tsx`

```typescript
interface Web3AuthContextType {
  isInitialized: boolean;
  isConnected: boolean;
  user: Web3AuthUser | null;
  login: (provider?: string) => Promise<Web3AuthUser>;
  logout: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}
```

### Component Integration

```typescript
import { useWeb3Auth } from '@/contexts/Web3AuthContext';

const MyComponent = () => {
  const { login, logout, isConnected, user } = useWeb3Auth();
  
  return (
    <div>
      {!isConnected ? (
        <button onClick={() => login('google')}>Login with Google</button>
      ) : (
        <div>
          <span>Welcome {user?.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
};
```

## Backend Integration

### Signature Verification

The backend verifies cryptographic signatures to ensure authentic user requests:

**File:** `/backend/src/services/auth.service.js`

```javascript
export const verifyAuthSignature = (walletAddress, signature, web3authId) => {
  const stored = nonceStore.get(walletAddress.toLowerCase());
  
  if (!stored || Date.now() > stored.expiryTime) {
    return false;
  }
  
  const message = `Sign this message to authenticate with Rhizome.

Nonce: ${stored.nonce}
Web3Auth ID: ${web3authId}
Timestamp: ${stored.timestamp}`;
  
  const recoveredAddress = ethers.verifyMessage(message, signature);
  
  return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
};
```

### Authentication Controller

Handles Web3Auth login requests with signature verification:

**File:** `/backend/src/controllers/auth.controller.js`

```javascript
const loginWithWeb3Auth = async (req, reply) => {
  const { web3authId, walletAddress, signature, ... } = req.body;
  
  // Verify signature before proceeding
  const result = await AuthService.loginOrRegisterWithWeb3Auth({
    web3authId,
    walletAddress,
    signature,
    // ... other fields
  });
  
  // Generate JWT tokens and return user data
};
```

## Database Schema

### Web3Auth Users Table

```sql
CREATE TABLE public.web3auth_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    web3auth_id text UNIQUE NOT NULL,
    wallet_address text NOT NULL,
    verifier text,
    verifier_id text,
    type_of_login text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
```

### Profile Updates

```sql
-- Profiles now store wallet address directly
ALTER TABLE public.profiles 
ADD COLUMN wallet_address text;

-- Remove old derived fields
ALTER TABLE public.profiles 
DROP COLUMN derived_address,
DROP COLUMN derived_public_key;
```

## Configuration

### Environment Variables

**Frontend (`.env`):**
```env
VITE_WEB3AUTH_CLIENT_ID=BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ
VITE_WEB3AUTH_NETWORK=sapphire_devnet  # or sapphire_mainnet for production
```

### Web3Auth Configuration

```javascript
const web3auth = new Web3Auth({
  clientId: CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0xaa37dc", // Optimism Sepolia
    rpcTarget: "https://sepolia.optimism.io",
    displayName: "Optimism Sepolia",
    blockExplorerUrl: "https://sepolia-optimism.etherscan.io",
    ticker: "ETH",
    tickerName: "Ethereum",
  },
  uiConfig: {
    appName: "Rhizome",
    theme: { primary: "#6366f1" },
    mode: "light",
    defaultLanguage: "fr",
  },
});
```

## API Endpoints

### Authentication Nonce

**Endpoint:** `POST /auth/auth-nonce`

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
  "nonce": "a1b2c3d4e5f6789abcdef123456789...",
  "timestamp": "2023-12-01T10:30:00.000Z"
}
```

### Web3Auth Login

**Endpoint:** `POST /auth/login`

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
      "profiles": []
    }
  },
  "isNewUser": false
}
```

## Security Features

### Nonce Management

- **Generation**: Cryptographically secure random 32-byte hex strings
- **Storage**: In-memory Map (Redis recommended for production)
- **Expiration**: 5-minute automatic expiry
- **Single Use**: Nonces are deleted after verification

### Signature Verification

- **Algorithm**: ECDSA (same as Ethereum)
- **Message Format**: Standardized format with nonce, Web3Auth ID, and timestamp
- **Verification**: Uses `ethers.verifyMessage()` to recover signer address
- **Tamper Detection**: Any modification invalidates the signature

### Replay Attack Prevention

- **Time-Limited**: Nonces expire after 5 minutes
- **Single-Use**: Each nonce can only be used once
- **Timestamp Binding**: Messages include creation timestamp

## Error Handling

### Common Errors

```javascript
// Web3Auth not initialized
{
  "success": false,
  "message": "Web3Auth not connected",
  "errorCode": "web3auth-not-connected"
}

// Invalid signature
{
  "success": false,
  "message": "Invalid signature - authentication failed", 
  "errorCode": "invalid-signature"
}

// Expired nonce
{
  "success": false,
  "message": "Nonce expired",
  "errorCode": "nonce-expired"
}
```

### Error Recovery

```javascript
try {
  const result = await loginWithWeb3Auth();
  if (result.success === false) {
    switch (result.errorCode) {
      case 'web3auth-not-connected':
        await web3AuthService.init();
        break;
      case 'nonce-expired':
        // Retry login (new nonce will be generated)
        break;
      case 'invalid-signature':
        // Show error to user
        break;
    }
  }
} catch (error) {
  console.error('Login failed:', error);
}
```

## Testing

### Frontend Testing

```javascript
// Test Web3Auth service initialization
test('initializes Web3Auth service', async () => {
  await web3AuthService.init();
  expect(web3AuthService.web3auth).toBeDefined();
});

// Test login flow
test('handles successful login', async () => {
  const user = await web3AuthService.login('google');
  expect(user.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
});
```

### Backend Testing

```javascript
// Test signature verification
test('verifies valid signature', () => {
  const isValid = verifyAuthSignature(
    walletAddress,
    validSignature,
    web3authId
  );
  expect(isValid).toBe(true);
});

// Test nonce expiration
test('rejects expired nonce', async () => {
  // Generate nonce, wait for expiry, test rejection
});
```

## Performance Considerations

### Frontend

- **Initialization**: Web3Auth initializes once on app load
- **Caching**: User info cached in React context
- **Lazy Loading**: Web3Auth modal loads on demand

### Backend

- **Nonce Storage**: Use Redis in production for horizontal scaling
- **Signature Verification**: Ethereum signature verification is fast (~1ms)
- **Database Queries**: Index wallet addresses for fast lookups

### Production Optimizations

```javascript
// Use Redis for nonce storage
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

## Monitoring & Logging

### Authentication Metrics

- Login attempts per provider
- Success/failure rates
- Average login time
- Signature verification failures

### Log Examples

```javascript
// Successful authentication
console.log(`✅ Auth success: ${walletAddress} via ${verifier}`);

// Failed signature verification  
console.log(`❌ Invalid signature: ${walletAddress} - ${error}`);

// Nonce expiration
console.log(`⏰ Expired nonce: ${walletAddress}`);
```

## Troubleshooting

### Web3Auth Modal Issues

1. **Modal not appearing**: Check Client ID and network configuration
2. **Login cancelled**: User closed modal - show appropriate message
3. **Provider errors**: Check Web3Auth dashboard for provider status

### Signature Issues

1. **Verification fails**: Ensure message format exactly matches
2. **Nonce expired**: Generate fresh nonce and retry
3. **Wrong network**: Verify Web3Auth chain configuration

### Database Issues

1. **Migration errors**: Check database user permissions
2. **Constraint violations**: Ensure wallet addresses are properly formatted
3. **Connection errors**: Verify database connection string