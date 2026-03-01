import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import nutritionService from '../../services/nutritionService';

const STORAGE_KEY = '@meal_tracking';

// Use local timezone date, NOT UTC — "2026-03-01" in IST even if UTC is still Feb 28
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse "8:00 AM" → minutes since midnight for sorting
const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const sortByTime = (arr) => [...arr].sort((a, b) => parseTime(a.timeOfDay) - parseTime(b.timeOfDay));

const initialState = {
  trackingDate: null,
  meals: [],
  consumedCalories: 0,
  consumedProtein: 0,
  consumedCarbs: 0,
  consumedFat: 0,
  loaded: false,
};

const mealTrackingSlice = createSlice({
  name: 'mealTracking',
  initialState,
  reducers: {
    loadTracking: (state, action) => {
      const data = action.payload;
      if (data) {
        state.trackingDate = data.trackingDate;
        state.meals = sortByTime(data.meals || []);
        state.consumedCalories = data.consumedCalories || 0;
        state.consumedProtein = data.consumedProtein || 0;
        state.consumedCarbs = data.consumedCarbs || 0;
        state.consumedFat = data.consumedFat || 0;
      } else {
        // No data — reset everything
        state.trackingDate = null;
        state.meals = [];
        state.consumedCalories = 0;
        state.consumedProtein = 0;
        state.consumedCarbs = 0;
        state.consumedFat = 0;
      }
      state.loaded = true;
    },

    initMealsForToday: (state, action) => {
      const { date, meals } = action.payload;
      // Reset if it's a new day
      if (state.trackingDate !== date) {
        state.trackingDate = date;
        state.meals = sortByTime(meals.map(m => ({
          mealId: m.id || m.mealId,
          name: m.name,
          mealType: m.mealType,
          timeOfDay: m.timeOfDay,
          calories: m.calories || 0,
          proteinGrams: m.proteinGrams || 0,
          carbsGrams: m.carbsGrams || 0,
          fatGrams: m.fatGrams || 0,
          completed: false,
          completedAt: null,
        })));
        state.consumedCalories = 0;
        state.consumedProtein = 0;
        state.consumedCarbs = 0;
        state.consumedFat = 0;
      } else {
        // Same day — merge new meals but keep completed state
        const existingMap = {};
        state.meals.forEach(m => { existingMap[m.mealId] = m; });
        state.meals = sortByTime(meals.map(m => {
          const id = m.id || m.mealId;
          if (existingMap[id]) return existingMap[id];
          return {
            mealId: id,
            name: m.name,
            mealType: m.mealType,
            timeOfDay: m.timeOfDay,
            calories: m.calories || 0,
            proteinGrams: m.proteinGrams || 0,
            carbsGrams: m.carbsGrams || 0,
            fatGrams: m.fatGrams || 0,
            completed: false,
            completedAt: null,
          };
        }));
      }
    },

    completeMeal: (state, action) => {
      const { mealId } = action.payload;
      const meal = state.meals.find(m => m.mealId === mealId);
      if (meal && !meal.completed) {
        meal.completed = true;
        meal.completedAt = new Date().toISOString();
        state.consumedCalories += meal.calories;
        state.consumedProtein += meal.proteinGrams;
        state.consumedCarbs += meal.carbsGrams;
        state.consumedFat += meal.fatGrams;
      }
    },

    uncompleteMeal: (state, action) => {
      const { mealId } = action.payload;
      const meal = state.meals.find(m => m.mealId === mealId);
      if (meal && meal.completed) {
        state.consumedCalories = Math.max(0, state.consumedCalories - meal.calories);
        state.consumedProtein = Math.max(0, state.consumedProtein - meal.proteinGrams);
        state.consumedCarbs = Math.max(0, state.consumedCarbs - meal.carbsGrams);
        state.consumedFat = Math.max(0, state.consumedFat - meal.fatGrams);
        meal.completed = false;
        meal.completedAt = null;
        meal.replaced = false;
        meal.replacedWith = null;
        meal.originalName = null;
      }
    },

    replaceMeal: (state, action) => {
      const { mealId, foodName, calories, proteinGrams, carbsGrams, fatGrams } = action.payload;
      const meal = state.meals.find(m => m.mealId === mealId);
      if (meal && !meal.completed) {
        meal.completed = true;
        meal.completedAt = new Date().toISOString();
        meal.replaced = true;
        meal.originalName = meal.name;
        meal.replacedWith = foodName;
        state.consumedCalories += calories;
        state.consumedProtein += proteinGrams;
        state.consumedCarbs += carbsGrams;
        state.consumedFat += fatGrams;
        meal.calories = calories;
        meal.proteinGrams = proteinGrams;
        meal.carbsGrams = carbsGrams;
        meal.fatGrams = fatGrams;
      }
    },
  },
});

export const { loadTracking, initMealsForToday, completeMeal, uncompleteMeal, replaceMeal } = mealTrackingSlice.actions;

// Export the helper so screens can use the same local date logic
export { getLocalDateString };

// Persist to AsyncStorage + sync to backend
export const persistTracking = () => async (dispatch, getState) => {
  const { mealTracking } = getState();
  const data = {
    trackingDate: mealTracking.trackingDate,
    meals: mealTracking.meals,
    consumedCalories: mealTracking.consumedCalories,
    consumedProtein: mealTracking.consumedProtein,
    consumedCarbs: mealTracking.consumedCarbs,
    consumedFat: mealTracking.consumedFat,
  };

  // 1. Save to AsyncStorage (instant, reliable)
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.log('Failed to persist meal tracking:', e.message);
  }

  // 2. Sync to backend (fire-and-forget)
  if (mealTracking.meals.length > 0) {
    try {
      await nutritionService.syncDailyTracking({
        meals: mealTracking.meals.map(m => ({
          mealId: m.mealId,
          mealName: m.replacedWith || m.name,
          mealType: m.mealType,
          timeOfDay: m.timeOfDay,
          completed: m.completed || false,
          completedAt: m.completedAt || null,
          replaced: m.replaced || false,
          replacedWith: m.replacedWith || null,
          originalName: m.originalName || null,
          calories: m.calories || 0,
          proteinGrams: m.proteinGrams || 0,
          carbsGrams: m.carbsGrams || 0,
          fatGrams: m.fatGrams || 0,
        })),
        consumedCalories: mealTracking.consumedCalories || 0,
        consumedProtein: mealTracking.consumedProtein || 0,
        consumedCarbs: mealTracking.consumedCarbs || 0,
        consumedFat: mealTracking.consumedFat || 0,
      });
    } catch (e) {
      console.log('Meal tracking sync to backend failed (will retry):', e.message);
    }
  }
};

// Load from AsyncStorage (instant), then merge with backend
export const loadTrackingFromStorage = () => async (dispatch) => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const today = getLocalDateString();

    if (raw) {
      const data = JSON.parse(raw);
      if (data.trackingDate && data.trackingDate !== today) {
        // New day — reset
        const resetData = {
          trackingDate: today,
          meals: (data.meals || []).map(m => ({
            ...m,
            completed: false,
            completedAt: null,
            replaced: false,
            replacedWith: null,
            originalName: null,
          })),
          consumedCalories: 0,
          consumedProtein: 0,
          consumedCarbs: 0,
          consumedFat: 0,
        };
        dispatch(loadTracking(resetData));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
      } else {
        dispatch(loadTracking(data));
      }
    } else {
      dispatch(loadTracking(null));
    }

    // Try to merge from backend (restores data if app was reinstalled)
    try {
      const backendData = await nutritionService.getTodayTracking();
      if (backendData && backendData.meals && backendData.meals.length > 0) {
        const localState = raw ? JSON.parse(raw) : null;
        const localMeals = localState?.meals || [];
        const localCompletedCount = localMeals.filter(m => m.completed).length;
        const backendCompletedCount = backendData.meals.filter(m => m.completed).length;

        // If backend has more completed meals, it has more recent data — use it
        if (backendCompletedCount > localCompletedCount) {
          const restoredData = {
            trackingDate: today,
            meals: backendData.meals.map(m => ({
              mealId: m.mealId,
              name: m.mealName,
              mealType: m.mealType,
              timeOfDay: m.timeOfDay,
              calories: m.calories || 0,
              proteinGrams: m.proteinGrams || 0,
              carbsGrams: m.carbsGrams || 0,
              fatGrams: m.fatGrams || 0,
              completed: m.completed || false,
              completedAt: m.completedAt || null,
              replaced: m.replaced || false,
              replacedWith: m.replacedWith || null,
              originalName: m.originalName || null,
            })),
            consumedCalories: backendData.consumedCalories || 0,
            consumedProtein: backendData.consumedProtein || 0,
            consumedCarbs: backendData.consumedCarbs || 0,
            consumedFat: backendData.consumedFat || 0,
          };
          dispatch(loadTracking(restoredData));
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(restoredData));
        }
      }
    } catch (e) {
      console.log('Backend meal tracking unavailable, using local cache:', e.message);
    }
  } catch (e) {
    console.log('Failed to load meal tracking:', e.message);
    dispatch(loadTracking(null));
  }
};

export default mealTrackingSlice.reducer;

