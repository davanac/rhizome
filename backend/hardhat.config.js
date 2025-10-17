import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let rpcURL, chainId;

switch (process.env.HARDHAT_NETWORK) {
  case "optimism":
    rpcURL = process.env.OPTIMISM_RPC_URL;
    chainId = parseInt(process.env.OPTIMISM_CHAIN_ID);
    break;
  case "sepolia_optimism":
    rpcURL = process.env.SEPOLIA_OPTIMISM_TESTNET_RPC_URL;
    chainId = parseInt(process.env.SEPOLIA_OPTIMISM_TESTNET_CHAIN_ID);
    break;
  case "sepolia":
    rpcURL = process.env.SEPOLIA_TESTNET_RPC_URL;
    chainId = parseInt(process.env.SEPOLIA_TESTNET_CHAIN_ID);
    break;
  case "sepolia_base":
    rpcURL = process.env.SEPOLIA_BASE_TESTNET_RPC_URL;
    chainId = parseInt(process.env.SEPOLIA_BASE_TESTNET_CHAIN_ID);
    break;
  default:
    rpcURL = process.env.LOCALHOST_RPC_URL || "";
    chainId = parseInt(process.env.LOCALHOST_CHAIN_ID || 0);
    break;
}

console.log(
  "=== process.env.BLOCKCHAIN_ENV === hardhat.config.js === key: 046323 ==="
);
console.dir(process.env.BLOCKCHAIN_ENV, { depth: null, colors: true });
console.log(`RPC URL: ${rpcURL}`);
console.log(`Chain ID: ${chainId}`);
console.log("=================================");

export default {
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
  paths: {
    artifacts: path.join(__dirname, "src/web3/artifacts"),
    sources: path.join(__dirname, "src/web3/contracts"),
    tests: path.join(__dirname, "src/web3/test"),
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia_optimism: {
      url: process.env.SEPOLIA_OPTIMISM_TESTNET_RPC_URL || "",
      chainId: parseInt(process.env.SEPOLIA_OPTIMISM_TESTNET_CHAIN_ID || "0"),
    },
    sepolia: {
      url: process.env.SEPOLIA_TESTNET_RPC_URL || "",
      chainId: parseInt(process.env.SEPOLIA_TESTNET_CHAIN_ID || "0"),
    },
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || "",
      chainId: parseInt(process.env.OPTIMISM_CHAIN_ID || "0"),
    },
    sepolia_base: {
      url: process.env.SEPOLIA_BASE_TESTNET_RPC_URL || "",
      chainId: parseInt(process.env.SEPOLIA_BASE_TESTNET_CHAIN_ID || "0"),
    },
  },
};
//######################################################
// compile the contracts
//######################################################
// npx hardhat clean
// npx hardhat compile
//
//######################################################
// deploy the contracts
//######################################################
// npx hardhat node
// PASSWORD=****** npx hardhat run src/web3/scripts/deploy.js --network localhost
// PASSWORD=****** npx hardhat run src/web3/scripts/deploy.js --network sepolia ## Testnet Ethereum (Sepolia)
// PASSWORD=****** npx hardhat run src/web3/scripts/deploy.js --network sepolia_optimism ## Testnet Ethereum (Sepolia) sur Optimism
// PASSWORD=****** npx hardhat run src/web3/scripts/deploy.js --network sepolia_base ## Testnet Ethereum (Sepolia) sur Base
// PASSWORD=****** npx hardhat run src/web3/scripts/deploy.js --network goerli
// PASSWORD=****** npx hardhat run src/web3/scripts/deploy.js --network mumbai
// PASSWORD=****** npx hardhat run src/web3/scripts/deploy.js --network polygon
// PASSWORD=****** npx hardhat run src/web3/scripts/deploy.js --network optimism
//
//######################################################
// run tests
//######################################################
// npx hardhat test
// npx hardhat test test/ProjectsRegistry.test.js
// npx hardhat test test/RhizomeNFT.test.js
//
// Pour obtenir une couverture de code
// npx hardhat coverage
//######################################################
// scripts tests
//######################################################
// PASSWORD=****** npx hardhat run src/web3/scripts/testMintFinal.js --network localhost
// PASSWORD=****** npx hardhat run src/web3/scripts/testMintFinal.js --network sepolia
// PASSWORD=****** npx hardhat run src/web3/scripts/testMintFinal.js --network sepolia_optimism
// PASSWORD=****** npx hardhat run src/web3/scripts/testMintFinal.js --network sepolia_base
//
// Pour obtenir une couverture de code
// npx hardhat coverage
