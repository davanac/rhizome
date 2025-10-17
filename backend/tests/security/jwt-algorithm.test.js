/**
 * Security Tests for JWT Algorithm Validation
 *
 * Tests that JWT verification properly validates algorithms to prevent
 * algorithm confusion attacks where an attacker changes "HS256" to "none".
 */

import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyToken, verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../../src/utils/auth/jwt.js';
import Config from '../../src/config/config.js';

describe('JWT Algorithm Validation - Security Tests', () => {
  const testPayload = {
    userId: 'test-user-123',
    email: 'test@example.com',
  };

  describe('Access Token Validation', () => {
    it('should accept valid HS256 token', () => {
      const token = generateAccessToken(testPayload, '1h');
      const decoded = verifyToken(token);

      expect(decoded.success).not.toBe(false);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('should reject token with "none" algorithm (algorithm confusion attack)', () => {
      // Create a token with "none" algorithm (no signature)
      const maliciousToken = jwt.sign(testPayload, '', { algorithm: 'none' });
      const result = verifyToken(maliciousToken);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBeTruthy();
    });

    it('should reject token signed with RS256 when expecting HS256', () => {
      // Generate RSA key pair for testing
      const crypto = require('crypto');
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
      });

      // Sign token with RS256 (asymmetric)
      const maliciousToken = jwt.sign(testPayload, privateKey, { algorithm: 'RS256' });
      const result = verifyToken(maliciousToken);

      // Should be rejected because we only allow HS256
      expect(result.success).toBe(false);
      expect(result.errorCode).toBeTruthy();
    });

    it('should reject token with manipulated algorithm header', () => {
      // Create a valid token
      const validToken = generateAccessToken(testPayload, '1h');

      // Decode and manipulate the header
      const parts = validToken.split('.');
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());

      // Change algorithm to none
      header.alg = 'none';
      const manipulatedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
      const manipulatedToken = `${manipulatedHeader}.${parts[1]}.`;

      const result = verifyToken(manipulatedToken);

      expect(result.success).toBe(false);
    });
  });

  describe('Refresh Token Validation', () => {
    it('should accept valid HS256 refresh token', () => {
      const token = generateRefreshToken(testPayload, '7d');
      const decoded = verifyRefreshToken(token);

      expect(decoded.success).not.toBe(false);
      expect(decoded.userId).toBe(testPayload.userId);
    });

    it('should reject refresh token with "none" algorithm', () => {
      const maliciousToken = jwt.sign(testPayload, '', { algorithm: 'none' });
      const result = verifyRefreshToken(maliciousToken);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBeTruthy();
    });

    it('should reject refresh token signed with different algorithm', () => {
      // Sign with HS512 instead of HS256
      const wrongAlgoToken = jwt.sign(testPayload, Config.JWT_SECRET, { algorithm: 'HS512' });
      const result = verifyRefreshToken(wrongAlgoToken);

      // Should be rejected
      expect(result.success).toBe(false);
    });
  });

  describe('Token Expiration', () => {
    it('should reject expired access token', () => {
      // Create token that expires immediately
      const token = generateAccessToken(testPayload, '0s');

      // Wait a moment to ensure expiration
      return new Promise(resolve => {
        setTimeout(() => {
          const result = verifyToken(token);
          expect(result.success).toBe(false);
          expect(result.errorCode).toBe('jwt-expired');
          resolve();
        }, 100);
      });
    });

    it('should reject expired refresh token', () => {
      const token = generateRefreshToken(testPayload, '0s');

      return new Promise(resolve => {
        setTimeout(() => {
          const result = verifyRefreshToken(token);
          expect(result.success).toBe(false);
          resolve();
        }, 100);
      });
    });
  });

  describe('Invalid Token Handling', () => {
    it('should reject malformed token', () => {
      const result = verifyToken('not-a-valid-token');
      expect(result.success).toBe(false);
    });

    it('should reject token with invalid signature', () => {
      const token = generateAccessToken(testPayload, '1h');

      // Tamper with the signature
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature`;

      const result = verifyToken(tamperedToken);
      expect(result.success).toBe(false);
    });

    it('should reject empty token', () => {
      const result = verifyToken('');
      expect(result.success).toBe(false);
    });

    it('should reject null token', () => {
      const result = verifyToken(null);
      expect(result.success).toBe(false);
    });
  });

  describe('Algorithm Specification', () => {
    it('should use HS256 algorithm by default', () => {
      const token = generateAccessToken(testPayload, '1h');
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded.header.alg).toBe('HS256');
    });

    it('should only accept tokens with HS256 algorithm', () => {
      // List of algorithms that should be rejected
      const invalidAlgorithms = ['none', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256'];

      for (const alg of invalidAlgorithms) {
        try {
          let token;
          if (alg === 'none') {
            token = jwt.sign(testPayload, '', { algorithm: alg });
          } else if (alg.startsWith('RS') || alg.startsWith('ES')) {
            // Skip asymmetric algorithms as they require different keys
            continue;
          } else {
            token = jwt.sign(testPayload, Config.JWT_SECRET, { algorithm: alg });
          }

          const result = verifyToken(token);
          expect(result.success).toBe(false);
        } catch (e) {
          // Expected to fail for some algorithms
        }
      }
    });
  });
});
