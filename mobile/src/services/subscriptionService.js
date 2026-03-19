import apiClient from './apiClient';

const subscriptionService = {
  // Get all available subscription plans
  getPlans: async () => {
    const response = await apiClient.get('/subscriptions/plans');
    return response.data;
  },

  // Get a specific plan by ID
  getPlanById: async (planId) => {
    const response = await apiClient.get(`/subscriptions/plans/${planId}`);
    return response.data;
  },

  // Get current user's active subscription
  getActiveSubscription: async () => {
    const response = await apiClient.get('/subscriptions/my-subscription');
    return response.data;
  },

  // Create a subscription (status: PENDING_PAYMENT)
  subscribe: async (planId) => {
    const response = await apiClient.post('/subscriptions/subscribe', { planId });
    return response.data;
  },

  // Get subscription history
  getSubscriptionHistory: async () => {
    const response = await apiClient.get('/subscriptions/history');
    return response.data;
  },

  // Cancel a subscription
  cancelSubscription: async (subscriptionId) => {
    const response = await apiClient.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  },
};

export default subscriptionService;

