import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@workout_tracking';

const getLocalDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const initialState = {
  trackingDate: null,
  activePlan: null,          // UserWorkoutPlanDTO
  todayCompleted: false,
  completedAt: null,
  workoutCount: 0,
  motivationalQuote: null,
  loaded: false,
  // Step tracking
  todaySteps: 0,
  stepGoal: 0,               // 0 = no goal set
  stepGoalCompleted: false,
  stepHistory: [],            // [{ date, steps, caloriesBurned }] last 90 days
};

const workoutTrackingSlice = createSlice({
  name: 'workoutTracking',
  initialState,
  reducers: {
    loadWorkoutTracking: (state, action) => {
      const data = action.payload;
      if (data) {
        const today = getLocalDateString();
        // Sanitize: ensure todaySteps is a number
        const sanitizeSteps = (v) => (typeof v === 'number' && !isNaN(v)) ? v : 0;

        // Reset if it's a new day
        if (data.trackingDate !== today) {
          // Save yesterday's steps to history before resetting
          const history = data.stepHistory || [];
          const prevSteps = sanitizeSteps(data.todaySteps);
          if (data.trackingDate && prevSteps > 0) {
            const cal = Math.round(prevSteps * 0.04);
            history.push({ date: data.trackingDate, steps: prevSteps, caloriesBurned: cal });
            // Keep last 90 days
            while (history.length > 90) history.shift();
          }
          state.trackingDate = today;
          state.todayCompleted = false;
          state.completedAt = null;
          state.activePlan = data.activePlan || null;
          state.workoutCount = data.workoutCount || 0;
          state.motivationalQuote = null;
          state.todaySteps = 0;
          state.stepGoal = sanitizeSteps(data.stepGoal);
          state.stepGoalCompleted = false;
          state.stepHistory = history;
        } else {
          state.trackingDate = data.trackingDate;
          state.todayCompleted = data.todayCompleted || false;
          state.completedAt = data.completedAt || null;
          state.activePlan = data.activePlan || null;
          state.workoutCount = data.workoutCount || 0;
          state.motivationalQuote = data.motivationalQuote || null;
          state.todaySteps = sanitizeSteps(data.todaySteps);
          state.stepGoal = sanitizeSteps(data.stepGoal);
          state.stepGoalCompleted = data.stepGoalCompleted || false;
          state.stepHistory = data.stepHistory || [];
        }
      }
      state.loaded = true;
    },

    setActivePlan: (state, action) => {
      state.activePlan = action.payload;
    },

    completeWorkout: (state) => {
      state.todayCompleted = true;
      state.completedAt = new Date().toISOString();
      state.workoutCount += 1;
      if (state.activePlan) {
        state.activePlan.completedWorkouts = (state.activePlan.completedWorkouts || 0) + 1;
      }
    },

    uncompleteWorkout: (state) => {
      state.todayCompleted = false;
      state.completedAt = null;
      state.workoutCount = Math.max(0, state.workoutCount - 1);
      if (state.activePlan) {
        state.activePlan.completedWorkouts = Math.max(0, (state.activePlan.completedWorkouts || 1) - 1);
      }
    },

    setWorkoutCount: (state, action) => {
      state.workoutCount = action.payload;
    },

    setMotivationalQuote: (state, action) => {
      state.motivationalQuote = action.payload;
    },

    clearWorkoutPlan: (state) => {
      state.activePlan = null;
      state.todayCompleted = false;
      state.completedAt = null;
    },

    updateSteps: (state, action) => {
      const steps = typeof action.payload === 'number' ? action.payload : 0;
      state.todaySteps = steps;
      // Check goal completion
      if (state.stepGoal > 0 && state.todaySteps >= state.stepGoal && !state.stepGoalCompleted) {
        state.stepGoalCompleted = true;
      }
    },

    setStepGoal: (state, action) => {
      state.stepGoal = action.payload;
      if (action.payload > 0 && state.todaySteps >= action.payload) {
        state.stepGoalCompleted = true;
      } else {
        state.stepGoalCompleted = false;
      }
    },
  },
});

export const {
  loadWorkoutTracking,
  setActivePlan,
  completeWorkout,
  uncompleteWorkout,
  setWorkoutCount,
  setMotivationalQuote,
  clearWorkoutPlan,
  updateSteps,
  setStepGoal,
} = workoutTrackingSlice.actions;

export { getLocalDateString };

// Persist
export const persistWorkoutTracking = () => async (dispatch, getState) => {
  const { workoutTracking } = getState();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      trackingDate: workoutTracking.trackingDate || getLocalDateString(),
      todayCompleted: workoutTracking.todayCompleted,
      completedAt: workoutTracking.completedAt,
      activePlan: workoutTracking.activePlan,
      workoutCount: workoutTracking.workoutCount,
      motivationalQuote: workoutTracking.motivationalQuote,
      todaySteps: typeof workoutTracking.todaySteps === 'number' ? workoutTracking.todaySteps : 0,
      stepGoal: typeof workoutTracking.stepGoal === 'number' ? workoutTracking.stepGoal : 0,
      stepGoalCompleted: workoutTracking.stepGoalCompleted,
      stepHistory: (workoutTracking.stepHistory || []).filter(
        h => h && typeof h.steps === 'number' && typeof h.date === 'string'
      ),
    }));
  } catch (e) {
    console.log('Failed to persist workout tracking:', e.message);
  }
};

// Load
export const loadWorkoutTrackingFromStorage = () => async (dispatch) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      dispatch(loadWorkoutTracking(JSON.parse(raw)));
    } else {
      dispatch(loadWorkoutTracking(null));
    }
  } catch (e) {
    console.log('Failed to load workout tracking:', e.message);
    dispatch(loadWorkoutTracking(null));
  }
};

export default workoutTrackingSlice.reducer;

