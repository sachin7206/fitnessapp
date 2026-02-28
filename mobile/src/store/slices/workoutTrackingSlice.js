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
};

const workoutTrackingSlice = createSlice({
  name: 'workoutTracking',
  initialState,
  reducers: {
    loadWorkoutTracking: (state, action) => {
      const data = action.payload;
      if (data) {
        const today = getLocalDateString();
        // Reset if it's a new day
        if (data.trackingDate !== today) {
          state.trackingDate = today;
          state.todayCompleted = false;
          state.completedAt = null;
          state.activePlan = data.activePlan || null;
          state.workoutCount = data.workoutCount || 0;
          state.motivationalQuote = null;
        } else {
          state.trackingDate = data.trackingDate;
          state.todayCompleted = data.todayCompleted || false;
          state.completedAt = data.completedAt || null;
          state.activePlan = data.activePlan || null;
          state.workoutCount = data.workoutCount || 0;
          state.motivationalQuote = data.motivationalQuote || null;
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

