// Projects API endpoints
import client, { handleError } from "./client";
import { extractIdFromSlug } from "@/utils/slugify.ts";
import { transformDatabaseProject } from "@/utils/projectTransformers.ts";

/**
 * Get all projects
 * @returns {Promise} Axios response promise
 */
export const getAllProjects = async () => {
  try {
    const response = await client.get("/projects");
    return response.data;
  } catch (error) {
    return handleError(error, "735897");
  }
};

/**
 * Get projects by profile ID
 * @param {string} profileId - Profile ID
 * @returns {Promise} Axios response promise
 */
export const getAllProjectsByProfileID = async (profileId) => {
  try {
    const response = await client.get(`/projects/profile/${profileId}`);
    return { projects: response.data, error: null };
  } catch (error) {
    return handleError(error, "243378");
  }
};

/**
 * Get project by ID
 * @param {string} projectId - Project ID (can be UUID or slug)
 * @returns {Promise} Axios response promise
 */
export const getProjectById = async (projectId) => {
  try {
    // Extract UUID from slug if needed
    const cleanProjectId = extractIdFromSlug(projectId) || projectId;
    const response = await client.get(`/projects/${cleanProjectId}`);
    
    // Handle error response
    if (response.data && response.data.success === false) {
      return response.data;
    }
    
    // Transform database project to frontend format
    const transformed = transformDatabaseProject(response.data);
    return transformed;
  } catch (error) {
    return handleError(error, "666837");
  }
};

/**
 * Create new project
 * @param {Object} payload - Project data
 * @returns {Promise} Axios response promise
 */
export const createProject = async (payload) => {
  try {
    const response = await client.post("/projects", payload);
    return response.data;
  } catch (error) {
    return handleError(error, "249905");
  }
};

/**
 * Create new project (alternative endpoint)
 * @param {Object} payload - Project data
 * @returns {Promise} Axios response promise
 */
export const newProject = async (payload) => {
  try {
    const response = await client.post("/projects", payload);
    return response.data;
  } catch (error) {
    return handleError(error, "861164");
  }
};

/**
 * Update project
 * @param {string} projectId - Project ID (can be UUID or slug)
 * @param {Object} payload - Updated project data
 * @returns {Promise} Axios response promise
 */
export const updateProject = async (projectId, payload) => {
  try {
    // Extract UUID from slug if needed
    const cleanProjectId = extractIdFromSlug(projectId) || projectId;
    const response = await client.patch(`/projects/update/${cleanProjectId}`, payload);
    return response.data;
  } catch (error) {
    return handleError(error, "223754");
  }
};

/**
 * Update project status
 * @param {string} projectId - Project ID (can be UUID or slug)
 * @param {Object} payload - Status data
 * @returns {Promise} Axios response promise
 */
export const updateProjectStatus = async (projectId, payload) => {
  try {
    // Extract UUID from slug if needed
    const cleanProjectId = extractIdFromSlug(projectId) || projectId;
    const response = await client.patch(`/projects/status/${cleanProjectId}`, payload);
    return response.data;
  } catch (error) {
    return handleError(error, "661971");
  }
};

/**
 * Sign project
 * @param {Object} payload - Signature data with projectId
 * @returns {Promise} Axios response promise
 */
export const signProject = async (payload) => {
  try {
    // Extract UUID from slug if needed
    const cleanProjectId = extractIdFromSlug(payload.projectId) || payload.projectId;
    const response = await client.patch(`/projects/sign/${cleanProjectId}`, payload);
    return response.data;
  } catch (error) {
    return handleError(error, "661971");
  }
};