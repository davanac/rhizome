// API Client - Centralized axios configuration and interceptors
import axios from "axios";
import Config from "@config";
import {
  setSession,
  getSession,
  clearSession,
  refreshSession,
} from "@/hooks/useSession";
import ReRenderer from "@utils/reRenderer";

// Create axios instance with base configuration
const client = axios.create({
  baseURL: Config.API_URL,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Handle HTTP request errors consistently
 * @param {Error} error - Axios error object
 * @param {string} errorKey - Debug identifier
 * @returns {Object} Standardized error response
 */
export function handleError(error, errorKey = "0x000000") {
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      message: "API error",
      fromError: !Config.IN_PROD
        ? error.response?.data || "Unknown error"
        : null,
      errorKey,
    };
  }
  // Network error or server unreachable
  return { success: false, message: "Network error", errorKey: "430541" };
}

// Request interceptor - Add auth token to requests
client.interceptors.request.use(
  (config) => {
    const session = getSession();
    console.log('API Request - Session check:', {
      hasSession: !!session,
      hasAccessToken: !!(session && session.accessToken),
      userId: session?.user?.userId,
      endpoint: config.url
    });
    if (session && session.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => handleError(error, "0x000002")
);

// Response interceptor - Handle token refresh on 401/expired JWT
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('=== API Error === client.js ===');
    console.dir(error, { depth: null, colors: true });
    
    if (error.response?.data?.errorCode === "jwt-expired") {
      const originalRequest = error.config;

      const refreshedSession = await refreshSession();

      if (!refreshedSession?.refreshToken || !refreshedSession?.accessToken) {
        clearSession();
        ReRenderer.render();
        return {
          success: false,
          message: "Refresh token error",
          errorCode: "refresh-token-error",
          errorKey: "259378",
        };
      }

      originalRequest.headers.Authorization = `Bearer ${refreshedSession.accessToken}`;
      return client(originalRequest);
    }

    return error.response;
  }
);

export default client;