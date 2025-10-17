import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken, 
  verifyRefreshToken 
} from '../../src/utils/auth/jwt.js';

// Mock dependencies
vi.mock('jsonwebtoken');
vi.mock('#config');

describe('JWT Utilities Unit Tests', () => {
  let mockConfig;

  beforeEach(async () => {
    const config = await import('#config');
    mockConfig = config.default;
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Default config
    mockConfig.JWT_SECRET = 'test-secret-key';
    mockConfig.IN_PROD = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token with default 24h expiration', () => {
      const payload = { userId: 'user123', isAdmin: false };
      const expectedToken = 'generated-token';
      
      jwt.sign.mockReturnValue(expectedToken);

      const result = generateAccessToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret-key',
        { expiresIn: '24h' }
      );
      expect(result).toBe(expectedToken);
    });

    it('should generate access token with custom expiration', () => {
      const payload = { userId: 'user123', isAdmin: true };
      const expectedToken = 'generated-token';
      
      jwt.sign.mockReturnValue(expectedToken);

      const result = generateAccessToken(payload, '1h');

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret-key',
        { expiresIn: '1h' }
      );
      expect(result).toBe(expectedToken);
    });

    it('should handle JWT signing errors gracefully', () => {
      const payload = { userId: 'user123' };
      const error = new Error('JWT signing failed');
      
      jwt.sign.mockImplementation(() => {
        throw error;
      });

      const result = generateAccessToken(payload);

      expect(result).toEqual({
        success: false,
        message: 'Error generating access token',
        errorKey: 182837,
        errorCode: 'jwt-error',
        fromError: 'JWT signing failed'
      });
    });

    it('should not expose error details in production', () => {
      mockConfig.IN_PROD = true;
      const payload = { userId: 'user123' };
      const error = new Error('JWT signing failed');
      
      jwt.sign.mockImplementation(() => {
        throw error;
      });

      const result = generateAccessToken(payload);

      expect(result).toEqual({
        success: false,
        message: 'Error generating access token',
        errorKey: 182837,
        errorCode: 'jwt-error',
        fromError: null
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with default 7d expiration', () => {
      const payload = { userId: 'user123' };
      const expectedToken = 'refresh-token';
      
      jwt.sign.mockReturnValue(expectedToken);

      const result = generateRefreshToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret-key',
        { expiresIn: '7d' }
      );
      expect(result).toBe(expectedToken);
    });

    it('should generate refresh token with custom expiration', () => {
      const payload = { userId: 'user123' };
      const expectedToken = 'refresh-token';
      
      jwt.sign.mockReturnValue(expectedToken);

      const result = generateRefreshToken(payload, '30d');

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret-key',
        { expiresIn: '30d' }
      );
      expect(result).toBe(expectedToken);
    });

    it('should handle JWT signing errors gracefully', () => {
      const payload = { userId: 'user123' };
      const error = new Error('JWT signing failed');
      
      jwt.sign.mockImplementation(() => {
        throw error;
      });

      const result = generateRefreshToken(payload);

      expect(result).toEqual({
        success: false,
        message: 'Error generating refresh token',
        errorKey: 503473,
        errorCode: 'jwt-error',
        fromError: 'JWT signing failed'
      });
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify and decode valid token', () => {
      const token = 'valid-token';
      const decoded = { userId: 'user123', isAdmin: false, exp: 1234567890 };
      
      jwt.verify.mockReturnValue(decoded);

      const result = verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret-key');
      expect(result).toEqual(decoded);
    });

    it('should handle expired token error', () => {
      const token = 'expired-token';
      const error = new Error('jwt expired');
      
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      const result = verifyToken(token);

      expect(result).toEqual({
        success: false,
        message: 'Error verifying token',
        errorKey: 733746,
        errorCode: 'jwt-expired',
        fromError: 'jwt expired'
      });
    });

    it('should handle malformed token error', () => {
      const token = 'malformed-token';
      const error = new Error('jwt malformed');
      
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      const result = verifyToken(token);

      expect(result).toEqual({
        success: false,
        message: 'Error verifying token',
        errorKey: 733746,
        errorCode: 'jwt-error',
        fromError: 'jwt malformed'
      });
    });

    it('should handle invalid signature error', () => {
      const token = 'invalid-signature-token';
      const error = new Error('invalid signature');
      
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      const result = verifyToken(token);

      expect(result).toEqual({
        success: false,
        message: 'Error verifying token',
        errorKey: 733746,
        errorCode: 'jwt-error',
        fromError: 'invalid signature'
      });
    });

    it('should not expose error details in production', () => {
      mockConfig.IN_PROD = true;
      const token = 'invalid-token';
      const error = new Error('jwt malformed');
      
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      const result = verifyToken(token);

      expect(result).toEqual({
        success: false,
        message: 'Error verifying token',
        errorKey: 733746,
        errorCode: 'jwt-error',
        fromError: null
      });
    });
  });

  describe('verifyRefreshToken', () => {
    it('should successfully verify and decode valid refresh token', () => {
      const token = 'valid-refresh-token';
      const decoded = { userId: 'user123', exp: 1234567890 };
      
      jwt.verify.mockReturnValue(decoded);

      const result = verifyRefreshToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret-key');
      expect(result).toEqual(decoded);
    });

    it('should handle refresh token verification errors', () => {
      const token = 'invalid-refresh-token';
      const error = new Error('jwt expired');
      
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      const result = verifyRefreshToken(token);

      expect(result).toEqual({
        success: false,
        message: 'Error verifying refresh token',
        errorKey: 773167,
        errorCode: 'jwt-error',
        fromError: 'jwt expired'
      });
    });

    it('should not expose error details in production', () => {
      mockConfig.IN_PROD = true;
      const token = 'invalid-refresh-token';
      const error = new Error('jwt expired');
      
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      const result = verifyRefreshToken(token);

      expect(result).toEqual({
        success: false,
        message: 'Error verifying refresh token',
        errorKey: 773167,
        errorCode: 'jwt-error',
        fromError: null
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty payload in generateAccessToken', () => {
      const expectedToken = 'token-for-empty-payload';
      jwt.sign.mockReturnValue(expectedToken);

      const result = generateAccessToken({});

      expect(jwt.sign).toHaveBeenCalledWith(
        {},
        'test-secret-key',
        { expiresIn: '24h' }
      );
      expect(result).toBe(expectedToken);
    });

    it('should handle null token in verifyToken', () => {
      const error = new Error('jwt must be provided');
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      const result = verifyToken(null);

      expect(result).toEqual({
        success: false,
        message: 'Error verifying token',
        errorKey: 733746,
        errorCode: 'jwt-error',
        fromError: 'jwt must be provided'
      });
    });

    it('should handle undefined token in verifyToken', () => {
      const error = new Error('jwt must be provided');
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      const result = verifyToken(undefined);

      expect(result).toEqual({
        success: false,
        message: 'Error verifying token',
        errorKey: 733746,
        errorCode: 'jwt-error',
        fromError: 'jwt must be provided'
      });
    });
  });
});