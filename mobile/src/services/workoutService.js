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

  // ========== NEW FEATURES ==========

  // Suggest exercise substitutions
  suggestExerciseSubstitutes: async (request) => {
    const response = await apiClient.post('/workouts/my-plan/substitute', request, { timeout: 30000 });
    return response.data;
  },

  // Submit workout feedback
  submitWorkoutFeedback: async (request) => {
    const response = await apiClient.post('/workouts/my-plan/feedback', request);
    return response.data;
  },

  // Get AI-adjusted workout progression
  adjustWorkoutProgression: async () => {
    const response = await apiClient.post('/workouts/my-plan/adjust');
    return response.data;
  },

  // Get workout feedback history
  getWorkoutFeedbackHistory: async () => {
    const response = await apiClient.get('/workouts/my-plan/feedback/history');
    return response.data;
  },

  // ========== FREE/CUSTOM WORKOUT ==========

  // Save a custom workout plan (free service)
  saveCustomWorkoutPlan: async (request) => {
    const response = await apiClient.post('/workouts/custom-plan', request);
    return response.data;
  },

  // Update a single exercise in-place (sets, reps, weight, rest, setDetailsJson)
  updateExercise: async (exerciseId, request) => {
    const response = await apiClient.put(`/workouts/custom-plan/exercises/${exerciseId}`, request);
    return response.data;
  },

  // Sync custom workout exercise log to backend
  syncCustomWorkoutLog: async (request) => {
    const response = await apiClient.put('/workouts/custom-plan/log', request);
    return response.data;
  },

  // Get custom workout exercise logs
  getCustomWorkoutLogs: async (days = 30) => {
    const response = await apiClient.get(`/workouts/custom-plan/log?days=${days}`);
    return response.data;
  },
};

export default workoutService;

