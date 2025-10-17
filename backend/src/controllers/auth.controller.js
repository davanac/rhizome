import * as AuthService from "#services/auth.service.js";
import * as ProfileService from "#services/profiles.service.js";
import * as JwtUtil from "#utils/auth/jwt.js";
// bcrypt removed - not needed for Web3Auth-only system
import Config from "#config";
import pool from "#database/database.js";

/**
 * Generate authentication nonce for wallet address
 */
export const getAuthNonce = async (req, reply) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return reply.status(400).send({
        success: false,
        message: "Wallet address required",
        errorKey: 164407,
      });
    }
    
    // Validate wallet address format
    if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return reply.status(400).send({
        success: false,
        message: "Invalid wallet address format",
        errorKey: 164408,
      });
    }
    
    const nonceData = AuthService.generateAuthNonce(walletAddress);
    
    reply.send({
      success: true,
      nonce: nonceData.nonce,
      timestamp: nonceData.timestamp,
      messageTemplate: "Sign this message to authenticate with Rhizome.\n\nNonce: {nonce}\nWeb3Auth ID: {web3authId}\nTimestamp: {timestamp}"
    });
    
  } catch (error) {
    console.error("Get nonce error:", error);
    reply.status(500).send({
      success: false,
      message: "Error generating nonce",
      errorKey: 138269,
      fromError: !Config.IN_PROD ? error.message : null,
    });
  }
};

/**
 * Login or Register with Web3Auth
 */
export const loginWithWeb3Auth = async (req, reply) => {
  try {
    const { web3authId, email, name, walletAddress, verifier, typeOfLogin, signature, originalVerifierId } = req.body;
    
    if (!web3authId || !walletAddress || !signature) {
      return reply.status(400).send({
        success: false,
        message: "Missing Web3Auth credentials or signature",
        errorKey: 164406,
      });
    }
    
    // Login or register with Web3Auth
    const result = await AuthService.loginOrRegisterWithWeb3Auth({
      web3authId,
      email,
      name,
      walletAddress,
      verifier,
      typeOfLogin,
      signature,
      originalVerifierId
    });
    
    if (!result.success) {
      return reply.status(500).send(result);
    }
    
    // Get profiles for the user
    const profiles = await ProfileService.getProfilesByUserId(result.user.id);
    const primaryProfile = profiles?.find(p => p.type === "individual") || profiles?.[0] || null;
    
    // Generate tokens
    const payload = {
      userId: result.user.id,
      providerUserId: web3authId,
      isAdmin: result.user.is_admin || false,
    };
    
    const accessToken = JwtUtil.generateAccessToken(payload, "77d");
    if (accessToken.success === false) {
      return reply.status(500).send({
        success: false,
        message: "Error generating access token",
        errorKey: 201012,
        errorCode: "jwt-error",
      });
    }
    
    const refreshToken = JwtUtil.generateRefreshToken(payload, "77d");
    if (refreshToken.success === false) {
      return reply.status(500).send({
        success: false,
        message: "Error generating refresh token",
        errorKey: 306026,
        errorCode: "jwt-error",
      });
    }
    
    // Create user session with refresh token
    const expiresAt = new Date(Date.now() + (77 * 24 * 60 * 60 * 1000)); // 77 days
    const sessionResult = await AuthService.createUserSession(result.user.id, refreshToken, expiresAt);
    
    if (!sessionResult.success) {
      console.error('Failed to create user session:', sessionResult);
    }
    
    reply.send({
      data: {
        accessToken,
        refreshToken,
        user: {
          userId: result.user.id,
          email: result.user.email,
          walletAddress: result.walletAddress,
          isAdmin: result.user.is_admin || false,
          profiles: profiles || [],
          primaryProfile,
        },
      },
      isNewUser: result.isNewUser
    });
    
  } catch (error) {
    console.error("Web3Auth login error:", error);
    reply.status(500).send({
      success: false,
      message: "Web3Auth login error",
      errorKey: 138268,
      fromError: !Config.IN_PROD ? error.message : null,
    });
  }
};

export const refreshToken = async (req, reply) => {
  try {
    if (!req.body?.refreshToken) {
      return reply.status(400).send({
        success: false,
        message: "400 - No refresh token provided",
        errorKey: 994957,
        errorCode: "missing-refresh-token",
      });
    }
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return reply.status(400).send({
        success: false,
        message: "400 - No refresh token provided",
        errorKey: 889153,
        errorCode: "missing-refresh-token",
      });
    }

    // 1) Vérifier que le refreshToken est valide et récupérer l'utilisateur
    const user = await AuthService.verifyAndGetUserByRefreshToken(refreshToken);

    if (!user?.id || user.success === false) {
      return reply.status(401).send({
        success: false,
        message: "401 - Invalid refresh token",
        errorKey: 444649,
        errorCode: "invalid-refresh-token",
        fromError: !Config.IN_PROD ? user : null,
      });
    }

    // 2) Générer un nouveau accessToken
    const payload = { 
      userId: user.id, 
      providerUserId: user.provider_user_id,
      isAdmin: user.is_admin || false
    };
    const newAccessToken = JwtUtil.generateAccessToken(payload);

    return reply.send({
      accessToken: newAccessToken,
      refreshToken, // Le refreshToken reste inchangé
    });
  } catch (error) {
    console.log('=== error === auth.controller.js === key: 476272 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    reply.status(500).send({
      success: false,
      message: "Refresh token error",
      errorKey: 961368,
      fromError: !Config.IN_PROD ? "500 - " + error.message : null,
    });
  }
};

export const logout = async (req, reply) => {
  await AuthService.logout(req);
  reply.status(204).send();
};

export const getCurrentUser = async (req, reply) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return reply.status(401).send({
        success: false,
        message: "User not authenticated",
        errorCode: "not-authenticated",
        errorKey: 401123,
      });
    }

    // Get user data from database
    const userQuery = 'SELECT id, email, is_admin FROM public.users WHERE id = $1';
    const userResult = await pool.query(userQuery, [req.user.userId]);
    
    if (!userResult.rows.length) {
      return reply.status(404).send({
        success: false,
        message: "User not found",
        errorCode: "user-not-found",
        errorKey: 404123,
      });
    }
    
    const user = userResult.rows[0];

    // Get user profiles
    const profiles = await ProfileService.getProfilesByUserId(user.id);
    const primaryProfile = profiles?.find(p => p.type === "individual") || profiles?.[0] || null;

    reply.send({
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        isAdmin: user.is_admin || false,
        profiles: profiles || [],
        primaryProfile,
      }
    });
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return reply.status(500).send({
      success: false,
      message: "Error fetching user data",
      errorCode: "internal-error",
      errorKey: 500123,
    });
  }
};

export const getWallet = async (req, reply) => {
  if(!req?.user?.userId){
    return reply.status(400).send({
      success: false,
      message: "Invalid request",
      errorCode: "missing-user-id",
      errorKey: 469916,
    });
  }

  const userId = req.user.userId;
  const wallet = await AuthService.getWallet(userId);
  reply.send(wallet);
};


