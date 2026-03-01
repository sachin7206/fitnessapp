import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import workoutService from '../../services/workoutService';

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

    mergeStepHistory: (state, action) => {
      const backendHistory = action.payload || [];
      const localMap = {};
      (state.stepHistory || []).forEach(h => { localMap[h.date] = h; });
      // Merge: take higher step count for each date
      backendHistory.forEach(h => {
        if (!localMap[h.date] || h.steps > localMap[h.date].steps) {
          localMap[h.date] = h;
        }
      });
      state.stepHistory = Object.values(localMap)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-90); // Keep last 90 days
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
  mergeStepHistory,
} = workoutTrackingSlice.actions;

export { getLocalDateString };

// Debounce backend sync — max once per 60 seconds
let lastSyncTime = 0;

// Persist to AsyncStorage + sync steps to backend (debounced)
export const persistWorkoutTracking = () => async (dispatch, getState) => {
  const { workoutTracking } = getState();
  const todaySteps = typeof workoutTracking.todaySteps === 'number' ? workoutTracking.todaySteps : 0;
  const stepGoal = typeof workoutTracking.stepGoal === 'number' ? workoutTracking.stepGoal : 0;

  // Always save to AsyncStorage (instant, local)
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      trackingDate: workoutTracking.trackingDate || getLocalDateString(),
      todayCompleted: workoutTracking.todayCompleted,
      completedAt: workoutTracking.completedAt,
      activePlan: workoutTracking.activePlan,
      workoutCount: workoutTracking.workoutCount,
      motivationalQuote: workoutTracking.motivationalQuote,
      todaySteps,
      stepGoal,
      stepGoalCompleted: workoutTracking.stepGoalCompleted,
      stepHistory: (workoutTracking.stepHistory || []).filter(
        h => h && typeof h.steps === 'number' && typeof h.date === 'string'
      ),
    }));
  } catch (e) {
    console.log('Failed to persist workout tracking:', e.message);
  }

  // Debounce backend sync — max once per 60 seconds
  const now = Date.now();
  if (now - lastSyncTime < 60000) return;
  lastSyncTime = now;

  if (todaySteps > 0 || stepGoal > 0) {
    try {
      await workoutService.syncSteps({
        steps: todaySteps,
        stepGoal: stepGoal,
        goalCompleted: workoutTracking.stepGoalCompleted || false,
      });
    } catch (e) {
      console.log('Step sync to backend failed (will retry):', e.message);
    }
  }
};

// Load from AsyncStorage only (no API calls) — use for focus/timer refreshes
export const loadWorkoutTrackingLocal = () => async (dispatch) => {
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

// Load from AsyncStorage + sync from backend (API calls) — use only on initial mount
export const loadWorkoutTrackingFromStorage = () => async (dispatch) => {
  try {
    // 1. Load from local cache (instant display)
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      dispatch(loadWorkoutTracking(JSON.parse(raw)));
    } else {
      dispatch(loadWorkoutTracking(null));
    }

    // 2. Merge step history from backend (one-time on mount)
    try {
      const [todayData, historyData] = await Promise.all([
        workoutService.getTodaySteps(),
        workoutService.getStepHistory(90),
      ]);

      if (todayData && typeof todayData.steps === 'number' && todayData.steps > 0) {
        dispatch(updateSteps(todayData.steps));
        if (todayData.stepGoal > 0) {
          dispatch(setStepGoal(todayData.stepGoal));
        }
      }

      if (historyData && historyData.length > 0) {
        dispatch(mergeStepHistory(historyData.map(h => ({
          date: h.trackingDate,
          steps: h.steps,
          caloriesBurned: h.caloriesBurned || Math.round(h.steps * 0.04),
        }))));
      }
    } catch (e) {
      console.log('Backend step data unavailable, using local cache:', e.message);
    }
  } catch (e) {
    console.log('Failed to load workout tracking:', e.message);
    dispatch(loadWorkoutTracking(null));
  }
};

export default workoutTrackingSlice.reducer;

