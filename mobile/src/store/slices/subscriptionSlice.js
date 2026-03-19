import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subscriptionService from '../../services/subscriptionService';

export const fetchPlans = createAsyncThunk('subscription/fetchPlans', async (_, { rejectWithValue }) => {
  try {
    const response = await subscriptionService.getPlans();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch plans');
  }
});

export const fetchActiveSubscription = createAsyncThunk('subscription/fetchActive', async (_, { rejectWithValue }) => {
  try {
    const response = await subscriptionService.getActiveSubscription();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription');
  }
});

export const createSubscription = createAsyncThunk('subscription/create', async (planId, { rejectWithValue }) => {
  try {
    const response = await subscriptionService.subscribe(planId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create subscription');
  }
});

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: {
    plans: [],
    activeSubscription: null,
    pendingSubscription: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSubscriptionError: (state) => {
      state.error = null;
    },
    setActiveSubscription: (state, action) => {
      state.activeSubscription = action.payload;
    },
    clearPendingSubscription: (state) => {
      state.pendingSubscription = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPlans.fulfilled, (state, action) => { state.loading = false; state.plans = action.payload || []; })
      .addCase(fetchPlans.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchActiveSubscription.pending, (state) => { state.loading = true; })
      .addCase(fetchActiveSubscription.fulfilled, (state, action) => { state.loading = false; state.activeSubscription = action.payload; })
      .addCase(fetchActiveSubscription.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createSubscription.pending, (state) => { state.loading = true; })
      .addCase(createSubscription.fulfilled, (state, action) => { state.loading = false; state.pendingSubscription = action.payload; })
      .addCase(createSubscription.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearSubscriptionError, setActiveSubscription, clearPendingSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;

