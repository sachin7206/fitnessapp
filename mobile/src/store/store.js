import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import mealTrackingReducer from './slices/mealTrackingSlice';
import workoutTrackingReducer from './slices/workoutTrackingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    mealTracking: mealTrackingReducer,
    workoutTracking: workoutTrackingReducer,
  },
});

export default store;

