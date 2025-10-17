import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { generateAuthNonce, verifyAuthSignature } from '../../src/services/auth.service.js';

// Mock dependencies
vi.mock('crypto');
vi.mock('ethers');

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Date.now() for consistent testing
    const now = new Date('2023-10-01T10:00:00Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-10-01T10:00:00.000Z');
    
    // Mock setTimeout to prevent actual timers
    vi.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
      return 'mock-timeout-id';
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAuthNonce', () => {
    it('should generate nonce with correct structure', () => {
      const mockNonce = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      crypto.randomBytes.mockReturnValue({
        toString: vi.fn().mockReturnValue(mockNonce)
      });

      const walletAddress = '0x1234567890123456789012345678901234567890';
      const result = generateAuthNonce(walletAddress);

      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(result).toEqual({
        nonce: mockNonce,
        timestamp: '2023-10-01T10:00:00.000Z'
      });
    });

    it('should normalize wallet address to lowercase for storage', () => {
      const mockNonce = 'test-nonce-hex';
      crypto.randomBytes.mockReturnValue({
        toString: vi.fn().mockReturnValue(mockNonce)
      });

      const upperCaseWallet = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      const result = generateAuthNonce(upperCaseWallet);

      expect(result).toEqual({
        nonce: mockNonce,
        timestamp: '2023-10-01T10:00:00.000Z'
      });
    });

    it('should set up cleanup timeout', () => {
      const mockNonce = 'test-nonce';
      crypto.randomBytes.mockReturnValue({
        toString: vi.fn().mockReturnValue(mockNonce)
      });

      generateAuthNonce('0x1234567890123456789012345678901234567890');

      expect(setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000 // 5 minutes in milliseconds
      );
    });

    it('should handle multiple nonce generations for different addresses', () => {
      crypto.randomBytes
        .mockReturnValueOnce({ toString: () => 'nonce-1' })
        .mockReturnValueOnce({ toString: () => 'nonce-2' });

      const result1 = generateAuthNonce('0x1111111111111111111111111111111111111111');
      const result2 = generateAuthNonce('0x2222222222222222222222222222222222222222');

      expect(result1.nonce).toBe('nonce-1');
      expect(result2.nonce).toBe('nonce-2');
      expect(result1.timestamp).toBe(result2.timestamp); // Same mock time
    });
  });

  describe('verifyAuthSignature', () => {
    const mockWalletAddress = '0x1234567890123456789012345678901234567890';
    const mockWeb3AuthId = 'web3auth-user-id';
    const mockSignature = '0x1234...signature';

    beforeEach(() => {
      // Generate a nonce first to populate the store
      crypto.randomBytes.mockReturnValue({
        toString: () => 'test-nonce-hex'
      });
      generateAuthNonce(mockWalletAddress);
    });

    it('should successfully verify valid signature', () => {
      ethers.verifyMessage.mockReturnValue(mockWalletAddress);

      const result = verifyAuthSignature(mockWalletAddress, mockSignature, mockWeb3AuthId);

      expect(result).toBe(true);
      expect(ethers.verifyMessage).toHaveBeenCalledWith(
        `Sign this message to authenticate with Rhizome.\n\nNonce: test-nonce-hex\nWeb3Auth ID: ${mockWeb3AuthId}\nTimestamp: 2023-10-01T10:00:00.000Z`,
        mockSignature
      );
    });

    it('should fail verification for address mismatch', () => {
      const differentAddress = '0x9999999999999999999999999999999999999999';
      ethers.verifyMessage.mockReturnValue(differentAddress);

      const result = verifyAuthSignature(mockWalletAddress, mockSignature, mockWeb3AuthId);

      expect(result).toBe(false);
    });

    it('should fail verification when nonce not found', () => {
      const unknownWallet = '0x5555555555555555555555555555555555555555';

      const result = verifyAuthSignature(unknownWallet, mockSignature, mockWeb3AuthId);

      expect(result).toBe(false);
      expect(ethers.verifyMessage).not.toHaveBeenCalled();
    });

    it('should fail verification when nonce expired', () => {
      // Mock current time to be 6 minutes later (past expiry)
      const expiredTime = new Date('2023-10-01T10:00:00Z').getTime() + (6 * 60 * 1000);
      Date.now.mockReturnValue(expiredTime);

      const result = verifyAuthSignature(mockWalletAddress, mockSignature, mockWeb3AuthId);

      expect(result).toBe(false);
      expect(ethers.verifyMessage).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive wallet address comparison', () => {
      const upperCaseWallet = mockWalletAddress.toUpperCase();
      const lowerCaseRecovered = mockWalletAddress.toLowerCase();
      
      ethers.verifyMessage.mockReturnValue(lowerCaseRecovered);

      const result = verifyAuthSignature(upperCaseWallet, mockSignature, mockWeb3AuthId);

      expect(result).toBe(true);
    });

    it('should clean up nonce after successful verification', () => {
      ethers.verifyMessage.mockReturnValue(mockWalletAddress);

      // First verification should succeed
      const result1 = verifyAuthSignature(mockWalletAddress, mockSignature, mockWeb3AuthId);
      expect(result1).toBe(true);

      // Second verification should fail (nonce cleaned up)
      const result2 = verifyAuthSignature(mockWalletAddress, mockSignature, mockWeb3AuthId);
      expect(result2).toBe(false);
    });

    it('should clean up nonce after failed verification due to expiry', () => {
      // Mock expired time
      const expiredTime = new Date('2023-10-01T10:00:00Z').getTime() + (6 * 60 * 1000);
      Date.now.mockReturnValue(expiredTime);

      const result = verifyAuthSignature(mockWalletAddress, mockSignature, mockWeb3AuthId);

      expect(result).toBe(false);
      
      // Reset time and try again - should still fail because nonce was cleaned up
      Date.now.mockReturnValue(new Date('2023-10-01T10:00:00Z').getTime());
      const result2 = verifyAuthSignature(mockWalletAddress, mockSignature, mockWeb3AuthId);
      expect(result2).toBe(false);
    });

    it('should handle ethers.verifyMessage throwing error', () => {
      ethers.verifyMessage.mockImplementation(() => {
        throw new Error('Invalid signature format');
      });

      const result = verifyAuthSignature(mockWalletAddress, mockSignature, mockWeb3AuthId);

      expect(result).toBe(false);
    });

    it('should build correct message format', () => {
      ethers.verifyMessage.mockReturnValue(mockWalletAddress);

      verifyAuthSignature(mockWalletAddress, mockSignature, mockWeb3AuthId);

      const expectedMessage = [
        'Sign this message to authenticate with Rhizome.',
        '',
        'Nonce: test-nonce-hex',
        `Web3Auth ID: ${mockWeb3AuthId}`,
        'Timestamp: 2023-10-01T10:00:00.000Z'
      ].join('\n');

      expect(ethers.verifyMessage).toHaveBeenCalledWith(expectedMessage, mockSignature);
    });
  });

  describe('Integration - Nonce Generation and Verification Flow', () => {
    it('should successfully complete full authentication flow', () => {
      const walletAddress = '0xABCD1234567890ABCD1234567890ABCD12345678';
      const web3authId = 'test-web3auth-id';
      const signature = '0xsignature-data';

      // Mock crypto for nonce generation
      crypto.randomBytes.mockReturnValue({
        toString: () => 'integration-test-nonce'
      });

      // Mock ethers for signature verification
      ethers.verifyMessage.mockReturnValue(walletAddress);

      // 1. Generate nonce
      const nonceResult = generateAuthNonce(walletAddress);
      expect(nonceResult.nonce).toBe('integration-test-nonce');
      expect(nonceResult.timestamp).toBe('2023-10-01T10:00:00.000Z');

      // 2. Verify signature
      const verifyResult = verifyAuthSignature(walletAddress, signature, web3authId);
      expect(verifyResult).toBe(true);

      // 3. Verify nonce is cleaned up
      const verifyResult2 = verifyAuthSignature(walletAddress, signature, web3authId);
      expect(verifyResult2).toBe(false);
    });

    it('should handle multiple concurrent authentications', () => {
      const wallet1 = '0x1111111111111111111111111111111111111111';
      const wallet2 = '0x2222222222222222222222222222222222222222';
      const web3authId = 'test-id';
      const signature = '0xsig';

      crypto.randomBytes
        .mockReturnValueOnce({ toString: () => 'nonce-1' })
        .mockReturnValueOnce({ toString: () => 'nonce-2' });

      // Generate nonces for both wallets
      const nonce1 = generateAuthNonce(wallet1);
      const nonce2 = generateAuthNonce(wallet2);

      expect(nonce1.nonce).toBe('nonce-1');
      expect(nonce2.nonce).toBe('nonce-2');

      // Both should be able to verify independently
      ethers.verifyMessage.mockReturnValue(wallet1);
      expect(verifyAuthSignature(wallet1, signature, web3authId)).toBe(true);

      ethers.verifyMessage.mockReturnValue(wallet2);
      expect(verifyAuthSignature(wallet2, signature, web3authId)).toBe(true);
    });
  });
});