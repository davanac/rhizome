// Blockchain API endpoints
import client, { handleError } from "./client";

/**
 * Get NFTs for a specific project
 * @param {string} projectId - Project ID
 * @returns {Promise} Axios response promise
 */
export const getNFTsForProject = async (projectId) => {
  try {
    const response = await client.get(`/blockchain/nfts/project/${projectId}`);
    return response.data;
  } catch (error) {
    return handleError(error, "249998");
  }
};

/**
 * Get NFTs for a specific profile
 * @param {string} profileId - Profile ID
 * @returns {Promise} Axios response promise
 */
export const getNFTsForProfile = async (profileId) => {
  try {
    const response = await client.get(`/blockchain/nfts/profile/${profileId}`);
    return response.data;
  } catch (error) {
    return handleError(error, "500091");
  }
};