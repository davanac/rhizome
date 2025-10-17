// path: /src/services/auth.service.js

import pool from "#database/database.js";
import Config from "#config";
import * as JwtUtil from "#utils/auth/jwt.js";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";

// In-memory nonce store (for production, use Redis or database)
const nonceStore = new Map();
const NONCE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a nonce for authentication challenge
 * @param {string} walletAddress - The wallet address
 * @returns {object} The generated nonce with timestamp
 */
export const generateAuthNonce = (walletAddress) => {
  const nonce = crypto.randomBytes(32).toString('hex');
  const timestamp = new Date().toISOString();
  const expiryTime = Date.now() + NONCE_EXPIRY;
  
  nonceStore.set(walletAddress.toLowerCase(), {
    nonce,
    timestamp,
    expiryTime
  });
  
  // Clean up expired nonces
  setTimeout(() => {
    nonceStore.delete(walletAddress.toLowerCase());
  }, NONCE_EXPIRY);
  
  return { nonce, timestamp };
};

/**
 * Verify authentication signature
 * @param {string} walletAddress - The wallet address
 * @param {string} signature - The signature to verify
 * @param {string} web3authId - The Web3Auth ID (wallet address)
 * @returns {boolean} True if signature is valid
 */
export const verifyAuthSignature = (walletAddress, signature, web3authId) => {
  const normalizedAddress = walletAddress.toLowerCase();
  try {
    const stored = nonceStore.get(normalizedAddress);

    if (!stored) {
      console.error('No nonce found for wallet address');
      return false;
    }

    if (Date.now() > stored.expiryTime) {
      console.error('Nonce has expired');
      return false;
    }

    const message = `Sign this message to authenticate with Rhizome.\n\nNonce: ${stored.nonce}\nWeb3Auth ID: ${web3authId}\nTimestamp: ${stored.timestamp}`;

    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    return recoveredAddress.toLowerCase() === normalizedAddress;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  } finally {
    // Always clean up the nonce (success, failure, or exception)
    nonceStore.delete(normalizedAddress);
  }
};

/**
 * Creates a new user session with refresh token
 * @param {string} userId - The user ID
 * @param {string} refreshToken - The refresh token
 * @param {Date} expiresAt - Token expiration date
 * @returns {Promise<object>}
 */
export async function createUserSession(userId, refreshToken, expiresAt) {
  const query = `
    INSERT INTO public.user_sessions (user_id, refresh_token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [userId, refreshToken, expiresAt]);
    return {
      success: true,
      session: result.rows[0]
    };
  } catch (error) {
    console.error('Error creating user session:', error);
    return {
      success: false,
      message: "Error creating user session",
      errorKey: 844401,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Finds user session by refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<object|null>}
 */
export async function findUserSessionByToken(refreshToken) {
  const query = `
    SELECT us.*, u.email, u.is_admin, u.is_enabled
    FROM public.user_sessions us
    JOIN public.users u ON u.id = us.user_id
    WHERE us.refresh_token = $1 AND us.expires_at > CURRENT_TIMESTAMP
    LIMIT 1
  `;
  
  try {
    const result = await pool.query(query, [refreshToken]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error finding user session:', error);
    return null;
  }
}

/**
 * Verifies refresh token and returns user data
 * @param {string} refreshToken - The refresh token to verify
 * @returns {Promise<object|null>}
 */
export async function verifyAndGetUserByRefreshToken(refreshToken) {
  try {
    // 1) Verify the JWT token is valid
    const decoded = JwtUtil.verifyRefreshToken(refreshToken);

    if (decoded.success === false) {
      return {
        success: false,
        message: "Invalid refresh token",
        errorKey: 781445,
        errorCode: decoded.errorCode || "invalid-refresh-token",
        fromError: decoded.fromError,
      };
    }

    if (!decoded?.userId) {
      return null;
    }

    // 2) Find the session and user data
    const sessionData = await findUserSessionByToken(refreshToken);
    
    if (!sessionData) {
      return {
        success: false,
        message: "No user found for this refresh token",
        errorKey: 647023,
        errorCode: "no-user-for-refresh-token",
      };
    }

    return {
      id: sessionData.user_id,
      user_id: sessionData.user_id,
      email: sessionData.email,
      is_admin: sessionData.is_admin
    };
    
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return {
      success: false,
      message: "Error verifying refresh token",
      errorKey: 143461,
      errorCode: "verify-refresh-token",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Updates user session with new refresh token
 * @param {string} sessionId - The session ID
 * @param {string} refreshToken - New refresh token
 * @returns {Promise<object>}
 */
export async function updateUserSessionToken(sessionId, refreshToken) {
  const query = `
    UPDATE public.user_sessions
    SET refresh_token = $2, expires_at = $3
    WHERE id = $1
    RETURNING *
  `;
  
  const expiresAt = new Date(Date.now() + (77 * 24 * 60 * 60 * 1000)); // 77 days
  
  try {
    const result = await pool.query(query, [sessionId, refreshToken, expiresAt]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating user session:', error);
    return null;
  }
}

/**
 * Login or Register with Web3Auth
 * @param {object} params - Web3Auth user data
 * @returns {Promise<object>}
 */
export const loginOrRegisterWithWeb3Auth = async ({ web3authId, email, name, walletAddress, verifier, typeOfLogin, signature, originalVerifierId }) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Verify signature before proceeding
    if (!signature || !verifyAuthSignature(walletAddress, signature, web3authId)) {
      return {
        success: false,
        message: "Invalid signature - authentication failed",
        errorKey: 182540,
        errorCode: "invalid-signature"
      };
    }
    
    // Check if Web3Auth user already exists
    const existingWeb3AuthQuery = `
      SELECT w.*, u.email, u.is_admin, u.is_enabled
      FROM public.web3auth_users w
      JOIN public.users u ON u.id = w.user_id
      WHERE w.web3auth_id = $1
      LIMIT 1
    `;
    const existingWeb3Auth = await client.query(existingWeb3AuthQuery, [web3authId]);
    
    let userId;
    let isNewUser = false;
    
    if (existingWeb3Auth.rows.length > 0) {
      // User exists, update Web3Auth data on every login
      userId = existingWeb3Auth.rows[0].user_id;
      
      const updateQuery = `
        UPDATE public.web3auth_users 
        SET wallet_address = $1, verifier = $2, type_of_login = $3, verifier_id = $4, updated_at = CURRENT_TIMESTAMP 
        WHERE web3auth_id = $5
      `;
      await client.query(updateQuery, [walletAddress, verifier, typeOfLogin, originalVerifierId || web3authId, web3authId]);
    } else {
      // New user - create records
      isNewUser = true;
      userId = uuidv4();
      
      // Create user record
      const userQuery = `
        INSERT INTO public.users (id, email, is_active, is_enabled, created_at, updated_at)
        VALUES ($1, $2, true, true, NOW(), NOW())
        RETURNING *
      `;
      await client.query(userQuery, [userId, email || null]);
      
      // Create Web3Auth record
      const web3authQuery = `
        INSERT INTO public.web3auth_users (
          user_id, web3auth_id, wallet_address, verifier, verifier_id, type_of_login
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      await client.query(web3authQuery, [
        userId, web3authId, walletAddress, verifier, originalVerifierId || web3authId, typeOfLogin
      ]);
    }
    
    await client.query("COMMIT");
    
    // Get user with profiles
    const getUserQuery = `
      SELECT u.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', p.id,
                   'first_name', p.first_name,
                   'last_name', p.last_name,
                   'username', p.username,
                   'avatar_url', p.avatar_url,
                   'banner_url', p.banner_url,
                   'bio', p.bio,
                   'expertise', p.expertise,
                   'collectif_name', p.collectif_name,
                   'website', p.website,
                   'profile_type_id', p.profile_type_id,
                   'wallet_address', p.wallet_address,
                   'type', pt.type_name
                 )
               ) FILTER (WHERE p.id IS NOT NULL), 
               '[]'::json
             ) as profiles
      FROM public.users u
      LEFT JOIN public.profiles p ON p.user_id = u.id
      LEFT JOIN public.profile_type pt ON pt.id = p.profile_type_id
      WHERE u.id = $1
      GROUP BY u.id, u.email, u.is_admin, u.is_active, u.is_enabled, u.created_at, u.updated_at
    `;
    
    const { rows } = await client.query(getUserQuery, [userId]);
    const user = rows[0];
    
    // Set primary profile
    if (user.profiles && user.profiles.length > 0) {
      user.primaryProfile = user.profiles.find(p => p.type === "individual") || user.profiles[0];
    }
    
    return {
      success: true,
      user,
      isNewUser
    };
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error('Error in loginOrRegisterWithWeb3Auth:', error);
    return {
      success: false,
      message: "Database error during Web3Auth authentication",
      errorKey: 487291,
      errorCode: "database-error",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  } finally {
    client.release();
  }
};

/**
 * Get current user by ID
 * @param {string} userId - The user ID
 * @returns {Promise<object|null>}
 */
export const getCurrentUser = async (userId) => {
  try {
    const query = `
      SELECT u.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', p.id,
                   'first_name', p.first_name,
                   'last_name', p.last_name,
                   'username', p.username,
                   'avatar_url', p.avatar_url,
                   'banner_url', p.banner_url,
                   'bio', p.bio,
                   'expertise', p.expertise,
                   'collectif_name', p.collectif_name,
                   'website', p.website,
                   'profile_type_id', p.profile_type_id,
                   'wallet_address', p.wallet_address,
                   'type', pt.type_name
                 )
               ) FILTER (WHERE p.id IS NOT NULL), 
               '[]'::json
             ) as profiles
      FROM public.users u
      LEFT JOIN public.profiles p ON p.user_id = u.id
      LEFT JOIN public.profile_type pt ON pt.id = p.profile_type_id
      WHERE u.id = $1
      GROUP BY u.id, u.email, u.is_admin, u.is_active, u.is_enabled, u.created_at, u.updated_at
    `;
    
    const { rows } = await pool.query(query, [userId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const user = rows[0];
    
    // Set primary profile
    if (user.profiles && user.profiles.length > 0) {
      user.primaryProfile = user.profiles.find(p => p.type === "individual") || user.profiles[0];
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};