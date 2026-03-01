import apiClient from './apiClient';

const workoutService = {
  // Generate a personalized workout plan via Gemini AI (with fallback)
  generateWorkoutPlan: async (request) => {
    const response = await apiClient.post('/workouts/generate-plan', request);
    return response.data;
  },

  // Assign a generated plan to the user
  assignWorkoutPlan: async (planId) => {
    const response = await apiClient.post(`/workouts/plans/${planId}/assign`);
    return response.data;
  },

  // Get the user's active workout plan
  getActiveWorkoutPlan: async () => {
    const response = await apiClient.get('/workouts/my-plan');
    return response.data;
  },

  // Mark today's workout as complete
  markWorkoutComplete: async () => {
    const response = await apiClient.post('/workouts/my-plan/complete');
    return response.data;
  },

  // Get total workout count
  getWorkoutCount: async () => {
    const response = await apiClient.get('/workouts/workout-count');
    return response.data;
  },

  // Cancel active plan
  cancelPlan: async () => {
    const response = await apiClient.delete('/workouts/my-plan');
    return response.data;
  },

  // Get motivational quote
  getMotivationalQuote: async () => {
    try {
      const response = await apiClient.get('/workouts/motivational-quote');
      return response.data;
    } catch (error) {
      // Fallback quotes if API fails
      const fallbackQuotes = [
        "Let's go for a workout! 💪",
        "Push yourself, no one else will do it for you! 🔥",
        "Your body can handle almost anything. It's your mind you have to convince! 🧠",
        "Today's workout is tomorrow's strength! 🏋️",
        "The only bad workout is the one you didn't do! ⚡",
      ];
      const idx = new Date().getDate() % fallbackQuotes.length;
      return { quote: fallbackQuotes[idx] };
    }
  },

  // -------- Step Tracking --------

  syncSteps: async (request) => {
    const response = await apiClient.put('/workouts/steps/today', request);
    return response.data;
  },

  getTodaySteps: async () => {
    const response = await apiClient.get('/workouts/steps/today');
    return response.data;
  },

  getStepHistory: async (days = 90) => {
    const response = await apiClient.get(`/workouts/steps/history?days=${days}`);
    return response.data;
  },
};

export default workoutService;

