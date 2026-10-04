import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const productionApiUrl = 'https://placement-dcrust.onrender.com/api';
const apiBaseUrl = import.meta.env.PROD
  ? (configuredApiUrl && /^https?:\/\//i.test(configuredApiUrl)
    ? configuredApiUrl
    : productionApiUrl)
  : (configuredApiUrl || '/api');

export const axiosClient = axios.create({
  // Vercel's SPA rewrite also catches /api/*, so production must use the
  // separate Render API origin, even if Vercel has a stale relative value.
  baseURL: apiBaseUrl,
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
