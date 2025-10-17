// Network API endpoints
import client, { handleError } from "./client";

/**
 * Get network data (collaboration graph)
 * @returns {Promise} Axios response promise
 */
export const getNetwork = async () => {
  try {
    const response = await client.get("/network");
    return { projects: response.data, error: null };
  } catch (error) {
    return handleError(error, "614028");
  }
};