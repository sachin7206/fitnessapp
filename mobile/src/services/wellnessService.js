import apiClient from './apiClient';

const wellnessService = {
  getYogaPoses: async (difficulty) => {
    const params = difficulty ? `?difficulty=${difficulty}` : '';
    const res = await apiClient.get(`/wellness/yoga/poses${params}`);
    return res.data;
  },
  getMeditationSessions: async (type) => {
    const params = type ? `?type=${type}` : '';
    const res = await apiClient.get(`/wellness/meditation/sessions${params}`);
    return res.data;
  },
  getBreathingExercises: async () => {
    const res = await apiClient.get('/wellness/breathing/exercises');
    return res.data;
  },
  generatePlan: async (data) => {
    const res = await apiClient.post('/wellness/generate-plan', data);
    return res.data;
  },
  assignPlan: async (planId) => {
    const res = await apiClient.post(`/wellness/plans/${planId}/assign`);
    return res.data;
  },
  getMyPlan: async () => {
    const res = await apiClient.get('/wellness/my-plan');
    return res.data;
  },
  completeSession: async (data) => {
    const res = await apiClient.post('/wellness/my-plan/complete-session', data);
    return res.data;
  },
  getDailyTip: async () => {
    const res = await apiClient.get('/wellness/tips/daily');
    return res.data;
  },
  getStreak: async () => {
    const res = await apiClient.get('/wellness/streak');
    return res.data;
  },
};

export default wellnessService;

