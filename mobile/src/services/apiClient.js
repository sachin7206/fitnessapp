import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/api';

// Create axios instance
const BASE_URL = typeof API_CONFIG.API_URL === 'string' ? API_CONFIG.API_URL : 'http://localhost:8080/api';
console.log('API Base URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.TIMEOUT || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Paths that should NOT have auth token attached
const PUBLIC_PATHS = ['/auth/register', '/auth/login', '/auth/forgot-password', '/auth/reset-password'];

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Skip attaching token for public auth endpoints
      const isPublic = PUBLIC_PATHS.some(path => config.url?.includes(path));
      if (isPublic) {
        console.log('API Request (public):', config.url);
        // Remove any stale Authorization header
        delete config.headers.Authorization;
        return config;
      }

      const token = await AsyncStorage.getItem('accessToken');
      console.log('API Request:', config.url, 'Token exists:', !!token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log the actual error for debugging
    console.error('API Error:', originalRequest?.url, 'Status:', error.response?.status, 'Message:', error.response?.data?.message || error.message);

    // Don't retry auth endpoints — they're public and don't need token refresh
    const isAuthEndpoint = PUBLIC_PATHS.some(path => originalRequest?.url?.includes(path));
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${API_CONFIG.API_URL}/auth/refresh`,
            {},
            { headers: { 'Refresh-Token': refreshToken } }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
        // Navigate to login - handled by Redux
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

