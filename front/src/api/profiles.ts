// Profiles API endpoints
import client, { handleError } from "./client";

/**
 * Get all profiles (from all users, for selecting collaborators/clients)
 * @returns {Promise} Axios response promise
 */
export const getAllProfiles = async () => {
  try {
    const response = await client.get("/profiles/all");
    return response.data;
  } catch (error) {
    return handleError(error, "118304");
  }
};

/**
 * Get current user's profiles only
 * @returns {Promise} Axios response promise
 */
export const getUserProfiles = async () => {
  try {
    const response = await client.get("/profiles");
    return response.data;
  } catch (error) {
    return handleError(error, "118305");
  }
};

/**
 * Get profile by ID
 * @param {string} profileId - Profile ID
 * @returns {Promise} Axios response promise
 */
export const getProfileById = async (profileId) => {
  try {
    const response = await client.get(`/profiles/${profileId}`);
    return response.data;
  } catch (error) {
    return handleError(error, "455354");
  }
};

/**
 * Get profile by username
 * @param {string} username - Profile username
 * @returns {Promise} Axios response promise
 */
export const getProfileByUsername = async (username) => {
  try {
    const response = await client.get(`/profiles/username/${username}`);
    return { profile: response.data, error: null };
  } catch (error) {
    return handleError(error, "800313");
  }
};

/**
 * Create new profile
 * @param {Object} profile - Profile data
 * @returns {Promise} Axios response promise
 */
export const createProfile = async (profile) => {
  try {
    const response = await client.post("/profiles", profile);
    return response.data;
  } catch (error) {
    return handleError(error, "806774");
  }
};

/**
 * Update profile
 * @param {string} profileId - Profile ID
 * @param {Object} payload - Updated profile data
 * @returns {Promise} Axios response promise
 */
export const updateProfile = async (profileId, payload) => {
  try {
    const response = await client.patch(`/profiles/${profileId}`, payload);
    return response.data;
  } catch (error) {
    return handleError(error, "184548");
  }
};

/**
 * Check if username is available
 * @param {string} username - Username to check
 * @returns {Promise} Axios response promise
 */
export const checkUsernameAvailable = async (username) => {
  try {
    const response = await client.get(`/profiles/check-username-available/${username}`);
    return { ...response.data };
  } catch (error) {
    return handleError(error, "327748");
  }
};