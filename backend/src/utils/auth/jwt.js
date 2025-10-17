// path: /src/utils/auth/jwt.js
import jwt from 'jsonwebtoken';
import Config from '#config';

/**
 * Génére un token (access token) valable 24h
 * @param {object} payload - Données à encoder dans le token
 * @param {string} expiresIn - Durée de validité du token - default: 24h
 * @returns {string} token
 */
export function generateAccessToken(payload,expiresIn = '24h') {
  try {
    return jwt.sign(payload, Config.JWT_SECRET, { expiresIn });
  } catch (error) {
    console.log('=== error === jwt.js === key: 692434 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
        success: false,
        message: 'Error generating access token',
        errorKey: 182837,
        errorCode: 'jwt-error',
        fromError: !Config.IN_PROD ? error.message : null,
    }
  }
}

/**
 * Génére un token (refresh token) valable 7 jours
 * @param {object} payload - Données à encoder dans le token
 * @param {string} expiresIn - Durée de validité du token - default: 7 jours
 * @returns {string} token
 */
export function generateRefreshToken(payload, expiresIn = '7d') {
    try {
        return jwt.sign(payload, Config.JWT_SECRET, { expiresIn });
    } catch (error) {
        console.log('=== error === jwt.js === key: 891126 ===');
        console.dir(error, { depth: null, colors: true })
        console.log('=================================');
        return {
            success: false,
            message: 'Error generating refresh token',
            errorKey: 503473,
            errorCode: 'jwt-error',
            fromError: !Config.IN_PROD ? error.message : null,
        }
    }
}

/**
 * Vérifie et décode un token JWT, renvoie l'objet décodé ou génère une erreur
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, Config.JWT_SECRET, {
            algorithms: ['HS256']
        });
    } catch (error) {
        console.log('=== error === jwt.js === key: 546437 ===');
        console.dir(error, { depth: null, colors: true })
        console.log('=================================');
        return {
            success: false,
            message: 'Error verifying token',
            errorKey: 733746,
            errorCode:error.message === "jwt expired" ? "jwt-expired" : 'jwt-error',
            fromError: !Config.IN_PROD ? error.message : null,
        }
    }
}

/**
 * Vérifie et décode un refresh token
 */
export function verifyRefreshToken(refreshToken) {
    try {
        return jwt.verify(refreshToken, Config.JWT_SECRET, {
            algorithms: ['HS256']
        });
    } catch (error) {
        console.log('=== error === jwt.js === key: 274205 ===');
        console.dir(error, { depth: null, colors: true })
        console.log('=================================');
        return {
            success: false,
            message: 'Error verifying refresh token',
            errorKey: 773167,
            errorCode: 'jwt-error',
            fromError: !Config.IN_PROD ? error.message : null,
        }
    }
  }
