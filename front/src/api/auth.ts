// Authentication API endpoints
import client, { handleError } from "./client";

/**
 * Get authentication nonce for wallet address
 * @param {string} walletAddress - The wallet address
 * @returns {Promise} Axios response promise
 */
export const getAuthNonce = async (walletAddress) => {
  try {
    const response = await client.post("/auth/auth-nonce", { walletAddress });
    return response.data;
  } catch (error) {
    return handleError(error, "457249");
  }
};

/**
 * Login with credentials or Web3Auth payload
 * @param {string} hashedEmail - Hashed email (legacy)
 * @param {string} hashedPassword - Hashed password (legacy)  
 * @param {Object} web3authPayload - Web3Auth authentication data
 * @returns {Promise} Axios response promise
 */
export const loginRequest = async (hashedEmail, hashedPassword, web3authPayload = null) => {
  try {
    const requestData = web3authPayload || { hashedEmail, hashedPassword };
    const response = await client.post("/auth/login", requestData);
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "457248");
  }
};

/**
 * Register new user account
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} wallet - Wallet data
 * @returns {Promise} Axios response promise
 */
export const registerRequest = async (email, password, wallet) => {
  try {
    const response = await client.post("/auth/register", { email, password, wallet });
    return { ...response.data };
  } catch (error) {
    return handleError(error, "729248");
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise} Axios response promise
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    const token = refreshToken || JSON.parse(localStorage.getItem("auth_session"))?.refreshToken || null;
    const response = await client.post("/auth/refresh-token", { refreshToken: token });
    return response.data;
  } catch (error) {
    return handleError(error, "367565");
  }
};

/**
 * Get current user information
 * @returns {Promise} Axios response promise
 */
export const getCurrentUser = async () => {
  try {
    const response = await client.get("/auth/me");
    return response.data;
  } catch (error) {
    return handleError(error, "367566");
  }
};

/**
 * Get user wallet information
 * @returns {Promise} Axios response promise
 */
export const getWallet = async () => {
  try {
    const response = await client.get("/auth/wallet");
    return { ...response.data };
  } catch (error) {
    return handleError(error, "502742");
  }
};

/**
 * Check if email address is available
 * @param {string} email - Email to check
 * @returns {Promise} Axios response promise
 */
export const checkEmailAvailable = async (email) => {
  try {
    const response = await client.get(`/auth/check-email-available/${email}`);
    return { ...response.data };
  } catch (error) {
    return handleError(error, "949262");
  }
};

/**
 * Logout user
 * @returns {Promise} Axios response promise
 */
export const logout = async () => {
  try {
    const response = await client.post("/auth/logout");
    return response.data;
  } catch (error) {
    return handleError(error, "logout");
  }
};