import web3AuthService from "@/services/web3auth.service";
import { verifySignature } from "@utils/crypto";
import { extractIdFromSlug } from "@/utils/slugUtils";
import { transformDatabaseProject } from "@/utils/projectTransformers";
import Config from "@config";
import type { SignProjectPayload, SignProjectResult, ProjectData, ProjectDependencies } from "./types/project.types";

/**
 * ProjectService - Encapsulates project-related business logic with dependency injection
 */
export class ProjectService {
  constructor(private dependencies: ProjectDependencies) {}

  /**
   * Sign a project with Web3Auth - handles complete signing flow
   * @param payload - Project signing data with projectId, profile, hash
   * @returns Promise resolving to signing result
   */
  async signProject(payload: SignProjectPayload): Promise<SignProjectResult> {
    const { projectsApi, authService } = this.dependencies;

    console.log("ProjectService: SignProject called with payload:", payload);
    
    try {
      // Check if user is logged in via session refresh
      const sessionResult = await authService.refreshSession();
      if (!sessionResult.success) {
        console.log("User not logged in");
        return {
          success: false,
          error: "User not logged in. Please login first."
        };
      }

      // Check if hash exists
      if (!payload.hash || payload.hash.trim() === '') {
        console.log("Empty hash provided:", payload.hash);
        return {
          success: false,
          error: "No project hash provided for signing"
        };
      }

      // Sign the project hash with Web3Auth
      console.log("About to sign hash:", payload.hash);
      const signature = await web3AuthService.signMessage(payload.hash);
      console.log("Signature generated successfully");

      if (!signature) {
        return {
          success: false,
          error: "Failed to sign project with Web3Auth"
        };
      }

      // Get wallet address for verification
      const walletAddress = await web3AuthService.getAddress();
      
      if (!walletAddress) {
        return {
          success: false,
          error: "Failed to get wallet address"
        };
      }

      // Verify the signature
      const verifiedSignature = verifySignature(payload.hash, signature, walletAddress);

      if (verifiedSignature.success === false) {
        return {
          success: false,
          error: "Signature verification failed",
          data: Config.IN_PROD ? null : verifiedSignature
        };
      }

      // Prepare payload for backend
      const backendPayload = {
        ...payload,
        signature: signature,
        walletAddress: walletAddress,
      };

      // Send signed project to backend
      const response = await projectsApi.signProject(backendPayload);
      return response;

    } catch (error) {
      console.error("Error in ProjectService signProject:", error);
      return {
        success: false,
        error: "Project signing failed"
      };
    }
  }

  /**
   * Load project by ID with slug extraction and data transformation
   * @param projectId - Project ID (may contain slug)
   * @returns Promise resolving to transformed project data
   */
  async loadProject(projectId: string): Promise<{ success: boolean; data?: ProjectData; error?: string }> {
    const { projectsApi } = this.dependencies;

    try {
      // Extract UUID from slug if necessary
      const cleanProjectId = extractIdFromSlug(projectId) || projectId;
      
      console.log("Loading project:", { original: projectId, cleaned: cleanProjectId });

      // Get project data from API
      const response = await projectsApi.getProjectById(cleanProjectId);
      
      if (!response || !response.data) {
        return {
          success: false,
          error: "Project not found"
        };
      }

      // Transform database response to frontend format
      const transformedProject = transformDatabaseProject(response.data);
      
      return {
        success: true,
        data: transformedProject
      };

    } catch (error) {
      console.error("Error in ProjectService loadProject:", error);
      return {
        success: false,
        error: "Failed to load project"
      };
    }
  }

  /**
   * Load multiple projects with data transformation
   * @param filters - Optional filters for project query
   * @returns Promise resolving to array of transformed projects
   */
  async loadProjects(filters?: any): Promise<{ success: boolean; data?: ProjectData[]; error?: string }> {
    const { projectsApi } = this.dependencies;

    try {
      const response = await projectsApi.getProjects(filters);
      
      if (!response || !response.data) {
        return {
          success: false,
          error: "No projects found"
        };
      }

      // Transform each project
      const transformedProjects = response.data.map(transformDatabaseProject);
      
      return {
        success: true,
        data: transformedProjects
      };

    } catch (error) {
      console.error("Error in ProjectService loadProjects:", error);
      return {
        success: false,
        error: "Failed to load projects"
      };
    }
  }

  /**
   * Create new project with business logic validation
   * @param projectData - Project creation data
   * @returns Promise resolving to creation result
   */
  async createProject(projectData: any): Promise<{ success: boolean; data?: ProjectData; error?: string }> {
    const { projectsApi, authService } = this.dependencies;

    try {
      // Verify user session
      const sessionResult = await authService.refreshSession();
      if (!sessionResult.success) {
        return {
          success: false,
          error: "Authentication required"
        };
      }

      // Validate required fields
      if (!projectData.title || !projectData.description) {
        return {
          success: false,
          error: "Title and description are required"
        };
      }

      // Create project via API
      const response = await projectsApi.createProject(projectData);
      
      if (response.success) {
        const transformedProject = transformDatabaseProject(response.data);
        return {
          success: true,
          data: transformedProject
        };
      }

      return {
        success: false,
        error: response.error || "Failed to create project"
      };

    } catch (error) {
      console.error("Error in ProjectService createProject:", error);
      return {
        success: false,
        error: "Project creation failed"
      };
    }
  }

  /**
   * Update project with business logic validation
   * @param projectId - Project ID
   * @param updateData - Data to update
   * @returns Promise resolving to update result
   */
  async updateProject(projectId: string, updateData: any): Promise<{ success: boolean; data?: ProjectData; error?: string }> {
    const { projectsApi, authService } = this.dependencies;

    try {
      // Verify user session
      const sessionResult = await authService.refreshSession();
      if (!sessionResult.success) {
        return {
          success: false,
          error: "Authentication required"
        };
      }

      // Extract clean ID from slug
      const cleanProjectId = extractIdFromSlug(projectId) || projectId;

      // Update project via API
      const response = await projectsApi.updateProject(cleanProjectId, updateData);
      
      if (response.success) {
        const transformedProject = transformDatabaseProject(response.data);
        return {
          success: true,
          data: transformedProject
        };
      }

      return {
        success: false,
        error: response.error || "Failed to update project"
      };

    } catch (error) {
      console.error("Error in ProjectService updateProject:", error);
      return {
        success: false,
        error: "Project update failed"
      };
    }
  }

  /**
   * Get all projects for a specific profile
   * @param profileId - Profile ID
   * @returns Promise resolving to projects data
   */
  async getProjectsByProfile(profileId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const { projectsApi } = this.dependencies;

    try {
      if (!profileId) {
        return {
          success: false,
          error: "Profile ID is required"
        };
      }

      console.log('ProjectService: Fetching projects for profile:', profileId);

      // Call API to get all projects by profile ID
      const { projects, error } = await projectsApi.getAllProjectsByProfileID(profileId);

      if (error) {
        return {
          success: false,
          error: error.message || "Failed to fetch projects"
        };
      }

      // Return the structured project data
      return {
        success: true,
        data: {
          teamLeaderProjects: projects?.teamLeaderProjects || [],
          observerProjects: projects?.observerProjects || [],
          contributorProjects: projects?.contributorProjects || []
        }
      };

    } catch (error) {
      console.error("Error in ProjectService getProjectsByProfile:", error);
      return {
        success: false,
        error: "Failed to fetch profile projects"
      };
    }
  }
}