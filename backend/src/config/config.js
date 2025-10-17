//path: /src/config/config.js

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import KeyUtils from "./keyutils.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const networkName = process.env.BLOCKCHAIN_ENV || "localhost";
const filePath = path.join(
  __dirname,
  `../web3/deployed/deployed-contracts-${networkName}.json`
);
const contractsAddresses = JSON.parse(fs.readFileSync(filePath, "utf-8"));

const env = process.env.NODE_ENV || "development";

const getAccount = () => {
  if(process.env.BLOCKCHAIN_ENV === "localhost") {
    return false;
  }
  return (
    KeyUtils.getKey(process.env.MASTER_KEY_PASSWORD || "", process.env.MASTER_KEY_ID || "") || false
  );
};

let pkExists = false;

try {
  pkExists = getAccount() ? true : false;
} catch (error) {
  console.log("=== error === hardhat.config.js === key: 064096 ===");
  console.dir(error, { depth: null, colors: true });
  console.log("=================================");
  
}

try {
  dotenv.config({ path: `.env.${env}` });
} catch (error) {
  console.log('=== error === config.js === key: 711291 ===');
  console.dir(error, { depth: null, colors: true })
  console.log('=================================');
  dotenv.config();
}

const Config = {
  IN_PROD: env === "production",
  IN_DEV: env === "development",
  IN_REMOTE_DEV: env === "remote",
  IN_TEST: env === "test",
  ENV: env,
  JWT_SECRET: process.env.JWT_SECRET,
  API_VERSION: process.env.API_VERSION || "v1",
  EXTERNAL_API_URL: process.env.EXTERNAL_API_URL || null,
  SERVER: {
    PORT: process.env.PORT || process.env.SERVER_PORT || 3000,
  },
  DB: {
    HOST: process.env.DB_HOST || "localhost",
    PORT: process.env.DB_PORT || 5432,
    NAME: process.env.DB_NAME || "rhizome",
    USER: process.env.DB_USER || "",
    PASSWORD: process.env.DB_PASS || "",
  },
  LOGS: {
    OUTPUT: process.env.LOGS_OUTPUT || "file", // 'console' ou 'file'
    FILE_PATH: process.env.LOGS_FILE_PATH || "./src/logger/logs.json",
    MAX_COUNT: process.env.LOGS_MAX_COUNT || 200,
    USE_STACK: process.env.LOGS_USE_STACK || false,
  },
  WEB3: {
    SEPOLIA: {
      RPC_URL: process.env.SEPOLIA_TESTNET_RPC_URL,
      CHAIN_ID: process.env.SEPOLIA_TESTNET_CHAIN_ID,
    },
    SEPOLIA_OPTIMISM: {
      RPC_URL: process.env.SEPOLIA_OPTIMISM_TESTNET_RPC_URL,
      CHAIN_ID: process.env.SEPOLIA_OPTIMISM_TESTNET_CHAIN_ID,
    },
    OPTIMISM: {
      RPC_URL: process.env.OPTIMISM_RPC_URL,
      CHAIN_ID: process.env.OPTIMISM_CHAIN_ID,
    },
    SEPOLIA_BASE: {
      RPC_URL: process.env.SEPOLIA_BASE_TESTNET_RPC_URL,
      CHAIN_ID: process.env.SEPOLIA_BASE_TESTNET_CHAIN_ID,
    },
    LOCALHOST: {
      RPC_URL: process.env.LOCALHOST_TESTNET_RPC_URL,
      CHAIN_ID: process.env.LOCALHOST_TESTNET_CHAIN_ID,
    },
    CONTRACTS_ADDRESSES: contractsAddresses,
    BLOCKCHAIN_ENV: process.env.BLOCKCHAIN_ENV.toUpperCase(),
    ACCOUNTS: pkExists ? pkExists : [],
    GET_ACCOUNT: getAccount,
  },
};

!Config.IN_PROD && console.log("=== Config === config.js === key: 720936 ===");
!Config.IN_PROD && console.dir(Config, { depth: null, colors: true });
!Config.IN_PROD && console.log("================================="); 

export default Config;
export {KeyUtils};
