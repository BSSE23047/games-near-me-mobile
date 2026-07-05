import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

// For mobile devices, use your computer's IP address instead of localhost
// Find your IP: Windows (ipconfig) or Mac/Linux (ifconfig)
// Example: http://192.168.1.100:3000
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Log API URL for debugging (remove in production)
if (__DEV__) {
  console.log('API Base URL:', API_BASE_URL);
}

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log error details in development
    if (__DEV__) {
      console.error('API Error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    }

    if (error.response?.status === 401) {
      // Let the caller show a message first; then sign out so user can re-login
      const authStore = useAuthStore.getState();
      setTimeout(() => authStore.signOut(), 100);
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const timeoutError = new Error('Request timeout - check if backend is running');
      return Promise.reject(timeoutError);
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      const networkError = new Error('Network error - check API URL and backend connection');
      return Promise.reject(networkError);
    }

    return Promise.reject(error);
  }
);




