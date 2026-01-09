# Rhizome Backend

## Overview

Rhizome backend is a Fastify-based Node.js application that provides API endpoints for the blockchain-based collaborative project management platform. It handles user authentication via Web3Auth, project management, and blockchain interactions.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

3. **Database Setup**
   ```bash
   docker-compose up -d  # Start PostgreSQL
   npm run db:migrate    # Run database migrations (if available)
   ```

4. **Start Development Server**
   ```bash
   npm run dev  # Starts with nodemon for auto-reload
   ```

## Environment Configuration

See `.env.example` for all required environment variables. Key configurations:

- `NODE_ENV`: Set to `development`, `production`, or `remote`
- `DATABASE_URL`: PostgreSQL connection string
- `BLOCKCHAIN_ENV`: Choose your blockchain network
- `JWT_SECRET`: Secret for JWT token signing

## Wallet Management

The application uses a server-side wallet for blockchain operations with an encrypted key storage system.

### How It Works

1. **Encrypted Storage**: Private keys are encrypted using AES-256-CBC encryption
2. **Key Derivation**: Passwords are hashed using SHA-256 for key derivation
3. **Secure Location**: Keys are stored outside the project directory by default
4. **Environment Configuration**: File location and passwords are configurable via environment variables

### Initial Wallet Setup

1. **Create Wallet Key Storage**
   ```bash
   # The cfr.json file will be created automatically in ~/.rhizome/ 
   # when you first encrypt a key, or use CFR_FILE_PATH to specify location
   ```

2. **Add a Private Key**
   ```javascript
   // Use the KeyUtils to encrypt and store your private key
   import { setKey } from './src/config/keyutils.js';
   
   const password = "your-secure-password";
   const privateKey = "0x1234567890abcdef..."; // Your actual private key
   const keyIdentifier = "rhizome.yourdomain.eth"; // Identifier for this key
   
   setKey(password, privateKey, keyIdentifier);
   ```

3. **Configure Environment Variables**
   ```bash
   # In your .env file
   PK=rhizome.yourdomain.eth  # The key identifier
   PASSWORD=your-secure-password
   
   # Optional: Custom file location
   CFR_FILE_PATH=/path/to/secure/cfr.json
   ```

### Managing Keys

#### Adding a New Key
```javascript
import { setKey } from './src/config/keyutils.js';

setKey("password", "new-private-key", "new-key-identifier");
```

#### Retrieving a Key
```javascript
import { getKey } from './src/config/keyutils.js';

const privateKey = getKey("password", "key-identifier");
```

#### Removing a Key
Manually edit the `cfr.json` file to remove unwanted key entries, or create a new file.

### Security Best Practices

1. **Strong Passwords**: Use long, complex passwords for key encryption
2. **Secure Storage**: Keep `cfr.json` in a secure location outside the project
3. **Environment Variables**: Never commit passwords or file paths to version control
4. **Access Control**: Limit file system access to the `cfr.json` file
5. **Backup**: Securely backup your encrypted key file and passwords
6. **Rotation**: Consider periodic key rotation for enhanced security

### File Structure
```
~/.rhizome/          # Default secure location
└── cfr.json         # Encrypted key storage
```

OR custom location:
```
/custom/path/
└── cfr.json         # Encrypted key storage (via CFR_FILE_PATH)
```

### Security Notes

- The `cfr.json` file is automatically excluded from git via `.gitignore`
- Private keys are never stored in plain text
- Passwords are only used for encryption/decryption operations
- Default storage location is outside the project directory for added security

## Smart Contract Deployment

1. **Compile Contracts**
   ```bash
   npx hardhat compile
   ```

2. **Deploy to Network**
   ```bash
   PASSWORD=your-password npx hardhat run src/web3/scripts/deploy.js --network sepolia_optimism
   ```

3. **Available Networks**
   - `localhost` - Local development
   - `sepolia` - Ethereum Sepolia testnet
   - `sepolia_optimism` - Optimism Sepolia testnet  
   - `sepolia_base` - Base Sepolia testnet
   - `optimism` - Optimism mainnet

## API Endpoints

### Authentication
- `POST /api/auth/login` - Web3Auth login with signature verification
- `POST /api/auth/logout` - Logout and invalidate session

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project

### Blockchain
- `POST /api/blockchain/register` - Register project on blockchain
- `GET /api/blockchain/nfts/:projectId` - Get NFTs for project
- `POST /api/blockchain/whitelist` - Manage blockchain whitelist

### Profiles
- `GET /api/profiles/:id` - Get user profile
- `PUT /api/profiles/:id` - Update user profile

## Database Schema

Key tables:
- `users` - User accounts
- `web3auth_users` - Web3Auth integration data
- `projects` - Project information
- `participants` - Project participants and NFT data
- `profiles` - User profiles with wallet addresses

## Development

### Commands
```bash
npm run dev        # Development server with auto-reload
npm run start      # Production server
npm run lint       # Run ESLint
npm run test       # Run tests (if available)
```

### Testing Smart Contracts
```bash
npx hardhat test                           # Run all tests
npx hardhat test test/ProjectsRegistry.test.js  # Run specific test
npx hardhat coverage                       # Test coverage
```

## Architecture

- **Framework**: Fastify for high-performance HTTP server
- **Database**: PostgreSQL with raw SQL queries
- **Authentication**: JWT tokens with Web3Auth integration
- **Blockchain**: ethers.js for smart contract interaction
- **Security**: Cryptographic signature verification for authentication
- **File Structure**: Modular organization with controllers, services, and routes
