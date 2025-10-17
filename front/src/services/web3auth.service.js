import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/modal";
import { ethers } from "ethers";
import Config from "@config";

class Web3AuthService {
  constructor() {
    this.web3auth = null;
    this.provider = null;
  }

  async init() {
    try {
      console.log('🔍 Web3Auth Init - Using network:', Config.WEB3AUTH.NETWORK);

      // Map config string to Web3Auth network constant
      const networkMap = {
        'sapphire_mainnet': WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
        'sapphire_devnet': WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
      };

      const web3AuthNetwork = networkMap[Config.WEB3AUTH.NETWORK];

      if (!web3AuthNetwork) {
        throw new Error(`Invalid WEB3AUTH_NETWORK: ${Config.WEB3AUTH.NETWORK}. Must be 'sapphire_mainnet' or 'sapphire_devnet'`);
      }

      console.log('🔍 Web3Auth Init - Mapped to constant:', web3AuthNetwork);

      // Simple Web3Auth Modal setup
      this.web3auth = new Web3Auth({
        clientId: Config.WEB3AUTH.CLIENT_ID,
        web3AuthNetwork: web3AuthNetwork,
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0xaa37dc", // Optimism Sepolia
          rpcTarget: "https://sepolia.optimism.io",
        },
      });

      // Initialize Web3Auth Modal
      await this.web3auth.init();
      
      if (this.web3auth.connected) {
        this.provider = this.web3auth.provider;
      }

      return true;
    } catch (error) {
      console.error("Web3Auth init error:", error);
      throw error;
    }
  }

  async login(provider = null) {
    try {
      if (!this.web3auth) {
        await this.init();
      }

      this.provider = await this.web3auth.connect();
      
      if (this.provider) {
        const user = await this.web3auth.getUserInfo();
        const address = await this.getAddress();
        
        return {
          ...user,
          address,
          web3authId: address,
          originalVerifierId: user.verifierId || user.sub || user.email,
          // Map Web3Auth properties to expected names
          verifier: user.authConnectionId || user.verifier || 'web3auth',
          typeOfLogin: user.authConnection || null,
        };
      }

      return null;
    } catch (error) {
      console.error("Web3Auth login error:", error);
      throw error;
    }
  }

  async logout() {
    try {
      console.log('Web3Auth logout: Starting logout process...');
      
      if (this.web3auth) {
        console.log('Web3Auth logout: Calling web3auth.logout with cleanup...');
        // Use cleanup parameter for complete logout
        await this.web3auth.logout({ cleanup: true });
        this.provider = null;
        console.log('Web3Auth logout: web3auth.logout completed');
      }
      
      // Always clear storage, even if web3auth is not initialized
      console.log('Web3Auth logout: Clearing storage...');
      this.clearWeb3AuthStorage();
      
    } catch (error) {
      console.error("Web3Auth logout error:", error);
      // Even if logout fails, try to clean up storage
      this.clearWeb3AuthStorage();
    }
  }

  clearWeb3AuthStorage() {
    try {
      console.log('clearWeb3AuthStorage: Starting cleanup...');
      
      // Clear known Web3Auth localStorage keys
      const web3authKeys = [
        'openlogin_store',
        'Web3Auth-cachedAdapter',
        'Web3Auth-state',
        'auth_store',
        'walletconnect',
        'WALLETCONNECT_DEEPLINK_CHOICE'
      ];
      
      console.log('clearWeb3AuthStorage: Removing keys:', web3authKeys);
      
      web3authKeys.forEach(key => {
        console.log(`clearWeb3AuthStorage: Removing ${key}...`);
        localStorage.removeItem(key);
        // Double check it's gone
        const stillThere = localStorage.getItem(key);
        if (stillThere) {
          console.error(`clearWeb3AuthStorage: Key ${key} still exists after removal!`);
        } else {
          console.log(`clearWeb3AuthStorage: Key ${key} successfully removed`);
        }
      });
      
      // Log all localStorage keys before generic cleanup
      console.log('clearWeb3AuthStorage: All localStorage keys before cleanup:', Object.keys(localStorage));
      
      // Clear any keys that start with web3auth
      Object.keys(localStorage).forEach(key => {
        if (key.toLowerCase().includes('web3auth') || 
            key.toLowerCase().includes('openlogin') ||
            key.toLowerCase().includes('walletconnect') ||
            key.toLowerCase().includes('auth_store') ||
            key === 'Web3Auth-state' ||
            key === 'auth_store') {
          console.log(`clearWeb3AuthStorage: Removing additional key: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage as well
      Object.keys(sessionStorage).forEach(key => {
        if (key.toLowerCase().includes('web3auth') || 
            key.toLowerCase().includes('openlogin') ||
            key.toLowerCase().includes('walletconnect')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Final verification
      console.log('clearWeb3AuthStorage: Final localStorage keys:', Object.keys(localStorage));
      console.log('clearWeb3AuthStorage: Checking if problem keys still exist:');
      console.log('  - Web3Auth-state:', localStorage.getItem('Web3Auth-state'));
      console.log('  - auth_store:', localStorage.getItem('auth_store'));
      
    } catch (error) {
      console.error("Error clearing Web3Auth storage:", error);
    }
  }

  async getAddress() {
    try {
      if (!this.provider) return null;
      
      const ethersProvider = new ethers.BrowserProvider(this.provider);
      const signer = await ethersProvider.getSigner();
      return await signer.getAddress();
    } catch (error) {
      console.error("Error getting address:", error);
      return null;
    }
  }

  async signMessage(message) {
    try {
      // Check if we need to initialize or reconnect
      if (!this.provider) {
        if (!this.web3auth) {
          await this.init();
        }
        
        // If still not connected, try to connect/prompt user
        if (!this.web3auth.connected) {
          throw new Error("Web3Auth not connected. Please login first.");
        }
        
        this.provider = this.web3auth.provider;
      }
      
      if (!this.provider) throw new Error("No provider available");
      
      const ethersProvider = new ethers.BrowserProvider(this.provider);
      const signer = await ethersProvider.getSigner();
      
      // For project signing, we need to sign the raw hash bytes
      // The smart contract adds the Ethereum message prefix itself
      if (message.startsWith('0x') && message.length === 66) {
        // This looks like a hash - sign the raw bytes without prefix
        return await signer.signMessage(ethers.getBytes(message));
      }
      
      return await signer.signMessage(message);
    } catch (error) {
      console.error("Error signing message:", error);
      throw error;
    }
  }


  isConnected() {
    return this.web3auth?.connected || false;
  }

  async getUserInfo() {
    try {
      if (!this.web3auth?.connected) {
        return null;
      }
      
      // Additional safety check - ensure we have a provider
      if (!this.provider) {
        this.provider = this.web3auth.provider;
      }
      
      const userInfo = await this.web3auth.getUserInfo();
      const address = await this.getAddress();
      
      return {
        ...userInfo,
        address,
        web3authId: address,
        originalVerifierId: userInfo.verifierId || userInfo.sub || userInfo.email,
        // Map Web3Auth properties to expected names
        verifier: userInfo.authConnectionId || userInfo.verifier || 'web3auth',
        typeOfLogin: userInfo.authConnection || null,
      };
    } catch (error) {
      // Silently return null if user is not connected - this is expected during initialization
      if (error.message?.includes('Wallet is not connected')) {
        return null;
      }
      console.error("Error getting user info:", error);
      return null;
    }
  }

  async getBalance() {
    try {
      if (!this.provider) return "0";
      
      const ethersProvider = new ethers.BrowserProvider(this.provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      const balance = await ethersProvider.getBalance(address);
      
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Error getting balance:", error);
      return "0";
    }
  }
}

// Export singleton instance
const web3AuthService = new Web3AuthService();
export default web3AuthService;