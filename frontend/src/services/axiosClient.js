import axios from 'axios';
import { handleMockRequest } from './mock/mockAdapter';

export const useMockTransport = import.meta.env.VITE_USE_MOCK === 'true';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage for reliable cross-domain authentication
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dcrust_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If USE_MOCK is enabled, intercept calls through the in-browser mock router
if (useMockTransport) {
  axiosClient.interceptors.request.use(async (config) => {
    // Return a custom adapter that invokes our local mock adapter
    config.adapter = async (cfg) => {
      try {
        const response = await handleMockRequest(cfg);
        if (response.status >= 200 && response.status < 300) {
          return {
            data: response.data,
            status: response.status,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        } else {
          const error = new Error(response.data?.message || 'Request failed');
          error.response = {
            data: response.data,
            status: response.status,
            statusText: 'Error',
            headers: {},
            config: cfg,
          };
          throw error;
        }
      } catch (err) {
        throw err;
      }
    };
    return config;
  });
}

// Global response interceptor for 401 handling
axiosClient.interceptors.response.use(
  // The Express API consistently envelopes successful payloads in `data`.
  // Keep service modules and page queries independent of that transport detail;
  // mock responses are already unwrapped and remain supported for demo mode.
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    // If 401 and not already on /login, we let AuthContext handle session state
    return Promise.reject(error);
  }
);

export default axiosClient;
