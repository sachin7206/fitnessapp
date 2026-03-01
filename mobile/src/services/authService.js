import apiClient from './apiClient';
import API_CONFIG from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data.success) {
      const { accessToken, refreshToken, user } = response.data.data;
      console.log('Register success, storing tokens...');
      console.log('AccessToken:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Verify storage
      const storedToken = await AsyncStorage.getItem('accessToken');
      console.log('Token stored successfully:', !!storedToken);
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data.success) {
      const { accessToken, refreshToken, user } = response.data.data;
      console.log('Login success, storing tokens...');
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
  },

  checkAuthStatus: async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      return { isAuthenticated: false, user: null };
    }

    // Try to fetch fresh profile from API so we always have the latest data
    try {
      const response = await apiClient.get('/users/profile');
      if (response.data && response.data.data) {
        const freshUser = response.data.data;
        // Update AsyncStorage with fresh data
        await AsyncStorage.setItem('user', JSON.stringify(freshUser));
        return { isAuthenticated: true, user: freshUser };
      }
    } catch (error) {
      console.log('Could not fetch fresh profile, using cached data');
    }

    // Fallback to cached user if API call fails
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      return { isAuthenticated: true, user: JSON.parse(userStr) };
    }

    return { isAuthenticated: false, user: null };
  },

  // Helper to update cached user in AsyncStorage
  updateCachedUser: async (userData) => {
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

export default authService;

