import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import web3AuthService from '../services/web3auth.service';

interface Web3AuthUser {
  email?: string;
  name?: string;
  profileImage?: string;
  address: string;
  web3authId: string;
  verifier?: string;
  verifierId?: string;
  typeOfLogin?: string;
}

interface Web3AuthContextType {
  isInitialized: boolean;
  isConnected: boolean;
  isLoading: boolean;
  user: Web3AuthUser | null;
  login: (provider?: string) => Promise<Web3AuthUser | null>;
  logout: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  getAddress: () => Promise<string | null>;
  getBalance: () => Promise<string>;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
};

interface Web3AuthProviderProps {
  children: ReactNode;
}

export const Web3AuthProvider: React.FC<Web3AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Web3AuthUser | null>(null);

  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        setIsLoading(true);
        await web3AuthService.init();
        setIsInitialized(true);

        // Check if already connected
        if (web3AuthService.isConnected()) {
          const userInfo = await web3AuthService.getUserInfo();
          if (userInfo) {
            setUser(userInfo);
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Web3Auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initWeb3Auth();
  }, []);

  const login = async (provider?: string): Promise<Web3AuthUser | null> => {
    try {
      setIsLoading(true);
      const userInfo = await web3AuthService.login(provider);
      
      if (userInfo) {
        setUser(userInfo);
        setIsConnected(true);
        return userInfo;
      }
      
      return null;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await web3AuthService.logout();
      setUser(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Not connected to Web3Auth');
    }
    return await web3AuthService.signMessage(message);
  };

  const getAddress = async (): Promise<string | null> => {
    if (!isConnected) {
      return null;
    }
    return await web3AuthService.getAddress();
  };

  const getBalance = async (): Promise<string> => {
    if (!isConnected) {
      return '0';
    }
    return await web3AuthService.getBalance();
  };

  const value: Web3AuthContextType = {
    isInitialized,
    isConnected,
    isLoading,
    user,
    login,
    logout,
    signMessage,
    getAddress,
    getBalance,
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
};