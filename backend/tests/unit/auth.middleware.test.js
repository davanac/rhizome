import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  authenticateUser, 
  extractUserId, 
  requireAdmin, 
  requireProfileOwnership,
  requireProjectOwnership,
  requireProjectParticipation 
} from '../../src/middleware/auth.middleware.js';

// Mock dependencies
vi.mock('#utils/auth/jwt.js');
vi.mock('#config');
vi.mock('#database/database.js');
vi.mock('#services/profiles.service.js');

describe('Authentication Middleware Unit Tests', () => {
  let mockReq, mockReply;
  let mockJwtUtil, mockPool, mockProfilesService, mockConfig;

  beforeEach(async () => {
    // Setup mocks
    const jwt = await import('#utils/auth/jwt.js');
    const config = await import('#config');
    const pool = await import('#database/database.js');
    const profilesService = await import('#services/profiles.service.js');

    mockJwtUtil = jwt;
    mockConfig = config.default;
    mockPool = pool.default;
    mockProfilesService = profilesService;

    // Reset mocks
    vi.clearAllMocks();

    // Setup mock objects
    mockReq = { 
      headers: {},
      params: {},
      user: null
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

  describe('authenticateUser', () => {
    it('should reject request without authorization header', async () => {
      await authenticateUser(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Missing or invalid token',
        errorKey: 173158,
        errorCode: 'missing-or-invalid-token'
      });
    });

    it('should reject request with invalid authorization header format', async () => {
      mockReq.headers.authorization = 'InvalidHeader token123';
      
      await authenticateUser(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Missing or invalid token',
        errorKey: 173158,
        errorCode: 'missing-or-invalid-token'
      });
    });

    it('should reject request with invalid JWT token', async () => {
      mockReq.headers.authorization = 'Bearer invalidtoken';
      mockJwtUtil.verifyToken.mockReturnValue({
        success: false,
        errorCode: 'jwt-invalid'
      });

      await authenticateUser(mockReq, mockReply);

      expect(mockJwtUtil.verifyToken).toHaveBeenCalledWith('invalidtoken');
      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Invalid token',
        errorKey: 721296,
        errorCode: 'jwt-invalid',
        fromError: { success: false, errorCode: 'jwt-invalid' }
      });
    });

    it('should reject request for disabled user', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      mockJwtUtil.verifyToken.mockReturnValue({
        userId: 'user123',
        isAdmin: false
      });
      mockPool.query.mockResolvedValue({
        rows: [{ is_enabled: false }]
      });

      await authenticateUser(mockReq, mockReply);

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT is_enabled FROM public.users WHERE id = $1',
        ['user123']
      );
      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - User account disabled',
        errorKey: 721297,
        errorCode: 'user-disabled'
      });
    });

    it('should reject request for non-existent user', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      mockJwtUtil.verifyToken.mockReturnValue({
        userId: 'user123',
        isAdmin: false
      });
      mockPool.query.mockResolvedValue({ rows: [] });

      await authenticateUser(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - User account disabled',
        errorKey: 721297,
        errorCode: 'user-disabled'
      });
    });

    it('should successfully authenticate valid user', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      mockJwtUtil.verifyToken.mockReturnValue({
        userId: 'user123',
        isAdmin: true
      });
      mockPool.query.mockResolvedValue({
        rows: [{ is_enabled: true }]
      });

      await authenticateUser(mockReq, mockReply);

      expect(mockReq.user).toEqual({
        userId: 'user123',
        isAdmin: true
      });
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      mockJwtUtil.verifyToken.mockReturnValue({
        userId: 'user123',
        isAdmin: false
      });
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await authenticateUser(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Token verification failed',
        errorKey: 899489,
        errorCode: 'jwt-expired'
      });
    });
  });

  describe('extractUserId', () => {
    it('should set user to null when no authorization header', async () => {
      await extractUserId(mockReq, mockReply);

      expect(mockReq.user).toBe(null);
      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalidtoken';
      mockJwtUtil.verifyToken.mockReturnValue({
        success: false,
        errorCode: 'jwt-expired'
      });

      await extractUserId(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Invalid token',
        errorKey: 408635,
        errorCode: 'jwt-expired',
        fromError: { success: false, errorCode: 'jwt-expired' }
      });
    });

    it('should set user to null for disabled user without error', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      mockJwtUtil.verifyToken.mockReturnValue({
        userId: 'user123',
        isAdmin: false
      });
      mockPool.query.mockResolvedValue({
        rows: [{ is_enabled: false }]
      });

      await extractUserId(mockReq, mockReply);

      expect(mockReq.user).toBe(null);
      expect(mockReply.status).not.toHaveBeenCalled();
    });

    it('should successfully extract user ID', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      mockJwtUtil.verifyToken.mockReturnValue({
        userId: 'user123',
        isAdmin: false
      });
      mockPool.query.mockResolvedValue({
        rows: [{ is_enabled: true }]
      });

      await extractUserId(mockReq, mockReply);

      expect(mockReq.user).toEqual({
        userId: 'user123',
        isAdmin: false
      });
    });
  });

  describe('requireAdmin', () => {
    it('should reject unauthenticated user', async () => {
      mockReq.user = null;

      await requireAdmin(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Authentication required',
        errorKey: 401001,
        errorCode: 'authentication-required'
      });
    });

    it('should reject non-admin user', async () => {
      mockReq.user = { userId: 'user123', isAdmin: false };

      await requireAdmin(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden - Admin access required',
        errorKey: 403001,
        errorCode: 'admin-access-required'
      });
    });

    it('should allow admin user', async () => {
      mockReq.user = { userId: 'admin123', isAdmin: true };

      await requireAdmin(mockReq, mockReply);

      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockReq.user = { userId: 'admin123', isAdmin: true };
      // Simulate an error by making the middleware throw
      const originalUser = mockReq.user;
      Object.defineProperty(mockReq, 'user', {
        get: () => { throw new Error('Test error'); }
      });

      await requireAdmin(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error during admin verification',
        errorKey: 500001,
        errorCode: 'admin-verification-error'
      });
    });
  });

  describe('requireProfileOwnership', () => {
    beforeEach(() => {
      mockReq.params = { profileId: 'profile123' };
      mockReq.user = { userId: 'user123', isAdmin: false };
    });

    it('should reject unauthenticated user', async () => {
      mockReq.user = null;

      await requireProfileOwnership(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Authentication required',
        errorKey: 401003,
        errorCode: 'authentication-required'
      });
    });

    it('should reject request without profileId', async () => {
      mockReq.params = {};

      await requireProfileOwnership(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Bad Request - Profile ID required',
        errorKey: 400001,
        errorCode: 'profile-id-required'
      });
    });

    it('should reject when profile not found', async () => {
      mockProfilesService.getProfileById.mockResolvedValue(null);

      await requireProfileOwnership(mockReq, mockReply);

      expect(mockProfilesService.getProfileById).toHaveBeenCalledWith('profile123');
      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Profile not found',
        errorKey: 404001,
        errorCode: 'profile-not-found'
      });
    });

    it('should reject when user is not profile owner', async () => {
      mockProfilesService.getProfileById.mockResolvedValue({
        id: 'profile123',
        user_id: 'otheruser456'
      });

      await requireProfileOwnership(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden - You do not have access to this profile',
        errorKey: 403003,
        errorCode: 'profile-access-denied'
      });
    });

    it('should allow profile owner', async () => {
      const profile = {
        id: 'profile123',
        user_id: 'user123'
      };
      mockProfilesService.getProfileById.mockResolvedValue(profile);

      await requireProfileOwnership(mockReq, mockReply);

      expect(mockReq.profile).toEqual(profile);
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });

  describe('requireProjectOwnership', () => {
    beforeEach(() => {
      mockReq.params = { projectId: 'project123' };
      mockReq.user = { userId: 'user123', isAdmin: false };
    });

    it('should reject unauthenticated user', async () => {
      mockReq.user = null;

      await requireProjectOwnership(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Authentication required',
        errorKey: 401004,
        errorCode: 'authentication-required'
      });
    });

    it('should reject request without projectId', async () => {
      mockReq.params = {};

      await requireProjectOwnership(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Bad Request - Project ID required',
        errorKey: 400002,
        errorCode: 'project-id-required'
      });
    });

    it('should reject when project not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await requireProjectOwnership(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Project not found',
        errorKey: 404002,
        errorCode: 'project-not-found'
      });
    });

    it('should reject when project has no owner', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'project123', owner_user_id: null }]
      });

      await requireProjectOwnership(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Project has no owner assigned',
        errorKey: 500001,
        errorCode: 'project-no-owner'
      });
    });

    it('should reject when user is not project owner', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'project123', owner_user_id: 'otheruser456' }]
      });

      await requireProjectOwnership(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden - You do not have access to this project',
        errorKey: 403005,
        errorCode: 'project-access-denied'
      });
    });

    it('should allow project owner', async () => {
      const project = { id: 'project123', owner_user_id: 'user123' };
      mockPool.query.mockResolvedValue({ rows: [project] });

      await requireProjectOwnership(mockReq, mockReply);

      expect(mockReq.project).toEqual(project);
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });

  describe('requireProjectParticipation', () => {
    beforeEach(() => {
      mockReq.params = { projectId: 'project123' };
      mockReq.user = { userId: 'user123', isAdmin: false };
    });

    it('should reject unauthenticated user', async () => {
      mockReq.user = null;

      await requireProjectParticipation(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized - Authentication required',
        errorKey: 401005,
        errorCode: 'authentication-required'
      });
    });

    it('should reject request without projectId', async () => {
      mockReq.params = {};

      await requireProjectParticipation(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Bad Request - Project ID required',
        errorKey: 400003,
        errorCode: 'project-id-required'
      });
    });

    it('should reject when user is not a participant', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await requireProjectParticipation(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden - You are not a participant of this project',
        errorKey: 403006,
        errorCode: 'project-participation-required'
      });
    });

    it('should allow project participant', async () => {
      const participation = {
        project_id: 'project123',
        user_id: 'user123',
        role_name: 'Collaborator'
      };
      mockPool.query.mockResolvedValue({ rows: [participation] });

      await requireProjectParticipation(mockReq, mockReply);

      expect(mockReq.participation).toEqual(participation);
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await requireProjectParticipation(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error during authorization check',
        errorKey: 500002,
        errorCode: 'authorization-check-failed'
      });
    });
  });
});