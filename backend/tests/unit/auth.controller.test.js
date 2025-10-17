import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getAuthNonce } from '../../src/controllers/auth.controller.js';

// Mock dependencies
vi.mock('#services/auth.service.js');
vi.mock('#config');

describe('Auth Controller Unit Tests', () => {
  let mockReq, mockReply;
  let mockAuthService, mockConfig;

  beforeEach(async () => {
    const authService = await import('#services/auth.service.js');
    const config = await import('#config');
    
    mockAuthService = authService;
    mockConfig = config.default;

    // Reset mocks
    vi.clearAllMocks();

    // Setup mock objects
    mockReq = { 
      body: {}
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    };

    // Default config
    mockConfig.IN_PROD = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAuthNonce', () => {
    describe('Input Validation', () => {
      it('should reject request without wallet address', async () => {
        mockReq.body = {};

        await getAuthNonce(mockReq, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: "Wallet address required",
          errorKey: 164407,
        });
        expect(mockAuthService.generateAuthNonce).not.toHaveBeenCalled();
      });

      it('should reject request with null wallet address', async () => {
        mockReq.body = { walletAddress: null };

        await getAuthNonce(mockReq, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: "Wallet address required",
          errorKey: 164407,
        });
      });

      it('should reject request with empty string wallet address', async () => {
        mockReq.body = { walletAddress: '' };

        await getAuthNonce(mockReq, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: "Wallet address required",
          errorKey: 164407,
        });
      });
    });

    describe('Wallet Address Format Validation', () => {
      it('should reject invalid wallet address format - no 0x prefix', async () => {
        mockReq.body = { walletAddress: '1234567890123456789012345678901234567890' };

        await getAuthNonce(mockReq, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid wallet address format",
          errorKey: 164408,
        });
        expect(mockAuthService.generateAuthNonce).not.toHaveBeenCalled();
      });

      it('should reject invalid wallet address format - wrong length (too short)', async () => {
        mockReq.body = { walletAddress: '0x123456789012345678901234567890123456789' }; // 39 chars after 0x

        await getAuthNonce(mockReq, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid wallet address format",
          errorKey: 164408,
        });
      });

      it('should reject invalid wallet address format - wrong length (too long)', async () => {
        mockReq.body = { walletAddress: '0x12345678901234567890123456789012345678901' }; // 41 chars after 0x

        await getAuthNonce(mockReq, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid wallet address format",
          errorKey: 164408,
        });
      });

      it('should reject invalid wallet address format - non-hex characters', async () => {
        mockReq.body = { walletAddress: '0x123456789012345678901234567890123456789G' }; // G is not hex

        await getAuthNonce(mockReq, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid wallet address format",
          errorKey: 164408,
        });
      });

      it('should accept valid lowercase wallet address', async () => {
        const validAddress = '0x1234567890123456789012345678901234567890';
        mockReq.body = { walletAddress: validAddress };
        mockAuthService.generateAuthNonce.mockReturnValue({
          nonce: 'test-nonce',
          timestamp: '2023-10-01T10:00:00.000Z'
        });

        await getAuthNonce(mockReq, mockReply);

        expect(mockAuthService.generateAuthNonce).toHaveBeenCalledWith(validAddress);
        expect(mockReply.status).not.toHaveBeenCalled();
      });

      it('should accept valid uppercase wallet address', async () => {
        const validAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
        mockReq.body = { walletAddress: validAddress };
        mockAuthService.generateAuthNonce.mockReturnValue({
          nonce: 'test-nonce',
          timestamp: '2023-10-01T10:00:00.000Z'
        });

        await getAuthNonce(mockReq, mockReply);

        expect(mockAuthService.generateAuthNonce).toHaveBeenCalledWith(validAddress);
        expect(mockReply.status).not.toHaveBeenCalled();
      });

      it('should accept valid mixed case wallet address', async () => {
        const validAddress = '0x1a2B3c4D5e6F7890123456789012345678901234';
        mockReq.body = { walletAddress: validAddress };
        mockAuthService.generateAuthNonce.mockReturnValue({
          nonce: 'test-nonce',
          timestamp: '2023-10-01T10:00:00.000Z'
        });

        await getAuthNonce(mockReq, mockReply);

        expect(mockAuthService.generateAuthNonce).toHaveBeenCalledWith(validAddress);
      });
    });

    describe('Successful Nonce Generation', () => {
      it('should successfully generate nonce for valid wallet address', async () => {
        const validAddress = '0x1234567890123456789012345678901234567890';
        const mockNonceData = {
          nonce: 'abcdef1234567890',
          timestamp: '2023-10-01T10:00:00.000Z'
        };
        
        mockReq.body = { walletAddress: validAddress };
        mockAuthService.generateAuthNonce.mockReturnValue(mockNonceData);

        await getAuthNonce(mockReq, mockReply);

        expect(mockAuthService.generateAuthNonce).toHaveBeenCalledWith(validAddress);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          nonce: mockNonceData.nonce,
          timestamp: mockNonceData.timestamp,
          messageTemplate: "Sign this message to authenticate with Rhizome.\n\nNonce: {nonce}\nWeb3Auth ID: {web3authId}\nTimestamp: {timestamp}"
        });
        expect(mockReply.status).not.toHaveBeenCalled();
      });

      it('should return correct message template format', async () => {
        const validAddress = '0x1234567890123456789012345678901234567890';
        mockReq.body = { walletAddress: validAddress };
        mockAuthService.generateAuthNonce.mockReturnValue({
          nonce: 'test-nonce',
          timestamp: 'test-timestamp'
        });

        await getAuthNonce(mockReq, mockReply);

        const expectedTemplate = "Sign this message to authenticate with Rhizome.\n\nNonce: {nonce}\nWeb3Auth ID: {web3authId}\nTimestamp: {timestamp}";
        
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({
            messageTemplate: expectedTemplate
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle service errors gracefully', async () => {
        const validAddress = '0x1234567890123456789012345678901234567890';
        mockReq.body = { walletAddress: validAddress };
        
        mockAuthService.generateAuthNonce.mockImplementation(() => {
          throw new Error('Service error');
        });

        await getAuthNonce(mockReq, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(500);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: "Error generating nonce",
          errorKey: 138269,
          fromError: 'Service error'
        });
      });

      it('should not expose error details in production', async () => {
        mockConfig.IN_PROD = true;
        const validAddress = '0x1234567890123456789012345678901234567890';
        mockReq.body = { walletAddress: validAddress };
        
        mockAuthService.generateAuthNonce.mockImplementation(() => {
          throw new Error('Sensitive error info');
        });

        await getAuthNonce(mockReq, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(500);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: "Error generating nonce",
          errorKey: 138269,
          fromError: null
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle wallet address with extra whitespace', async () => {
        const addressWithSpaces = '  0x1234567890123456789012345678901234567890  ';
        mockReq.body = { walletAddress: addressWithSpaces };

        await getAuthNonce(mockReq, mockReply);

        // Should fail validation because whitespace makes it invalid format
        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid wallet address format",
          errorKey: 164408,
        });
      });

      it('should handle request with additional body parameters', async () => {
        const validAddress = '0x1234567890123456789012345678901234567890';
        mockReq.body = { 
          walletAddress: validAddress,
          extraParam: 'should be ignored',
          anotherParam: 123
        };
        mockAuthService.generateAuthNonce.mockReturnValue({
          nonce: 'test-nonce',
          timestamp: '2023-10-01T10:00:00.000Z'
        });

        await getAuthNonce(mockReq, mockReply);

        // Should still work, only using walletAddress
        expect(mockAuthService.generateAuthNonce).toHaveBeenCalledWith(validAddress);
        expect(mockReply.status).not.toHaveBeenCalled();
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: true })
        );
      });
    });

    describe('Wallet Address Pattern Validation', () => {
      const testCases = [
        { address: '0x0000000000000000000000000000000000000000', valid: true, description: 'zero address' },
        { address: '0xffffffffffffffffffffffffffffffffffffffff', valid: true, description: 'max address' },
        { address: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', valid: true, description: 'uppercase max address' },
        { address: '0x123', valid: false, description: 'too short' },
        { address: '0x', valid: false, description: 'only prefix' },
        { address: 'x1234567890123456789012345678901234567890', valid: false, description: 'missing 0' },
        { address: '1234567890123456789012345678901234567890', valid: false, description: 'no prefix' },
        { address: '0X1234567890123456789012345678901234567890', valid: false, description: 'uppercase X' },
      ];

      testCases.forEach(({ address, valid, description }) => {
        it(`should ${valid ? 'accept' : 'reject'} ${description}: ${address}`, async () => {
          mockReq.body = { walletAddress: address };
          
          if (valid) {
            mockAuthService.generateAuthNonce.mockReturnValue({
              nonce: 'test-nonce',
              timestamp: '2023-10-01T10:00:00.000Z'
            });
          }

          await getAuthNonce(mockReq, mockReply);

          if (valid) {
            expect(mockAuthService.generateAuthNonce).toHaveBeenCalledWith(address);
            expect(mockReply.status).not.toHaveBeenCalled();
          } else {
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
              success: false,
              message: "Invalid wallet address format",
              errorKey: 164408,
            });
            expect(mockAuthService.generateAuthNonce).not.toHaveBeenCalled();
          }
        });
      });
    });
  });
});