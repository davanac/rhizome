import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../auth.service';

// Mock dependencies
const mockAuthApi = {
  getAuthNonce: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
};

const mockRouter = {
  navigate: vi.fn(),
};

const mockToast = vi.fn();

const mockDependencies = {
  authApi: mockAuthApi,
  profilesApi: {},
  router: mockRouter,
  toast: mockToast,
};

// Mock external modules
vi.mock('@/services/web3auth.service', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    signMessage: vi.fn(),
  }
}));

vi.mock('@utils/reRenderer', () => ({
  default: { render: vi.fn() }
}));

vi.mock('@/hooks/useSession', () => ({
  setSession: vi.fn(),
  clearSession: vi.fn(),
  refreshSession: vi.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockDependencies);
    vi.clearAllMocks();
  });

  describe('hashSHA256', () => {
    it('should generate correct hash length', async () => {
      const result = await authService.hashSHA256('test-string');
      
      expect(typeof result).toBe('string');
      expect(result.length).toBe(64); // SHA256 hash length in hex
    });

    it('should generate different hashes for different inputs', async () => {
      const hash1 = await authService.hashSHA256('test1');
      const hash2 = await authService.hashSHA256('test2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate consistent hashes for same input', async () => {
      const hash1 = await authService.hashSHA256('same-input');
      const hash2 = await authService.hashSHA256('same-input');
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('registerUser', () => {
    it('should hash email and password before sending to API', async () => {
      mockAuthApi.registerRequest.mockResolvedValue({
        success: true,
        data: { userId: 'new-user-id' },
      });

      await authService.registerUser('test@example.com', 'password123', {});

      expect(mockAuthApi.registerRequest).toHaveBeenCalledWith(
        expect.any(String), // hashed email
        expect.any(String), // hashed password
        {}
      );

      // Verify the email and password were hashed (different from originals)
      const callArgs = mockAuthApi.registerRequest.mock.calls[0];
      expect(callArgs[0]).not.toBe('test@example.com');
      expect(callArgs[1]).not.toBe('password123');
      expect(callArgs[0]).toHaveLength(64); // SHA256 hash length
      expect(callArgs[1]).toHaveLength(64); // SHA256 hash length
    });

    it('should show success toast for successful registration', async () => {
      mockAuthApi.registerRequest.mockResolvedValue({
        success: true,
        data: { userId: 'new-user-id' },
      });

      const result = await authService.registerUser('test@example.com', 'password123', {});

      expect(result.success).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès",
      });
    });

    it('should show error toast for failed registration', async () => {
      mockAuthApi.registerRequest.mockResolvedValue({
        success: false,
        error: 'Email already exists',
      });

      const result = await authService.registerUser('test@example.com', 'password123', {});

      expect(result.success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Erreur d'inscription",
        description: "L'inscription a échoué",
        variant: 'destructive',
      });
    });

    it('should handle API errors gracefully', async () => {
      mockAuthApi.registerRequest.mockRejectedValue(new Error('Network error'));

      const result = await authService.registerUser('test@example.com', 'password123', {});

      expect(result.success).toBe(false);
      expect(result.message).toBe('Registration failed');
      expect(result.error).toBe('Network error');
      expect(mockToast).toHaveBeenCalledWith({
        title: "Erreur d'inscription",
        description: "Une erreur inattendue s'est produite",
        variant: 'destructive',
      });
    });
  });
});