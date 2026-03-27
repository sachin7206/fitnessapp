import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import nutritionService from '../../services/nutritionService';

const STORAGE_KEY_PREFIX = '@meal_tracking_';

// Get user-specific storage key
const getStorageKey = (email) => email ? `${STORAGE_KEY_PREFIX}${email}` : '@meal_tracking_guest';

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
          mealId: m.id != null ? m.id : m.mealId,
          name: m.name,
          mealType: m.mealType,
          timeOfDay: m.timeOfDay,
          calories: m.calories || 0,
          proteinGrams: m.proteinGrams || 0,
          carbsGrams: m.carbsGrams || 0,
          fatGrams: m.fatGrams || 0,
          completed: false,
          completedAt: null,
          foodItems: (m.foodItems || []).map((fi, idx) => ({
            id: fi.id != null ? fi.id : idx,
            name: fi.name || '',
            quantity: fi.quantity || '',
            calories: fi.calories || 0,
            proteinGrams: fi.proteinGrams || 0,
            carbsGrams: fi.carbsGrams || 0,
            fatGrams: fi.fatGrams || 0,
            completed: false,
          })),
        })));
        state.consumedCalories = 0;
        state.consumedProtein = 0;
        state.consumedCarbs = 0;
        state.consumedFat = 0;
      } else {
        // Same day — merge new meals but keep completed state; also preserve extra meals
        const existingMap = {};
        state.meals.forEach(m => { existingMap[String(m.mealId)] = m; });

        // Keep extra meals that are already in state
        const existingExtras = state.meals.filter(m => m.isExtra);

        state.meals = sortByTime([
          ...meals.map(m => {
            const id = m.id != null ? m.id : m.mealId;
            const existing = existingMap[String(id)];
            if (existing) {
              // Existing meal found — preserve completion state
              // BUT if existing has no food items and new data does, bring them in
              const newFoodItems = (m.foodItems || []);
              if ((!existing.foodItems || existing.foodItems.length === 0) && newFoodItems.length > 0) {
                existing.foodItems = newFoodItems.map((fi, idx) => ({
                  id: fi.id != null ? fi.id : idx,
                  name: fi.name || '',
                  quantity: fi.quantity || '',
                  calories: fi.calories || 0,
                  proteinGrams: fi.proteinGrams || 0,
                  carbsGrams: fi.carbsGrams || 0,
                  fatGrams: fi.fatGrams || 0,
                  completed: false,
                }));
              } else if (existing.foodItems && existing.foodItems.length > 0 && newFoodItems.length > 0) {
                // Both have food items — merge: keep completion state, update details from API
                const existingItemMap = {};
                existing.foodItems.forEach(fi => { existingItemMap[String(fi.id)] = fi; });
                existing.foodItems = newFoodItems.map((fi, idx) => {
                  const fiId = fi.id != null ? fi.id : idx;
                  const existingItem = existingItemMap[String(fiId)];
                  if (existingItem) {
                    // Preserve completed state, update name/macros from API
                    return {
                      ...existingItem,
                      name: fi.name || existingItem.name,
                      quantity: fi.quantity || existingItem.quantity,
                      calories: fi.calories || existingItem.calories,
                      proteinGrams: fi.proteinGrams || existingItem.proteinGrams,
                      carbsGrams: fi.carbsGrams || existingItem.carbsGrams,
                      fatGrams: fi.fatGrams || existingItem.fatGrams,
                    };
                  }
                  return {
                    id: fiId,
                    name: fi.name || '',
                    quantity: fi.quantity || '',
                    calories: fi.calories || 0,
                    proteinGrams: fi.proteinGrams || 0,
                    carbsGrams: fi.carbsGrams || 0,
                    fatGrams: fi.fatGrams || 0,
                    completed: false,
                  };
                });
              }
              return existing;
            }
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
              foodItems: (m.foodItems || []).map((fi, idx) => ({
                id: fi.id != null ? fi.id : idx,
                name: fi.name || '',
                quantity: fi.quantity || '',
                calories: fi.calories || 0,
                proteinGrams: fi.proteinGrams || 0,
                carbsGrams: fi.carbsGrams || 0,
                fatGrams: fi.fatGrams || 0,
                completed: false,
              })),
            };
          }),
          ...existingExtras,
        ]);
      }
    },

    completeFoodItem: (state, action) => {
      const { mealId, foodItemId } = action.payload;
      // Use loose matching for mealId (number vs string)
      const meal = state.meals.find(m => String(m.mealId) === String(mealId));
      if (meal && meal.foodItems) {
        const item = meal.foodItems.find(fi => String(fi.id) === String(foodItemId));
        if (item && !item.completed) {
          item.completed = true;
          state.consumedCalories += item.calories || 0;
          state.consumedProtein += item.proteinGrams || 0;
          state.consumedCarbs += item.carbsGrams || 0;
          state.consumedFat += item.fatGrams || 0;
          // Check if all items in this meal are now completed
          const allDone = meal.foodItems.every(fi => fi.completed);
          if (allDone) {
            meal.completed = true;
            meal.completedAt = new Date().toISOString();
          }
        }
      }
    },

    uncompleteFoodItem: (state, action) => {
      const { mealId, foodItemId } = action.payload;
      const meal = state.meals.find(m => String(m.mealId) === String(mealId));
      if (meal && meal.foodItems) {
        const item = meal.foodItems.find(fi => String(fi.id) === String(foodItemId));
        if (item && item.completed) {
          item.completed = false;
          state.consumedCalories = Math.max(0, state.consumedCalories - (item.calories || 0));
          state.consumedProtein = Math.max(0, state.consumedProtein - (item.proteinGrams || 0));
          state.consumedCarbs = Math.max(0, state.consumedCarbs - (item.carbsGrams || 0));
          state.consumedFat = Math.max(0, state.consumedFat - (item.fatGrams || 0));
          // If meal was marked completed, unmark it
          if (meal.completed) {
            meal.completed = false;
            meal.completedAt = null;
          }
        }
      }
    },

    completeMeal: (state, action) => {
      const { mealId } = action.payload;
      const meal = state.meals.find(m => String(m.mealId) === String(mealId));
      if (meal && !meal.completed) {
        meal.completed = true;
        meal.completedAt = new Date().toISOString();
        // Mark all food items as completed if they exist
        if (meal.foodItems && meal.foodItems.length > 0) {
          meal.foodItems.forEach(fi => {
            if (!fi.completed) {
              fi.completed = true;
              state.consumedCalories += fi.calories || 0;
              state.consumedProtein += fi.proteinGrams || 0;
              state.consumedCarbs += fi.carbsGrams || 0;
              state.consumedFat += fi.fatGrams || 0;
            }
          });
        } else {
          state.consumedCalories += meal.calories;
          state.consumedProtein += meal.proteinGrams;
          state.consumedCarbs += meal.carbsGrams;
          state.consumedFat += meal.fatGrams;
        }
      }
    },

    uncompleteMeal: (state, action) => {
      const { mealId } = action.payload;
      const meal = state.meals.find(m => String(m.mealId) === String(mealId));
      if (meal && meal.completed) {
        // Subtract macros for all completed food items
        if (meal.foodItems && meal.foodItems.length > 0) {
          meal.foodItems.forEach(fi => {
            if (fi.completed) {
              state.consumedCalories = Math.max(0, state.consumedCalories - (fi.calories || 0));
              state.consumedProtein = Math.max(0, state.consumedProtein - (fi.proteinGrams || 0));
              state.consumedCarbs = Math.max(0, state.consumedCarbs - (fi.carbsGrams || 0));
              state.consumedFat = Math.max(0, state.consumedFat - (fi.fatGrams || 0));
              fi.completed = false;
            }
          });
        } else {
          state.consumedCalories = Math.max(0, state.consumedCalories - meal.calories);
          state.consumedProtein = Math.max(0, state.consumedProtein - meal.proteinGrams);
          state.consumedCarbs = Math.max(0, state.consumedCarbs - meal.carbsGrams);
          state.consumedFat = Math.max(0, state.consumedFat - meal.fatGrams);
        }
        // Restore original macros if this was a replaced meal
        if (meal.replaced && meal.originalCalories != null) {
          meal.calories = meal.originalCalories;
          meal.proteinGrams = meal.originalProteinGrams;
          meal.carbsGrams = meal.originalCarbsGrams;
          meal.fatGrams = meal.originalFatGrams;
          meal.name = meal.originalName;
        }
        meal.completed = false;
        meal.completedAt = null;
        meal.replaced = false;
        meal.replacedWith = null;
        meal.originalName = null;
        meal.originalCalories = null;
        meal.originalProteinGrams = null;
        meal.originalCarbsGrams = null;
        meal.originalFatGrams = null;
      }
    },

    replaceMeal: (state, action) => {
      const { mealId, foodName, calories, proteinGrams, carbsGrams, fatGrams } = action.payload;
      const meal = state.meals.find(m => String(m.mealId) === String(mealId));
      if (meal && !meal.completed) {
        // First subtract any already-completed individual food items
        if (meal.foodItems && meal.foodItems.length > 0) {
          meal.foodItems.forEach(fi => {
            if (fi.completed) {
              state.consumedCalories = Math.max(0, state.consumedCalories - (fi.calories || 0));
              state.consumedProtein = Math.max(0, state.consumedProtein - (fi.proteinGrams || 0));
              state.consumedCarbs = Math.max(0, state.consumedCarbs - (fi.carbsGrams || 0));
              state.consumedFat = Math.max(0, state.consumedFat - (fi.fatGrams || 0));
            }
          });
        }
        meal.completed = true;
        meal.completedAt = new Date().toISOString();
        meal.replaced = true;
        meal.originalName = meal.name;
        // Save original macros so they can be restored on undo
        meal.originalCalories = meal.calories;
        meal.originalProteinGrams = meal.proteinGrams;
        meal.originalCarbsGrams = meal.carbsGrams;
        meal.originalFatGrams = meal.fatGrams;
        meal.replacedWith = foodName;
        state.consumedCalories += calories;
        state.consumedProtein += proteinGrams;
        state.consumedCarbs += carbsGrams;
        state.consumedFat += fatGrams;
        meal.calories = calories;
        meal.proteinGrams = proteinGrams;
        meal.carbsGrams = carbsGrams;
        meal.fatGrams = fatGrams;
        // Clear food items since this is now a replacement meal
        meal.foodItems = [];
      }
    },

    clearTracking: (state) => {
      state.trackingDate = null;
      state.meals = [];
      state.consumedCalories = 0;
      state.consumedProtein = 0;
      state.consumedCarbs = 0;
      state.consumedFat = 0;
      state.loaded = false;
    },

    addExtraMeal: (state, action) => {
      const { mealName, foodItems } = action.payload;
      // Use a negative ID for extra meals — clearly distinguishes from real meal IDs (positive)
      // Format: -(HHMMSS + index) to keep it small and unique within a day
      const now = new Date();
      const hours = now.getHours();
      const items = foodItems || [];
      const mins = now.getMinutes();
      const secs = now.getSeconds();
      const existingExtras = state.meals.filter(m => m.isExtra).length;
      const extraId = -(hours * 10000 + mins * 100 + secs + existingExtras * 100000 + 1);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const timeOfDay = `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
      const totalProtein = items.reduce((s, f) => s + (f.proteinGrams || 0), 0);
      const totalCarbs = items.reduce((s, f) => s + (f.carbsGrams || 0), 0);
      const totalFat = items.reduce((s, f) => s + (f.fatGrams || 0), 0);
      const totalCalories = items.reduce((s, f) => s + (f.calories || 0), 0);

      const newMeal = {
        mealId: extraId,
        name: mealName || (items.length === 1 ? items[0].name : 'Extra Meal'),
        mealType: 'EXTRA',
        timeOfDay,
        calories: totalCalories,
        proteinGrams: totalProtein,
        carbsGrams: totalCarbs,
        fatGrams: totalFat,
        completed: true,
        completedAt: now.toISOString(),
        isExtra: true,
        foodItems: items,
      };

      state.meals.push(newMeal);
      state.meals = sortByTime(state.meals);
      state.consumedCalories += newMeal.calories;
      state.consumedProtein += newMeal.proteinGrams;
      state.consumedCarbs += newMeal.carbsGrams;
      state.consumedFat += newMeal.fatGrams;
    },

    removeExtraMeal: (state, action) => {
      const { mealId } = action.payload;
      const idx = state.meals.findIndex(m => String(m.mealId) === String(mealId) && m.isExtra);
      if (idx !== -1) {
        const meal = state.meals[idx];
        if (meal.completed) {
          state.consumedCalories = Math.max(0, state.consumedCalories - meal.calories);
          state.consumedProtein = Math.max(0, state.consumedProtein - meal.proteinGrams);
          state.consumedCarbs = Math.max(0, state.consumedCarbs - meal.carbsGrams);
          state.consumedFat = Math.max(0, state.consumedFat - meal.fatGrams);
        }
        state.meals.splice(idx, 1);
      }
    },
  },
});

export const { loadTracking, initMealsForToday, completeMeal, uncompleteMeal, completeFoodItem, uncompleteFoodItem, replaceMeal, clearTracking, addExtraMeal, removeExtraMeal } = mealTrackingSlice.actions;

// Export the helper so screens can use the same local date logic
export { getLocalDateString };

// Debounce backend sync — max once per 60 seconds
let lastMealSyncTime = 0;

// Persist to AsyncStorage + sync to backend (debounced)
export const persistTracking = () => async (dispatch, getState) => {
  const { mealTracking, auth } = getState();
  const userEmail = auth?.user?.email;
  const storageKey = getStorageKey(userEmail);
  const data = {
    trackingDate: mealTracking.trackingDate,
    meals: mealTracking.meals,
    consumedCalories: mealTracking.consumedCalories,
    consumedProtein: mealTracking.consumedProtein,
    consumedCarbs: mealTracking.consumedCarbs,
    consumedFat: mealTracking.consumedFat,
  };

  // 1. Always save to AsyncStorage (instant)
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
  } catch (e) {
    
  }

  // 2. Debounce backend sync — max once per 60 seconds
  const now = Date.now();
  if (now - lastMealSyncTime < 60000) return;
  lastMealSyncTime = now;

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
          foodItems: m.foodItems || [],
          originalCalories: m.originalCalories ?? null,
          originalProteinGrams: m.originalProteinGrams ?? null,
          originalCarbsGrams: m.originalCarbsGrams ?? null,
          originalFatGrams: m.originalFatGrams ?? null,
          isExtra: m.isExtra || false,
          foodItemsJson: m.foodItems && m.foodItems.length > 0 ? JSON.stringify(m.foodItems) : null,
        })),
        consumedCalories: mealTracking.consumedCalories || 0,
        consumedProtein: mealTracking.consumedProtein || 0,
        consumedCarbs: mealTracking.consumedCarbs || 0,
        consumedFat: mealTracking.consumedFat || 0,
      });
    } catch (e) {
      // Silent error
    }
  }
};

// Force sync to backend immediately (bypass debounce) — for meal complete/uncomplete
export const persistTrackingNow = () => async (dispatch, getState) => {
  const { mealTracking, auth } = getState();
  const userEmail = auth?.user?.email;
  const storageKey = getStorageKey(userEmail);

  // Save to AsyncStorage
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify({
      trackingDate: mealTracking.trackingDate,
      meals: mealTracking.meals,
      consumedCalories: mealTracking.consumedCalories,
      consumedProtein: mealTracking.consumedProtein,
      consumedCarbs: mealTracking.consumedCarbs,
      consumedFat: mealTracking.consumedFat,
    }));
  } catch (e) {
    
  }

  // Sync to backend immediately
  lastMealSyncTime = Date.now();
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
          foodItems: m.foodItems || [],
          originalCalories: m.originalCalories ?? null,
          originalProteinGrams: m.originalProteinGrams ?? null,
          originalCarbsGrams: m.originalCarbsGrams ?? null,
          originalFatGrams: m.originalFatGrams ?? null,
          isExtra: m.isExtra || false,
          foodItemsJson: m.foodItems && m.foodItems.length > 0 ? JSON.stringify(m.foodItems) : null,
        })),
        consumedProtein: mealTracking.consumedProtein || 0,
        consumedCarbs: mealTracking.consumedCarbs || 0,
        consumedFat: mealTracking.consumedFat || 0,
        consumedCalories: mealTracking.consumedCalories || 0,
      });
    } catch (e) {
      
    }
  }
};

// Load from AsyncStorage only (no API calls) — for focus/timer refreshes
export const loadTrackingLocal = () => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    const userEmail = auth?.user?.email;
    const storageKey = getStorageKey(userEmail);
    const raw = await AsyncStorage.getItem(storageKey);
    const today = getLocalDateString();

    if (raw) {
      const data = JSON.parse(raw);
      if (data.trackingDate && data.trackingDate !== today) {
        // Filter out extra meals — they should NOT carry over to the next day
        const regularMeals = (data.meals || []).filter(m => !m.isExtra);
        const resetData = {
          trackingDate: today,
          meals: regularMeals.map(m => {
            // Restore original macros if meal was replaced yesterday
            const calories = (m.replaced && m.originalCalories != null) ? m.originalCalories : m.calories;
            const proteinGrams = (m.replaced && m.originalProteinGrams != null) ? m.originalProteinGrams : m.proteinGrams;
            const carbsGrams = (m.replaced && m.originalCarbsGrams != null) ? m.originalCarbsGrams : m.carbsGrams;
            const fatGrams = (m.replaced && m.originalFatGrams != null) ? m.originalFatGrams : m.fatGrams;
            const name = (m.replaced && m.originalName) ? m.originalName : m.name;
            return {
              mealId: m.mealId,
              name,
              mealType: m.mealType,
              timeOfDay: m.timeOfDay,
              calories,
              proteinGrams,
              carbsGrams,
              fatGrams,
              completed: false,
              completedAt: null,
              replaced: false,
              replacedWith: null,
              originalName: null,
              originalCalories: null,
              originalProteinGrams: null,
              originalCarbsGrams: null,
              originalFatGrams: null,
              foodItems: (m.foodItems || []).map(fi => ({ ...fi, completed: false })),
            };
          }),
          consumedCalories: 0, consumedProtein: 0, consumedCarbs: 0, consumedFat: 0,
        };
        dispatch(loadTracking(resetData));
        await AsyncStorage.setItem(storageKey, JSON.stringify(resetData));
      } else {
        // Same day — only overwrite if AsyncStorage data has at least as many completions
        const currentState = getState().mealTracking;
        const currentCompletions = (currentState.meals || []).reduce((sum, m) =>
          sum + (m.completed ? 1 : 0) + (m.foodItems ? m.foodItems.filter(fi => fi.completed).length : 0), 0);
        const storageCompletions = (data.meals || []).reduce((sum, m) =>
          sum + (m.completed ? 1 : 0) + (m.foodItems ? m.foodItems.filter(fi => fi.completed).length : 0), 0);
        if (storageCompletions >= currentCompletions) {
          dispatch(loadTracking(data));
        }
      }
    } else {
      // No local cache — do NOT clear if meals already initialized in Redux
      const currentState = getState().mealTracking;
      if (!currentState.meals || currentState.meals.length === 0) {
        dispatch(loadTracking(null));
      }
    }
  } catch (e) {
    const currentState = getState().mealTracking;
    if (!currentState.meals || currentState.meals.length === 0) {
      dispatch(loadTracking(null));
    }
  }
};

// Load from AsyncStorage + sync from backend (API calls) — for initial mount only
export const loadTrackingFromStorage = () => async (dispatch, getState) => {
  try {
    const { auth } = getState();
    const userEmail = auth?.user?.email;
    const storageKey = getStorageKey(userEmail);
    const raw = await AsyncStorage.getItem(storageKey);
    const today = getLocalDateString();

    // 1. First check if user has an active nutrition plan (DB call)
    let hasActivePlan = false;
    try {
      const activePlan = await nutritionService.getActivePlan();
      hasActivePlan = !!(activePlan && activePlan.id);
    } catch (e) {
      // 204 No Content or network error — treat as no active plan if we got a response
      if (e.response && (e.response.status === 204 || e.response.status === 404)) {
        hasActivePlan = false;
      } else {
        // Network error — keep local data as fallback, assume plan may exist
        hasActivePlan = !!(raw);
        
      }
    }

    // 2. If no active plan, clear any stale meal tracking data
    if (!hasActivePlan) {
      dispatch(loadTracking(null));
      try { await AsyncStorage.removeItem(storageKey); } catch (_) {}
      return;
    }

    // 3. Active plan exists — load from local cache
    // BUT only if the state hasn't already been populated by initMealsForToday
    const currentStateBeforeLoad = getState().mealTracking;
    const alreadyInitialized = currentStateBeforeLoad.meals && currentStateBeforeLoad.meals.length > 0
      && currentStateBeforeLoad.trackingDate === today;

    if (raw) {
      const data = JSON.parse(raw);
      if (data.trackingDate && data.trackingDate !== today) {
        // Filter out extra meals — they should NOT carry over to the next day
        const regularMeals = (data.meals || []).filter(m => !m.isExtra);
        const resetData = {
          trackingDate: today,
          meals: regularMeals.map(m => {
            // Restore original macros if meal was replaced yesterday
            const calories = (m.replaced && m.originalCalories != null) ? m.originalCalories : m.calories;
            const proteinGrams = (m.replaced && m.originalProteinGrams != null) ? m.originalProteinGrams : m.proteinGrams;
            const carbsGrams = (m.replaced && m.originalCarbsGrams != null) ? m.originalCarbsGrams : m.carbsGrams;
            const fatGrams = (m.replaced && m.originalFatGrams != null) ? m.originalFatGrams : m.fatGrams;
            const name = (m.replaced && m.originalName) ? m.originalName : m.name;
            return {
              mealId: m.mealId,
              name,
              mealType: m.mealType,
              timeOfDay: m.timeOfDay,
              calories,
              proteinGrams,
              carbsGrams,
              fatGrams,
              completed: false,
              completedAt: null,
              replaced: false,
              replacedWith: null,
              originalName: null,
              originalCalories: null,
              originalProteinGrams: null,
              originalCarbsGrams: null,
              originalFatGrams: null,
              foodItems: (m.foodItems || []).map(fi => ({ ...fi, completed: false })),
            };
          }),
          consumedCalories: 0, consumedProtein: 0, consumedCarbs: 0, consumedFat: 0,
        };
        // Only overwrite if not already initialized with today's data
        if (!alreadyInitialized) {
          dispatch(loadTracking(resetData));
        }
        await AsyncStorage.setItem(storageKey, JSON.stringify(resetData));
      } else {
        // Same day data from AsyncStorage — only load if Redux state isn't already populated
        if (!alreadyInitialized) {
          dispatch(loadTracking(data));
        }
      }
    } else {
      // No local cache — do NOT clear if initMealsForToday already populated the state
      const currentState = getState().mealTracking;
      if (!currentState.meals || currentState.meals.length === 0) {
        dispatch(loadTracking(null));
      }
    }

    // 4. Try to merge from backend (restores data if app was reinstalled)
    try {
      const backendData = await nutritionService.getTodayTracking();
      if (backendData && backendData.meals && backendData.meals.length > 0) {
        // Use CURRENT Redux state for comparison (not stale AsyncStorage data)
        const currentState = getState().mealTracking;
        const currentMeals = currentState.meals || [];
        // Count meal-level AND food item-level completions for comparison
        const localCompletedCount = currentMeals.filter(m => m.completed).length;
        const localItemCompletedCount = currentMeals.reduce((sum, m) =>
          sum + (m.foodItems ? m.foodItems.filter(fi => fi.completed).length : 0), 0);
        const backendCompletedCount = backendData.meals.filter(m => m.completed).length;
        // Count food item completions from backend foodItemsJson
        let backendItemCompletedCount = 0;
        for (const m of backendData.meals) {
          if (m.foodItemsJson) {
            try {
              const items = JSON.parse(m.foodItemsJson);
              backendItemCompletedCount += items.filter(i => i.completed).length;
            } catch (e) { /* ignore parse errors */ }
          }
        }

        const localTotal = localCompletedCount + localItemCompletedCount;
        const backendTotal = backendCompletedCount + backendItemCompletedCount;

        if (backendTotal > localTotal) {
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
              originalCalories: m.originalCalories ?? null,
              originalProteinGrams: m.originalProteinGrams ?? null,
              originalCarbsGrams: m.originalCarbsGrams ?? null,
              originalFatGrams: m.originalFatGrams ?? null,
              isExtra: m.isExtra || false,
              foodItems: m.foodItemsJson ? JSON.parse(m.foodItemsJson) : (m.foodItems || []),
            })),
            consumedCalories: backendData.consumedCalories || 0,
            consumedProtein: backendData.consumedProtein || 0,
            consumedCarbs: backendData.consumedCarbs || 0,
            consumedFat: backendData.consumedFat || 0,
          };
          dispatch(loadTracking(restoredData));
          await AsyncStorage.setItem(storageKey, JSON.stringify(restoredData));
        }
      }
    } catch (e) {
      
    }
  } catch (e) {
    // Only clear if no meals were already initialized (prevent race condition)
    const currentState = getState().mealTracking;
    if (!currentState.meals || currentState.meals.length === 0) {
      dispatch(loadTracking(null));
    }
  }
};

export default mealTrackingSlice.reducer;

