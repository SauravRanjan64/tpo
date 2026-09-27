import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global response interceptor for 401 handling
axiosClient.interceptors.response.use(
  // The Express API consistently envelopes successful payloads in `data`.
  // Keep service modules and page queries independent of transport envelopes.
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
