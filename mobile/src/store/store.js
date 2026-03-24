import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import mealTrackingReducer from './slices/mealTrackingSlice';
import workoutTrackingReducer from './slices/workoutTrackingSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import reportReducer from './slices/reportSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    mealTracking: mealTrackingReducer,
    workoutTracking: workoutTrackingReducer,
    subscription: subscriptionReducer,
    report: reportReducer,
  },
});

export default store;

