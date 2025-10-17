import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from '../project.service';

// Mock dependencies
const mockProjectsApi = {
  signProject: vi.fn(),
  getProjectById: vi.fn(),
  getProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
};

const mockAuthService = {
  refreshSession: vi.fn(),
};

const mockDependencies = {
  projectsApi: mockProjectsApi,
  authService: mockAuthService,
};

// Mock external dependencies
vi.mock('@/services/web3auth.service', () => ({
  default: {
    signMessage: vi.fn(),
    getAddress: vi.fn(),
  }
}));

vi.mock('@utils/crypto', () => ({
  verifySignature: vi.fn(),
}));

vi.mock('@/utils/slugUtils', () => ({
  extractIdFromSlug: vi.fn(),
}));

vi.mock('@/utils/projectTransformers', () => ({
  transformDatabaseProject: vi.fn(),
}));

vi.mock('@config', () => ({
  default: {
    IN_PROD: false,
  }
}));

describe('ProjectService', () => {
  let projectService: ProjectService;

  beforeEach(() => {
    projectService = new ProjectService(mockDependencies);
    vi.clearAllMocks();
  });

  describe('loadProject', () => {
    it('should handle project loading with slug extraction', async () => {
      const { extractIdFromSlug } = await import('@/utils/slugUtils');
      const { transformDatabaseProject } = await import('@/utils/projectTransformers');

      const projectIdWithSlug = 'uuid-123-project-title-slug';
      const cleanId = 'uuid-123';
      const mockApiResponse = {
        data: {
          id: 'uuid-123',
          title: 'Test Project',
          description: 'Test Description',
        },
      };
      const mockTransformedProject = {
        id: 'uuid-123',
        title: 'Test Project',
        description: 'Test Description',
        author: {},
        participants: [],
      };

      (extractIdFromSlug as any).mockReturnValue(cleanId);
      mockProjectsApi.getProjectById.mockResolvedValue(mockApiResponse);
      (transformDatabaseProject as any).mockReturnValue(mockTransformedProject);

      const result = await projectService.loadProject(projectIdWithSlug);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTransformedProject);
      expect(extractIdFromSlug).toHaveBeenCalledWith(projectIdWithSlug);
      expect(mockProjectsApi.getProjectById).toHaveBeenCalledWith(cleanId);
      expect(transformDatabaseProject).toHaveBeenCalledWith(mockApiResponse.data);
    });

    it('should handle project not found', async () => {
      mockProjectsApi.getProjectById.mockResolvedValue(null);

      const result = await projectService.loadProject('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Project not found');
    });

    it('should handle API errors gracefully', async () => {
      mockProjectsApi.getProjectById.mockRejectedValue(new Error('API Error'));

      const result = await projectService.loadProject('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load project');
    });
  });

  describe('loadProjects', () => {
    it('should handle successful projects loading', async () => {
      const { transformDatabaseProject } = await import('@/utils/projectTransformers');

      const mockFilters = { category: 'development' };
      const mockApiResponse = {
        data: [
          { id: '1', title: 'Project 1' },
          { id: '2', title: 'Project 2' },
        ],
      };
      const mockTransformedProjects = [
        { id: '1', title: 'Project 1', participants: [] },
        { id: '2', title: 'Project 2', participants: [] },
      ];

      mockProjectsApi.getProjects.mockResolvedValue(mockApiResponse);
      (transformDatabaseProject as any)
        .mockReturnValueOnce(mockTransformedProjects[0])
        .mockReturnValueOnce(mockTransformedProjects[1]);

      const result = await projectService.loadProjects(mockFilters);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTransformedProjects);
      expect(mockProjectsApi.getProjects).toHaveBeenCalledWith(mockFilters);
      expect(transformDatabaseProject).toHaveBeenCalledTimes(2);
    });

    it('should handle no projects found', async () => {
      mockProjectsApi.getProjects.mockResolvedValue(null);

      const result = await projectService.loadProjects();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No projects found');
    });

    it('should handle API errors', async () => {
      mockProjectsApi.getProjects.mockRejectedValue(new Error('Network error'));

      const result = await projectService.loadProjects();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load projects');
    });
  });

  describe('createProject', () => {
    it('should require authentication', async () => {
      mockAuthService.refreshSession.mockResolvedValue({
        success: false,
        error: 'Session expired',
      });

      const result = await projectService.createProject({
        title: 'New Project',
        description: 'Description',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(mockAuthService.refreshSession).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      mockAuthService.refreshSession.mockResolvedValue({
        success: true,
        session: { user: { id: 'test-user' } },
      });

      const result = await projectService.createProject({
        title: '', // Missing title
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Title and description are required');
    });

    it('should handle successful project creation', async () => {
      const { transformDatabaseProject } = await import('@/utils/projectTransformers');

      const mockProjectData = {
        title: 'New Project',
        description: 'New Description',
      };
      const mockApiResponse = {
        success: true,
        data: { id: 'new-id', ...mockProjectData },
      };
      const mockTransformedProject = {
        id: 'new-id',
        title: 'New Project',
        description: 'New Description',
        participants: [],
      };

      mockAuthService.refreshSession.mockResolvedValue({
        success: true,
        session: { user: { id: 'test-user' } },
      });
      mockProjectsApi.createProject.mockResolvedValue(mockApiResponse);
      (transformDatabaseProject as any).mockReturnValue(mockTransformedProject);

      const result = await projectService.createProject(mockProjectData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTransformedProject);
      expect(mockProjectsApi.createProject).toHaveBeenCalledWith(mockProjectData);
    });
  });

  describe('updateProject', () => {
    it('should extract clean ID from slug before updating', async () => {
      const { extractIdFromSlug } = await import('@/utils/slugUtils');
      const { transformDatabaseProject } = await import('@/utils/projectTransformers');

      const projectIdWithSlug = 'uuid-project-slug';
      const cleanId = 'uuid';
      const mockUpdateData = { title: 'Updated Title' };
      const mockApiResponse = {
        success: true,
        data: { id: cleanId, title: 'Updated Title' },
      };
      const mockTransformedProject = {
        id: cleanId,
        title: 'Updated Title',
        participants: [],
      };

      mockAuthService.refreshSession.mockResolvedValue({
        success: true,
        session: { user: { id: 'test-user' } },
      });
      (extractIdFromSlug as any).mockReturnValue(cleanId);
      mockProjectsApi.updateProject.mockResolvedValue(mockApiResponse);
      (transformDatabaseProject as any).mockReturnValue(mockTransformedProject);

      const result = await projectService.updateProject(projectIdWithSlug, mockUpdateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTransformedProject);
      expect(extractIdFromSlug).toHaveBeenCalledWith(projectIdWithSlug);
      expect(mockProjectsApi.updateProject).toHaveBeenCalledWith(cleanId, mockUpdateData);
    });

    it('should handle update failures', async () => {
      mockAuthService.refreshSession.mockResolvedValue({
        success: true,
        session: { user: { id: 'test-user' } },
      });
      mockProjectsApi.updateProject.mockResolvedValue({
        success: false,
        error: 'Update failed',
      });

      const result = await projectService.updateProject('test-id', { title: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });
});