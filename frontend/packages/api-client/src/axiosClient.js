import axios from 'axios';

const TOKEN_KEY = 'smartad_token';

const baseURL =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:8080/api';

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    const body = response.data;

    // If the backend didn't use the { success, message, data } envelope,
    // just return the raw payload.
    if (body == null || typeof body !== 'object' || !('success' in body)) {
      return body;
    }

    if (body.success) {
      return body.data;
    }

    const error = new Error(body.message || 'Request failed');
    error.status = response.status;
    error.data = body.data;
    throw error;
  },
  (error) => {
    const responseBody = error.response && error.response.data;
    const message =
      (responseBody && responseBody.message) ||
      error.message ||
      'Network error';

    const normalized = new Error(message);
    normalized.status = error.response ? error.response.status : undefined;
    normalized.data = responseBody ? responseBody.data : undefined;
    normalized.original = error;

    throw normalized;
  }
);

export default axiosClient;
