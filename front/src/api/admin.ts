// Admin API endpoints
import client, { handleError } from "./client";

// === USER MANAGEMENT ===

/**
 * Get all users (admin only)
 * @returns {Promise} Axios response promise
 */
export const getAllUsers = async () => {
  try {
    const response = await client.get("/admin/users");
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_get_all_users");
  }
};

/**
 * Get user by ID (admin only)
 * @param {string} userId - User ID
 * @returns {Promise} Axios response promise
 */
export const getUserById = async (userId) => {
  try {
    const response = await client.get(`/admin/users/${userId}`);
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_get_user_by_id");
  }
};

/**
 * Toggle user enabled status (admin only)
 * @param {string} userId - User ID
 * @returns {Promise} Axios response promise
 */
export const toggleUserEnabled = async (userId) => {
  try {
    const response = await client.patch(`/admin/users/${userId}/toggle-enabled`);
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_toggle_user_enabled");
  }
};

// === PROJECT MANAGEMENT ===

/**
 * Get all projects (admin only)
 * @returns {Promise} Axios response promise
 */
export const getAllProjects = async () => {
  try {
    const response = await client.get("/admin/projects");
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_get_all_projects");
  }
};

/**
 * Get project by ID (admin only)
 * @param {string} projectId - Project ID
 * @returns {Promise} Axios response promise
 */
export const getProjectById = async (projectId) => {
  try {
    const response = await client.get(`/admin/projects/${projectId}`);
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_get_project_by_id");
  }
};

/**
 * Toggle project visibility (admin only)
 * @param {string} projectId - Project ID
 * @returns {Promise} Axios response promise
 */
export const toggleProjectVisibility = async (projectId) => {
  try {
    const response = await client.patch(`/admin/projects/${projectId}/toggle-visibility`);
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_toggle_project_visibility");
  }
};

// === MINTING OPERATIONS MANAGEMENT ===

/**
 * Get all minting operations (admin only)
 * @param {Object} params - Optional filters
 * @returns {Promise} Axios response promise
 */
export const getAllMintingOperations = async (params?: { status?: string }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);

    const url = `/admin/minting/operations${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
    const response = await client.get(url);
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_get_minting_operations");
  }
};

/**
 * Get failed minting operations (admin only)
 * @returns {Promise} Axios response promise
 */
export const getFailedMintingOperations = async () => {
  try {
    const response = await client.get("/admin/minting/failed");
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_get_failed_minting_operations");
  }
};

/**
 * Get minting operation details (admin only)
 * @param {string} operationId - Operation UUID
 * @returns {Promise} Axios response promise
 */
export const getMintingOperationById = async (operationId: string) => {
  try {
    const response = await client.get(`/admin/minting/${operationId}`);
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_get_minting_operation");
  }
};

/**
 * Retry a failed minting operation (admin only)
 * @param {string} operationId - Operation UUID
 * @returns {Promise} Axios response promise
 */
export const retryMintingOperation = async (operationId: string) => {
  try {
    const response = await client.post(`/admin/minting/${operationId}/retry`);
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_retry_minting_operation");
  }
};

/**
 * Get minting history for a project (admin only)
 * @param {string} projectId - Project UUID
 * @returns {Promise} Axios response promise
 */
export const getProjectMintingHistory = async (projectId: string) => {
  try {
    const response = await client.get(`/admin/projects/${projectId}/minting-history`);
    return { data: response.data, error: null };
  } catch (error) {
    return handleError(error, "admin_get_project_minting_history");
  }
};