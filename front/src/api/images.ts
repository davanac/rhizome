// Images API endpoints
import client, { handleError } from "./client";
import Config from "@config";

/**
 * Upload image file
 * @param {File} file - Image file to upload
 * @returns {Promise} Axios response promise
 */
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await client.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const result = response.data;
    if (result.success === true) {
      return result;
    }
    
    return {
      success: false,
      message: 'API error',
      fromError: result,
      errorKey: "832539",
      errorCode: "image-upload-error"
    };
  } catch (error) {
    return {
      success: false,
      message: 'Network error',
      errorKey: "430541",
      errorCode: "image-upload-error",
      fromError: Config.IN_PROD ? null : error.message || "Unknown error"
    };
  }
};