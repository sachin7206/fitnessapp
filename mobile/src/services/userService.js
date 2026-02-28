import apiClient from './apiClient';

export const userService = {
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  },

  updateHealthMetrics: async (healthData) => {
    const response = await apiClient.put('/users/health-metrics', healthData);
    return response.data;
  },

  updateGoals: async (goals) => {
    const response = await apiClient.put('/users/goals', goals);
    return response.data;
  },
};

export default userService;

