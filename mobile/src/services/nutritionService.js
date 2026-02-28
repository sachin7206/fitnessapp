import apiClient from './apiClient';
import API_CONFIG from '../config/api';

export const nutritionService = {
  // Get saved food preferences for the user
  getFoodPreferences: async () => {
    const response = await apiClient.get('/nutrition/food-preferences');
    return response.data;
  },

  // Save food preferences
  saveFoodPreferences: async (preferences) => {
    const response = await apiClient.post('/nutrition/food-preferences', preferences);
    return response.data;
  },

  // Check if user profile is complete for nutrition plan
  checkProfileStatus: async () => {
    const response = await apiClient.get('/nutrition/profile-status');
    return response.data;
  },

  // Generate personalized AI-based nutrition plan
  generatePersonalizedPlan: async (request) => {
    const response = await apiClient.post('/nutrition/generate-plan', request, {
      timeout: API_CONFIG.LONG_TIMEOUT,
    });
    return response.data;
  },

  // Get all nutrition plans with optional filters
  getPlans: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.region) params.append('region', filters.region);
    if (filters.dietType) params.append('dietType', filters.dietType);
    if (filters.goal) params.append('goal', filters.goal);

    const queryString = params.toString();
    const url = queryString ? `/nutrition/plans?${queryString}` : '/nutrition/plans';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get a specific plan with full details
  getPlanById: async (planId) => {
    const response = await apiClient.get(`/nutrition/plans/${planId}`);
    return response.data;
  },

  // Get recommended plans for the user
  getRecommendedPlans: async () => {
    const response = await apiClient.get('/nutrition/plans/recommended');
    return response.data;
  },

  // Enroll in a nutrition plan
  enrollInPlan: async (planId) => {
    const response = await apiClient.post(`/nutrition/plans/${planId}/enroll`);
    return response.data;
  },

  // Get user's active plan
  getActivePlan: async () => {
    const response = await apiClient.get('/nutrition/my-plan');
    return response.data;
  },

  // Get user's plan history
  getPlanHistory: async () => {
    const response = await apiClient.get('/nutrition/my-plans/history');
    return response.data;
  },

  // Update plan progress
  updateProgress: async (userPlanId, completedMeals) => {
    const response = await apiClient.put(`/nutrition/my-plans/${userPlanId}/progress`, {
      completedMeals,
    });
    return response.data;
  },

  // Cancel a plan
  cancelPlan: async (userPlanId) => {
    const response = await apiClient.delete(`/nutrition/my-plans/${userPlanId}`);
    return response.data;
  },

  // Estimate macros for a food description via AI
  estimateMacros: async (foodDescription) => {
    try {
      const response = await apiClient.post('/nutrition/estimate-macros', { foodDescription }, {
        timeout: 15000,
      });
      return response.data;
    } catch (error) {
      // Return fallback if API fails
      return {
        name: foodDescription,
        calories: 400,
        proteinGrams: 15.0,
        carbsGrams: 45.0,
        fatGrams: 12.0,
        source: 'default',
      };
    }
  },
};

export default nutritionService;

