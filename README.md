# Rhizome Protocol

**Blockchain-based collaborative project management with NFT minting capabilities**

Rhizome is a decentralized platform that combines project management with blockchain technology, 
enabling teams to collaborate on projects while minting NFTs for participants. 
Built with modern web technologies and deployed on Ethereum Layer 2 networks.

---

## 🌟 Features

- **🔐 Web3Auth Integration** - Seamless social login (Google, Email, Facebook) with non-custodial wallet management
- **📋 Project Management** - Create and manage collaborative projects on-chain
- **🎨 NFT Minting** - Automatically mint participant NFTs for project contributors
- **🔗 Multi-Chain Support** - Deploy on Optimism, Base, and Ethereum
- **🛡️ Cryptographic Security** - Signature verification and nonce-based authentication
- **⚡ Modern Stack** - React + TypeScript frontend, Fastify backend, Solidity smart contracts

---

## 🚀 Quick Start with Docker

The easiest way to test Rhizome locally is using Docker Compose:

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)

### Running with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/rhizome.git
   cd rhizome
   ```

2. **Configure environment variables**
   ```bash
   # Root .env for docker-compose
   cp .env.example .env

   # Optional: .env.docker files for individual service configuration
   cp backend/.env.docker.example backend/.env.docker
   cp front/.env.docker.example front/.env.docker
   ```

   Edit `.env` and add your Web3Auth Client ID:
   ```env
   VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
   VITE_WEB3AUTH_NETWORK=sapphire_devnet
   ```

   Get your free Web3Auth Client ID from [dashboard.web3auth.io](https://dashboard.web3auth.io)

   > **Note**: The root `.env` file is sufficient for most users. The `.env.docker` files in `backend/` and `front/` are only needed if you want to customize service-specific settings.

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database (port 5432)
   - Backend API (port 3000)
   - Frontend application (port 8000)

4. **Access the application**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:3000

5. **View logs**
   ```bash
   docker-compose logs -f
   ```

6. **Stop services**
   ```bash
   docker-compose down
   ```

### Docker Configuration

The docker-compose setup includes:
- **Environment Variables**: Configuration via `.env` file (copy from `.env.example`)
- **Test credentials**: `rhizome/rhizome` for PostgreSQL
- **Auto-migrations**: Database schema is automatically migrated on startup
- **Test wallet**: A testnet wallet is auto-generated on first run
- **Web3Auth**: Uses your Client ID from `.env` file
- **Persistent storage**: Data is preserved in named volumes

> ⚠️ **Security Warning**: The default configuration uses test credentials and should **NOT** be used in production. Never commit your `.env` file to version control.

---

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn-ui
- **Authentication**: Web3Auth (MPC-based wallet)
- **State Management**: React Query
- **Web3**: ethers.js

### Backend
- **Runtime**: Node.js 20
- **Framework**: Fastify
- **Database**: PostgreSQL 17
- **Authentication**: JWT + cryptographic signatures
- **Web3**: ethers.js for contract interaction

### Blockchain
- **Smart Contracts**: Solidity
- **Networks**: Optimism Sepolia, Base Sepolia, Ethereum Sepolia
- **Contracts**:
  - `ProjectsRegistry.sol` - Project management
  - `RhizomeNFT.sol` - ERC-721 participant NFTs

---

## 📖 Development

### Local Development Setup

#### Prerequisites
- Node.js 20+
- PostgreSQL 17
- Git

#### Frontend Development

```bash
cd front
npm install
npm run dev
```

**Environment variables** (`.env`):
```env
VITE_API_URL=http://localhost:3000
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
VITE_WEB3AUTH_NETWORK=sapphire_devnet
```

Get your Web3Auth Client ID from [dashboard.web3auth.io](https://dashboard.web3auth.io)

#### Backend Development

```bash
cd backend
npm install

# Start PostgreSQL
docker-compose up database -d

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

**Environment variables** (`.env`):
```env
# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secure_jwt_secret

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=rhizome
DB_PASS=rhizome
DB_NAME=rhizome

# Blockchain
BLOCKCHAIN_ENV=sepolia_optimism
SEPOLIA_OPTIMISM_TESTNET_RPC_URL=https://sepolia.optimism.io
SEPOLIA_OPTIMISM_TESTNET_CHAIN_ID=11155420

# Web3Auth
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
VITE_WEB3AUTH_NETWORK=sapphire_devnet

# Wallet (for blockchain operations)
CFR_FILE_PATH=.rhizome/cfr.json
MASTER_KEY_PASSWORD=your_secure_password
MASTER_KEY_ID=rhizome.dev
```

#### Smart Contract Development

```bash
cd backend

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to testnet
npx hardhat run src/web3/scripts/deploy.js --network sepolia_optimism
```

### Project Structure

```
rhizome/
├── front/                  # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Web3Auth)
│   │   ├── pages/         # Page components
│   │   └── utils/         # API client, crypto utils
│   └── Dockerfile
├── backend/               # Fastify backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # Business logic
│   │   ├── database/      # DB queries
│   │   └── web3/          # Smart contracts & scripts
│   ├── migrations/        # Database migration files
│   └── Dockerfile
├── documentation/         # Comprehensive docs
│   ├── auth/             # Authentication guides
│   └── wallet/           # Legacy docs (deprecated)
└── docker-compose.yml    # Docker orchestration
```

---

## 🚢 Production Deployment

### Production Checklist

- [ ] Generate secure JWT secret
- [ ] Configure production database credentials
- [ ] Set up Web3Auth production client
- [ ] Configure blockchain RPC endpoints
- [ ] Set up SSL/TLS certificates
- [ ] Configure environment-specific variables
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Review and update CORS settings
- [ ] Secure wallet private keys

### Environment Variables (Production)

#### Frontend
```env
VITE_API_URL=https://api.yourdomain.com
VITE_WEB3AUTH_CLIENT_ID=your_production_client_id
VITE_WEB3AUTH_NETWORK=sapphire_mainnet
```

#### Backend
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=your_secure_random_jwt_secret_min_32_chars

# Database (use strong credentials)
DB_HOST=your_db_host
DB_PORT=5432
DB_USER=rhizome_prod
DB_PASS=strong_random_password
DB_NAME=rhizome_prod

# Blockchain (use mainnet RPC)
BLOCKCHAIN_ENV=optimism_mainnet
OPTIMISM_MAINNET_RPC_URL=https://mainnet.optimism.io
OPTIMISM_MAINNET_CHAIN_ID=10

# Web3Auth (production)
VITE_WEB3AUTH_CLIENT_ID=your_production_client_id
VITE_WEB3AUTH_NETWORK=sapphire_mainnet

# Wallet (secure storage)
CFR_FILE_PATH=/secure/path/cfr.json
MASTER_KEY_PASSWORD=very_strong_password_min_32_chars
MASTER_KEY_ID=rhizome.production.v1
```

### Docker Production Deployment

1. **Update docker-compose.yml** with production values
2. **Build images**:
   ```bash
   docker-compose build
   ```
3. **Deploy**:
   ```bash
   docker-compose up -d
   ```

### Recommended Production Setup

- **Reverse Proxy**: nginx or Caddy with SSL/TLS
- **Database**: Managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- **Monitoring**: Prometheus + Grafana
- **Logging**: Centralized logging (ELK, Loki, etc.)
- **Secrets**: Use Docker secrets or environment variable injection
- **Backups**: Automated database backups
- **Container Orchestration**: Consider Kubernetes for scalability

---

## 📚 Documentation

Comprehensive documentation is available in the `/documentation` folder:

- **[Authentication Guide](documentation/auth/README.md)** - Web3Auth integration
- **[Security Documentation](documentation/auth/security.md)** - Cryptographic verification
- **[API Reference](documentation/auth/api-reference.md)** - Endpoint documentation
- **[Migration Guide](documentation/auth/migration-guide.md)** - System migration details
- **[Development Guidelines](CLAUDE.md)** - Development best practices

---

## 🧪 Testing

### Smart Contract Tests
```bash
cd backend
npx hardhat test
```

### Frontend/Backend Tests
> Unit tests coming soon

---

## 🤝 Support

Need help or found a bug?

- **Email**: [Coming Soon]
- **Discord**: [Coming Soon]
- **Issues**: Report bugs via GitHub Issues

---

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See [LICENSE](LICENSE) for the full license text.

### What this means:

- ✅ You can use, modify, and distribute this software
- ✅ You can use it for commercial purposes
- ⚠️ You must disclose the source code of any modifications
- ⚠️ Any modified version must also be licensed under AGPL-3.0
- ⚠️ If you run a modified version as a service, you must make the source available to users

---

## 🙏 Acknowledgments

Built with:
- [Web3Auth](https://web3auth.io) - MPC-based wallet infrastructure
- [Optimism](https://optimism.io) - Ethereum Layer 2 scaling
- [Hardhat](https://hardhat.org) - Ethereum development environment
- [Fastify](https://fastify.dev) - High-performance web framework
- [React](https://react.dev) - UI framework
- [shadcn/ui](https://ui.shadcn.com) - UI component library

---

**Built with ❤️ for decentralized collaboration**
