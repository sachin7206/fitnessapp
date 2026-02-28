import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService';
import { authService } from '../../services/authService';

// Async thunks
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile();
      // Also update cached user in AsyncStorage
      if (response.data) {
        await authService.updateCachedUser(response.data);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(profileData);
      // Also update cached user in AsyncStorage
      if (response.data) {
        await authService.updateCachedUser(response.data);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateHealthMetrics = createAsyncThunk(
  'user/updateHealthMetrics',
  async (healthData, { rejectWithValue }) => {
    try {
      const response = await userService.updateHealthMetrics(healthData);
      // Also update cached user in AsyncStorage
      if (response.data) {
        await authService.updateCachedUser(response.data);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update health metrics');
    }
  }
);

export const updateGoals = createAsyncThunk(
  'user/updateGoals',
  async (goals, { rejectWithValue }) => {
    try {
      const response = await userService.updateGoals(goals);
      // Also update cached user in AsyncStorage
      if (response.data) {
        await authService.updateCachedUser(response.data);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update goals');
    }
  }
);

const initialState = {
  profile: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Health Metrics
      .addCase(updateHealthMetrics.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      // Update Goals
      .addCase(updateGoals.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;

