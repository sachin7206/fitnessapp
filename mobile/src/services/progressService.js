import apiClient from '../config/api';

const progressService = {
  logWeight: async (data) => {
    const res = await apiClient.post('/progress/weight', data);
    return res.data;
  },
  getWeightEntries: async (days = 90) => {
    const res = await apiClient.get(`/progress/weight?days=${days}`);
    return res.data;
  },
  logMeasurements: async (data) => {
    const res = await apiClient.post('/progress/measurements', data);
    return res.data;
  },
  getMeasurements: async (days = 90) => {
    const res = await apiClient.get(`/progress/measurements?days=${days}`);
    return res.data;
  },
  setGoal: async (data) => {
    const res = await apiClient.post('/progress/goals', data);
    return res.data;
  },
  getGoals: async () => {
    const res = await apiClient.get('/progress/goals');
    return res.data;
  },
  getSummary: async (period = 'monthly') => {
    const res = await apiClient.get(`/progress/summary?period=${period}`);
    return res.data;
  },
  getTrends: async (days = 30) => {
    const res = await apiClient.get(`/progress/trends?days=${days}`);
    return res.data;
  },
};

export default progressService;

