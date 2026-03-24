import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import workoutService from '../../services/workoutService';
import nutritionService from '../../services/nutritionService';

export const fetchExerciseReport = createAsyncThunk(
  'report/fetchExerciseReport',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      return await workoutService.getExerciseReport(startDate, endDate);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exercise report');
    }
  }
);

export const fetchDietReport = createAsyncThunk(
  'report/fetchDietReport',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      return await nutritionService.getDietReport(startDate, endDate);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch diet report');
    }
  }
);

const reportSlice = createSlice({
  name: 'report',
  initialState: {
    exerciseReport: null,
    dietReport: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearReports: (state) => {
      state.exerciseReport = null;
      state.dietReport = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExerciseReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExerciseReport.fulfilled, (state, action) => {
        state.loading = false;
        state.exerciseReport = action.payload;
      })
      .addCase(fetchExerciseReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchDietReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDietReport.fulfilled, (state, action) => {
        state.loading = false;
        state.dietReport = action.payload;
      })
      .addCase(fetchDietReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReports } = reportSlice.actions;
export default reportSlice.reducer;

