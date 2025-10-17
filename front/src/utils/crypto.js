import { ethers } from "ethers";
import web3AuthService from "@/services/web3auth.service";

/**
 * Sign a message using Web3Auth
 * This replaces the old mnemonic-based signing
 * @param {string} message - The message to sign
 * @returns {Promise<string|object>} The signature or error object
 */
export const signMessage = async (message) => {
  try {
    // Check if Web3Auth is connected
    if (!web3AuthService.isConnected()) {
      return {
        success: false,
        message: "Web3Auth not connected",
        errorCode: "web3auth-not-connected",
        errorKey: 371716,
      };
    }

    // Sign message with Web3Auth
    const signature = await web3AuthService.signMessage(message);

    // Only log in development (signatures are sensitive data)
    if (import.meta.env.MODE !== 'production') {
      console.log('=== signature generated === crypto.js === key: 371715 ===');
    }

    return signature;
  } catch (error) {
    console.log('=== error === crypto.js === key: 178449 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Signature error",
      fromError: error.message,
      errorCode: "sign-message-error",
      errorKey: 606855,
    };
  }
};

/**
 * Verify a signature
 * @param {string} message - The original message
 * @param {string} signature - The signature to verify
 * @param {string} expectedAddress - The expected signer address
 * @returns {boolean|object} True if valid, error object if not
 */
export const verifySignature = (message, signature, expectedAddress) => {
  try {
    // Récupère l'adresse du signataire à partir du message et de la signature
    const signerAddress = ethers.verifyMessage(message, signature);

    // Compare l'adresse obtenue avec l'adresse attendue
    return signerAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    return {
      success: false,
      message: "Signature verification error",
      fromError: error.message,
      errorCode: "verify-signature-error",
      errorKey: 150177,
    };
  }
};

/**
 * Get the current wallet address from Web3Auth
 * @returns {Promise<string|null>} The wallet address or null
 */
export const getWalletAddress = async () => {
  try {
    if (!web3AuthService.isConnected()) {
      return null;
    }
    return await web3AuthService.getAddress();
  } catch (error) {
    console.error("Error getting wallet address:", error);
    return null;
  }
};

