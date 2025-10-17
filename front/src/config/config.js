//path: src/config/config.js

// Debug: Log raw environment variables
console.log('🔍 Raw Environment Variables:');
console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  VITE_FRONTEND_URL:', import.meta.env.VITE_FRONTEND_URL);
console.log('  VITE_WEB3AUTH_CLIENT_ID:', import.meta.env.VITE_WEB3AUTH_CLIENT_ID);
console.log('  VITE_WEB3AUTH_NETWORK:', import.meta.env.VITE_WEB3AUTH_NETWORK);
console.log('  All VITE_ vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/api/v1`;
const ENDPOINT_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:8080/';
const WEB3AUTH_CLIENT_ID = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;
const WEB3AUTH_NETWORK = import.meta.env.VITE_WEB3AUTH_NETWORK;

console.log('🔍 After assignment:');
console.log('  WEB3AUTH_CLIENT_ID:', WEB3AUTH_CLIENT_ID);
console.log('  WEB3AUTH_NETWORK:', WEB3AUTH_NETWORK);

// Validate required Web3Auth configuration
if (!WEB3AUTH_CLIENT_ID) {
  throw new Error("VITE_WEB3AUTH_CLIENT_ID is required. Please add it to your .env file. Get your Client ID from https://dashboard.web3auth.io");
}

if (!WEB3AUTH_NETWORK) {
  throw new Error("VITE_WEB3AUTH_NETWORK is required. Please add it to your .env file (sapphire_devnet or sapphire_mainnet)");
}

const Config = {
  API_URL,
  ENDPOINT_URL,
  IN_PROD: import.meta.env.PROD,
  WEB3AUTH: {
    CLIENT_ID: WEB3AUTH_CLIENT_ID,
    NETWORK: WEB3AUTH_NETWORK,
  },
  TEAM_LEADER_CONTRIBUTION: 40,
};

console.clear();

console.log("=== Config === config.js === key: 203647 ===");
console.dir(Config, { depth: null, colors: true });
console.log("================================="); 

export default Config;