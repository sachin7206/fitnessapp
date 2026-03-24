import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/core';
import { useDispatch, useSelector } from 'react-redux';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import nutritionService from '../services/nutritionService';
import {
  initMealsForToday,
  completeMeal,
  uncompleteMeal,
  replaceMeal,
  addExtraMeal,
  removeExtraMeal,
  persistTracking,
  persistTrackingNow,
  loadTrackingFromStorage,
  loadTrackingLocal,
  getLocalDateString,
} from '../store/slices/mealTrackingSlice';
import MacroPieChart from './components/MacroPieChart';

const MyNutritionPlanScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const tracking = useSelector((state) => state.mealTracking);
  const [activePlan, setActivePlan] = useState(route.params?.userPlan || null);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const isInitialMount = useRef(true);

  // Replacement food modal state
  const [replaceModalVisible, setReplaceModalVisible] = useState(false);
  const [replaceMealTarget, setReplaceMealTarget] = useState(null); // the meal being replaced
  const [replaceFoodText, setReplaceFoodText] = useState('');
  const [replaceProtein, setReplaceProtein] = useState('');
  const [replaceCarbs, setReplaceCarbs] = useState('');
  const [replaceFat, setReplaceFat] = useState('');
  const [replaceErrors, setReplaceErrors] = useState({});
  const [replaceTouched, setReplaceTouched] = useState({});
  const [estimating, setEstimating] = useState(false);

  // Extra meal modal state
  const [extraMealModalVisible, setExtraMealModalVisible] = useState(false);
  const [extraMealName, setExtraMealName] = useState('');
  const [extraProtein, setExtraProtein] = useState('');
  const [extraCarbs, setExtraCarbs] = useState('');
  const [extraFat, setExtraFat] = useState('');
  const [extraSaving, setExtraSaving] = useState(false);

  // Format strings: "WEIGHT_LOSS" → "Weight Loss", "NON_VEGETARIAN" → "Non Vegetarian"
  const formatLabel = (str) => {
    if (!str) return '';
    return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  // Update clock every 30 seconds; detect day change to auto-reset
  useEffect(() => {
    let lastDate = getLocalDateString();
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      const currentDate = getLocalDateString();
      if (currentDate !== lastDate) {
        lastDate = currentDate;
        dispatch(loadTrackingLocal());
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Load persisted tracking on mount
  useEffect(() => {
    dispatch(loadTrackingFromStorage());
  }, []);

  const fetchActivePlan = async () => {
    try {
      const response = await nutritionService.getActivePlan();
      

      if (response && response.nutritionPlan) {
        setActivePlan(response);

        const currentDay = response.currentDay || 1;
        const meals = response.nutritionPlan?.meals || [];

        // Filter meals for current day
        let todayMeals = meals.filter(meal => meal.dayNumber === currentDay);
        if (todayMeals.length === 0 && meals.length > 0) {
          todayMeals = meals; // Show all meals if no day match
        }

        // Sort meals by time (create a sorted copy)
        todayMeals = [...todayMeals].sort((a, b) => {
          return convertTimeToMinutes(a.timeOfDay) - convertTimeToMinutes(b.timeOfDay);
        });

        setTodaysMeals(todayMeals);

        // Init tracking state for today
        const today = getLocalDateString();
        dispatch(initMealsForToday({ date: today, meals: todayMeals }));
        dispatch(persistTracking());
      } else {
        // No active plan, go back to nutrition plans
        navigation.replace('NutritionPlans');
      }
    } catch (error) {
      
      navigation.replace('NutritionPlans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const convertTimeToMinutes = (timeStr) => {
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

  useEffect(() => {
    fetchActivePlan();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      fetchActivePlan();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivePlan();
  };

  const getMealIcon = (mealType) => {
    const icons = {
      'BREAKFAST': '🌅',
      'MORNING_SNACK': '🍎',
      'LUNCH': '☀️',
      'AFTERNOON_SNACK': '🥜',
      'EVENING_SNACK': '🍌',
      'DINNER': '🌙',
      'LATE_SNACK': '🌜',
      'PRE_WORKOUT': '⚡',
      'POST_WORKOUT': '💪',
    };
    return icons[mealType] || '🍽️';
  };

  const formatMealType = (mealType) => formatLabel(mealType) || 'Meal';

  const handleCreateNewPlan = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Create a new nutrition plan? Your current plan will be replaced immediately.')) {
        navigation.navigate('NutritionChoice');
      }
    } else {
      Alert.alert(
        'Create New Plan',
        'Your current plan will be replaced immediately. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => navigation.navigate('NutritionChoice') },
        ]
      );
    }
  };

  // Convert "8:00 AM" → minutes since midnight
  const getTimeInMinutes = (timeStr) => {
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

  const getNowMinutes = () => now.getHours() * 60 + now.getMinutes();

  /**
   * Returns meal status:
   *  - 'completed' : checkbox was ticked
   *  - 'active'    : within 30 min before meal time or at meal time (show prompt)
   *  - 'missed'    : meal time has passed without completion
   *  - 'upcoming'  : not yet 30 min before meal
   */
  const getMealStatus = (meal) => {
    const tracked = tracking.meals.find(m => m.mealId === (meal.id || meal.mealId));
    if (tracked?.completed) return 'completed';

    const mealMin = getTimeInMinutes(meal.timeOfDay);
    const nowMin = getNowMinutes();

    if (nowMin >= mealMin - 30 && nowMin <= mealMin) return 'active';   // 30 min window before
    if (nowMin > mealMin) return 'missed';
    return 'upcoming';
  };

  // Get the ordinal label: "1st", "2nd", "3rd", etc.
  const getOrdinal = (idx) => {
    const n = idx + 1;
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  };

  const handleCheckMeal = (meal) => {
    dispatch(completeMeal({ mealId: meal.id || meal.mealId }));
    dispatch(persistTrackingNow());
  };

  const handleUncheckMeal = (meal) => {
    const mealId = meal.id || meal.mealId;
    if (Platform.OS === 'web') {
      if (window.confirm('Undo this meal? Calories will be subtracted.')) {
        dispatch(uncompleteMeal({ mealId }));
        dispatch(persistTrackingNow());
      }
    } else {
      Alert.alert('Undo Meal', 'Undo this meal? Calories will be subtracted.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: () => {
            dispatch(uncompleteMeal({ mealId }));
            dispatch(persistTrackingNow());
          },
        },
      ]);
    }
  };

  // Called when a missed meal's "I ate something else" is tapped
  const handleAteSomethingElse = (meal) => {
    setReplaceMealTarget(meal);
    setReplaceFoodText('');
    setReplaceProtein('');
    setReplaceCarbs('');
    setReplaceFat('');
    setReplaceErrors({});
    setReplaceTouched({});
    setReplaceModalVisible(true);
  };

  // Inline validation for the replacement food form
  const validateReplaceField = (field, value) => {
    const errors = {};
    if (field === 'foodName') {
      if (!value || !value.trim()) errors.foodName = 'Food name is required';
    }
    if (field === 'protein') {
      if (!value && value !== 0 && value !== '0') errors.protein = 'Protein is required';
      else if (isNaN(Number(value)) || Number(value) < 0) errors.protein = 'Must be a valid number ≥ 0';
      else if (Number(value) > 500) errors.protein = 'Must be ≤ 500g';
    }
    if (field === 'carbs') {
      if (!value && value !== 0 && value !== '0') errors.carbs = 'Carbs is required';
      else if (isNaN(Number(value)) || Number(value) < 0) errors.carbs = 'Must be a valid number ≥ 0';
      else if (Number(value) > 1000) errors.carbs = 'Must be ≤ 1000g';
    }
    if (field === 'fat') {
      if (!value && value !== 0 && value !== '0') errors.fat = 'Fat is required';
      else if (isNaN(Number(value)) || Number(value) < 0) errors.fat = 'Must be a valid number ≥ 0';
      else if (Number(value) > 500) errors.fat = 'Must be ≤ 500g';
    }
    return errors;
  };

  const validateAllReplaceFields = () => {
    const errors = {
      ...validateReplaceField('foodName', replaceFoodText),
      ...validateReplaceField('protein', replaceProtein),
      ...validateReplaceField('carbs', replaceCarbs),
      ...validateReplaceField('fat', replaceFat),
    };
    setReplaceErrors(errors);
    setReplaceTouched({ foodName: true, protein: true, carbs: true, fat: true });
    return Object.keys(errors).length === 0;
  };

  const handleReplaceFieldChange = (field, value, setter) => {
    setter(value);
    if (replaceTouched[field]) {
      setReplaceErrors(prev => ({ ...prev, ...validateReplaceField(field, value) }));
      // Clear error if valid
      const fieldErrors = validateReplaceField(field, value);
      if (!fieldErrors[field]) {
        setReplaceErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
      }
    }
  };

  const handleReplaceFieldBlur = (field, value) => {
    setReplaceTouched(prev => ({ ...prev, [field]: true }));
    const fieldErrors = validateReplaceField(field, value);
    if (fieldErrors[field]) {
      setReplaceErrors(prev => ({ ...prev, ...fieldErrors }));
    } else {
      setReplaceErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  // Submit the replacement food with user-provided macros
  const handleSubmitReplacement = async () => {
    if (!validateAllReplaceFields()) return;

    const proteinVal = parseFloat(replaceProtein) || 0;
    const carbsVal = parseFloat(replaceCarbs) || 0;
    const fatVal = parseFloat(replaceFat) || 0;
    // Calculate calories: protein 4 kcal/g, carbs 4 kcal/g, fat 9 kcal/g
    const estimatedCalories = Math.round(proteinVal * 4 + carbsVal * 4 + fatVal * 9);

    setEstimating(true);
    try {
      dispatch(replaceMeal({
        mealId: replaceMealTarget.id || replaceMealTarget.mealId,
        foodName: replaceFoodText.trim(),
        calories: estimatedCalories,
        proteinGrams: proteinVal,
        carbsGrams: carbsVal,
        fatGrams: fatVal,
      }));
      dispatch(persistTrackingNow());
      setReplaceModalVisible(false);
    } catch (err) {
      const errorMsg = 'Failed to save replacement. Please try again.';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setEstimating(false);
    }
  };

  // ========== EXTRA MEAL HANDLERS ==========
  const handleOpenExtraMealModal = () => {
    setExtraMealName('');
    setExtraProtein('');
    setExtraCarbs('');
    setExtraFat('');
    setExtraMealModalVisible(true);
  };

  const handleSubmitExtraMeal = async () => {
    if (!extraMealName.trim()) {
      const msg = 'Please enter a meal name.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }
    const protein = parseFloat(extraProtein) || 0;
    const carbs = parseFloat(extraCarbs) || 0;
    const fat = parseFloat(extraFat) || 0;
    const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);

    const currentExtras = tracking.meals.filter(m => m.isExtra).length;
    if (currentExtras >= 10) {
      const msg = 'You can add a maximum of 10 extra meals per day.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Limit Reached', msg);
      return;
    }

    setExtraSaving(true);
    try {
      dispatch(addExtraMeal({
        mealName: extraMealName.trim(),
        foodItems: [{
          name: extraMealName.trim(),
          quantity: '1 serving',
          proteinGrams: protein,
          carbsGrams: carbs,
          fatGrams: fat,
          calories,
        }],
      }));
      await dispatch(persistTrackingNow());
      setExtraMealModalVisible(false);
    } catch (err) {
      const errorMsg = 'Failed to add extra meal. Please try again.';
      Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert('Error', errorMsg);
    } finally {
      setExtraSaving(false);
    }
  };

  const handleRemoveExtraMeal = (meal) => {
    const doRemove = async () => {
      dispatch(removeExtraMeal({ mealId: meal.mealId }));
      try { await dispatch(persistTrackingNow()); } catch (e) { /* silent */ }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${meal.name}"? Its calories will be subtracted.`)) {
        doRemove();
      }
    } else {
      Alert.alert('Remove Extra Meal', `Remove "${meal.name}"? Its calories will be subtracted.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  const renderMealCard = (meal, index) => {
    const status = getMealStatus(meal);
    const tracked = tracking.meals.find(m => m.mealId === (meal.id || meal.mealId));
    const isCompleted = tracked?.completed === true;
    const isReplaced = tracked?.replaced === true;
    const ordinal = getOrdinal(index);

    // Determine the prompt banner
    let promptBanner = null;
    if (isReplaced) {
      promptBanner = (
        <View style={[styles.mealPrompt, styles.mealPromptReplaced]}>
          <Text style={styles.promptEmoji}>🔄</Text>
          <Text style={styles.promptTextReplaced}>
            Replaced with: {tracked.replacedWith}
          </Text>
        </View>
      );
    } else if (status === 'completed') {
      promptBanner = (
        <View style={[styles.mealPrompt, styles.mealPromptDone]}>
          <Text style={styles.promptEmoji}>✅</Text>
          <Text style={styles.promptText}>Great job! {ordinal} meal completed</Text>
        </View>
      );
    } else if (status === 'active') {
      promptBanner = (
        <View style={[styles.mealPrompt, styles.mealPromptActive]}>
          <Text style={styles.promptEmoji}>🍽️</Text>
          <Text style={styles.promptTextActive}>Time for your {ordinal} meal!</Text>
        </View>
      );
    } else if (status === 'missed') {
      promptBanner = (
        <View style={[styles.mealPrompt, styles.mealPromptMissed]}>
          <Text style={styles.promptEmoji}>😔</Text>
          <Text style={styles.promptTextMissed}>You are not on track</Text>
        </View>
      );
    }

    return (
      <View
        key={meal.id || index}
        style={[
          styles.mealCard,
          isCompleted && !isReplaced && styles.mealCardCompleted,
          isReplaced && styles.mealCardReplaced,
          status === 'missed' && !isCompleted && styles.mealCardMissed,
        ]}
      >
        {promptBanner}

        <View style={styles.mealHeader}>
          <View style={styles.mealIconContainer}>
            <Text style={styles.mealIcon}>
              {isReplaced ? '🔄' : getMealIcon(meal.mealType)}
            </Text>
          </View>
          <View style={styles.mealInfo}>
            <Text style={[
              styles.mealName,
              isCompleted && !isReplaced && styles.mealNameDone,
              isReplaced && styles.mealNameReplaced,
            ]}>
              {isReplaced ? tracked.replacedWith : (meal.name || formatMealType(meal.mealType))}
            </Text>
            {isReplaced && (
              <Text style={styles.replacedOriginal}>
                ✕ {tracked.originalName || meal.name}
              </Text>
            )}
            <Text style={styles.mealTime}>🕐 {meal.timeOfDay || 'Anytime'}</Text>
          </View>
          <View style={styles.mealCalories}>
            <Text style={styles.caloriesValue}>
              {isReplaced ? tracked.calories : (meal.calories || 0)}
            </Text>
            <Text style={styles.caloriesLabel}>kcal</Text>
          </View>
        </View>

        {/* Food items — only show if not replaced */}
        {!isReplaced && meal.foodItems && meal.foodItems.length > 0 && (
          <View style={styles.foodItemsContainer}>
            {meal.foodItems.map((item, idx) => (
              <View key={idx} style={styles.foodItem}>
                <Text style={styles.foodItemBullet}>•</Text>
                <View style={styles.foodItemContent}>
                  <Text style={[styles.foodItemText, isCompleted && styles.foodItemDone]}>
                    {item.name} {item.quantity ? `(${item.quantity})` : ''}
                  </Text>
                  <Text style={styles.foodItemMacros}>
                    P: {item.proteinGrams?.toFixed(0) || 0}g | C: {item.carbsGrams?.toFixed(0) || 0}g | F: {item.fatGrams?.toFixed(0) || 0}g
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Replacement macros */}
        {isReplaced && (
          <View>
            <View style={styles.replacedMacrosContainer}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{tracked.proteinGrams?.toFixed(0) || 0}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{tracked.carbsGrams?.toFixed(0) || 0}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{tracked.fatGrams?.toFixed(0) || 0}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
            <MacroPieChart
              protein={tracked.proteinGrams || 0}
              carbs={tracked.carbsGrams || 0}
              fat={tracked.fatGrams || 0}
            />
          </View>
        )}

        {!isReplaced && (
          <View>
            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{meal.proteinGrams?.toFixed(0) || 0}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{meal.carbsGrams?.toFixed(0) || 0}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{meal.fatGrams?.toFixed(0) || 0}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
            <MacroPieChart
              protein={meal.proteinGrams || 0}
              carbs={meal.carbsGrams || 0}
              fat={meal.fatGrams || 0}
            />
          </View>
        )}

        {/* Checkbox – only for active meals (30 min before meal time) */}
        {!isCompleted && status === 'active' && (
          <TouchableOpacity
            style={[styles.checkboxRow, styles.checkboxRowActive]}
            onPress={() => handleCheckMeal(meal)}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              <Text style={styles.checkboxInner}> </Text>
            </View>
            <Text style={styles.checkboxLabel}>
              Have you taken your {ordinal} meal?
            </Text>
          </TouchableOpacity>
        )}

        {/* Missed meal — two options: mark as taken OR ate something else */}
        {!isCompleted && status === 'missed' && (
          <View>
            <TouchableOpacity
              style={[styles.checkboxRow, styles.checkboxRowMissed]}
              onPress={() => handleCheckMeal(meal)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                <Text style={styles.checkboxInner}> </Text>
              </View>
              <Text style={styles.checkboxLabel}>
                Mark {ordinal} meal as taken
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ateSomethingElseBtn}
              onPress={() => handleAteSomethingElse(meal)}
              activeOpacity={0.7}
            >
              <Text style={styles.ateSomethingElseIcon}>🍔</Text>
              <Text style={styles.ateSomethingElseText}>
                I ate something else
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed — tap to undo */}
        {isCompleted && (
          <TouchableOpacity
            style={styles.completedRow}
            onPress={() => handleUncheckMeal(meal)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxChecked}>
              <Text style={styles.checkboxCheck}>✓</Text>
            </View>
            <Text style={styles.completedLabel}>
              {isReplaced ? 'Replaced' : 'Meal taken'} ✅
            </Text>
            <Text style={styles.undoHint}>Tap to undo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const totalCalories = todaysMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const totalProtein = todaysMeals.reduce((sum, meal) => sum + (meal.proteinGrams || 0), 0);
  const totalCarbs = todaysMeals.reduce((sum, meal) => sum + (meal.carbsGrams || 0), 0);
  const totalFat = todaysMeals.reduce((sum, meal) => sum + (meal.fatGrams || 0), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your meal plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Nutrition Plan</Text>
        <TouchableOpacity onPress={handleCreateNewPlan} style={styles.newPlanButton}>
          <Text style={styles.newPlanButtonText}>New Plan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Plan Summary */}
        <View style={styles.planSummary}>
          <Text style={styles.planName}>{formatLabel(activePlan?.nutritionPlan?.name)}</Text>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>Day {activePlan?.currentDay || 1}</Text>
          </View>
        </View>

        {/* Daily Totals – consumed / target */}
        <View style={styles.dailyTotals}>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{tracking.consumedCalories}</Text>
            <Text style={styles.totalConsumedLabel}>of {totalCalories}</Text>
            <Text style={styles.totalLabel}>Calories</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{tracking.consumedProtein.toFixed(0)}g</Text>
            <Text style={styles.totalConsumedLabel}>of {totalProtein.toFixed(0)}g</Text>
            <Text style={styles.totalLabel}>Protein</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{tracking.consumedCarbs.toFixed(0)}g</Text>
            <Text style={styles.totalConsumedLabel}>of {totalCarbs.toFixed(0)}g</Text>
            <Text style={styles.totalLabel}>Carbs</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{tracking.consumedFat.toFixed(0)}g</Text>
            <Text style={styles.totalConsumedLabel}>of {totalFat.toFixed(0)}g</Text>
            <Text style={styles.totalLabel}>Fat</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressPercent}>
              {totalCalories > 0 ? Math.round((tracking.consumedCalories / totalCalories) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${totalCalories > 0 ? Math.min(100, (tracking.consumedCalories / totalCalories) * 100) : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressSub}>
            {tracking.meals.filter(m => m.completed).length} of {tracking.meals.length} meals completed
          </Text>
        </View>


        {/* Today's Meals */}
        <Text style={styles.sectionTitle}>Today's Meals ({todaysMeals.length})</Text>

        {todaysMeals.length > 0 ? (
          todaysMeals.map((meal, index) => renderMealCard(meal, index))
        ) : (
          <View style={styles.noMealsContainer}>
            <Text style={styles.noMealsIcon}>🍽️</Text>
            <Text style={styles.noMealsText}>No meals found for today</Text>
          </View>
        )}

        {/* Extra Meals Section */}
        {tracking.meals.filter(m => m.isExtra).length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
              🍕 Extra Meals ({tracking.meals.filter(m => m.isExtra).length})
            </Text>
            {tracking.meals.filter(m => m.isExtra).map((extraMeal, idx) => (
              <View key={extraMeal.mealId || `extra-${idx}`} style={[styles.mealCard, styles.extraMealCard]}>
                <View style={styles.mealHeader}>
                  <View style={[styles.mealIconContainer, { backgroundColor: colors.warning + '20' }]}>
                    <Text style={styles.mealIcon}>🍕</Text>
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{extraMeal.name || 'Extra Meal'}</Text>
                    <Text style={styles.mealTime}>Added today</Text>
                  </View>
                  <View style={styles.mealCalories}>
                    <Text style={styles.caloriesValue}>{extraMeal.calories || 0}</Text>
                    <Text style={styles.caloriesLabel}>kcal</Text>
                  </View>
                </View>
                {extraMeal.foodItems && extraMeal.foodItems.length > 0 && (
                  <View>
                    <View style={styles.replacedMacrosContainer}>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>{extraMeal.foodItems[0]?.proteinGrams?.toFixed(0) || 0}g</Text>
                        <Text style={styles.macroLabel}>Protein</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>{extraMeal.foodItems[0]?.carbsGrams?.toFixed(0) || 0}g</Text>
                        <Text style={styles.macroLabel}>Carbs</Text>
                      </View>
                      <View style={styles.macroItem}>
                        <Text style={styles.macroValue}>{extraMeal.foodItems[0]?.fatGrams?.toFixed(0) || 0}g</Text>
                        <Text style={styles.macroLabel}>Fat</Text>
                      </View>
                    </View>
                    <MacroPieChart
                      protein={extraMeal.foodItems[0]?.proteinGrams || 0}
                      carbs={extraMeal.foodItems[0]?.carbsGrams || 0}
                      fat={extraMeal.foodItems[0]?.fatGrams || 0}
                    />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeExtraBtn}
                  onPress={() => handleRemoveExtraMeal(extraMeal)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeExtraBtnText}>🗑️ Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Add Extra Meal Button */}
        <TouchableOpacity
          style={styles.addExtraMealBtn}
          onPress={handleOpenExtraMealModal}
          activeOpacity={0.7}
        >
          <Text style={styles.addExtraMealIcon}>➕</Text>
          <Text style={styles.addExtraMealText}>Add Extra Meal</Text>
        </TouchableOpacity>

        {/* Macro Percentages */}
        {totalCalories > 0 && (
          <View style={styles.macroPercentCard}>
            <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>Macro Breakdown</Text>
            {[
              { label: 'Protein', consumed: tracking.consumedProtein, total: totalProtein, color: '#3B82F6' },
              { label: 'Carbs', consumed: tracking.consumedCarbs, total: totalCarbs, color: '#F59E0B' },
              { label: 'Fat', consumed: tracking.consumedFat, total: totalFat, color: '#EF4444' },
            ].map((macro) => {
              const pct = macro.total > 0 ? Math.min(100, Math.round((macro.consumed / macro.total) * 100)) : 0;
              return (
                <View key={macro.label} style={styles.macroBarRow}>
                  <Text style={styles.macroBarLabel}>{macro.label}</Text>
                  <View style={styles.macroBarBg}>
                    <View style={[styles.macroBarFill, { width: `${pct}%`, backgroundColor: macro.color }]} />
                  </View>
                  <Text style={[styles.macroBarPct, { color: macro.color }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Replacement Food Modal */}
      <Modal
        visible={replaceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReplaceModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🍔 What did you eat instead?</Text>
            <Text style={styles.modalSubtitle}>
              Instead of: {replaceMealTarget?.name}
            </Text>

            {/* Food Name */}
            <Text style={styles.fieldLabel}>Food Name *</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputSingle, replaceTouched.foodName && replaceErrors.foodName && styles.modalInputError]}
              placeholder="e.g. 2 parathas with curd, dal rice..."
              placeholderTextColor={colors.text.light}
              value={replaceFoodText}
              onChangeText={(v) => handleReplaceFieldChange('foodName', v, setReplaceFoodText)}
              onBlur={() => handleReplaceFieldBlur('foodName', replaceFoodText)}
              maxLength={200}
              autoFocus
            />
            {replaceTouched.foodName && replaceErrors.foodName && (
              <Text style={styles.fieldError}>{replaceErrors.foodName}</Text>
            )}

            {/* Macros Row */}
            <Text style={styles.fieldLabel}>Nutritional Details *</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>Protein (g)</Text>
                <TextInput
                  style={[styles.macroInput, replaceTouched.protein && replaceErrors.protein && styles.modalInputError]}
                  placeholder="0"
                  placeholderTextColor={colors.text.light}
                  keyboardType="decimal-pad"
                  value={replaceProtein}
                  onChangeText={(v) => handleReplaceFieldChange('protein', v, setReplaceProtein)}
                  onBlur={() => handleReplaceFieldBlur('protein', replaceProtein)}
                />
                {replaceTouched.protein && replaceErrors.protein && (
                  <Text style={styles.fieldError}>{replaceErrors.protein}</Text>
                )}
              </View>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>Carbs (g)</Text>
                <TextInput
                  style={[styles.macroInput, replaceTouched.carbs && replaceErrors.carbs && styles.modalInputError]}
                  placeholder="0"
                  placeholderTextColor={colors.text.light}
                  keyboardType="decimal-pad"
                  value={replaceCarbs}
                  onChangeText={(v) => handleReplaceFieldChange('carbs', v, setReplaceCarbs)}
                  onBlur={() => handleReplaceFieldBlur('carbs', replaceCarbs)}
                />
                {replaceTouched.carbs && replaceErrors.carbs && (
                  <Text style={styles.fieldError}>{replaceErrors.carbs}</Text>
                )}
              </View>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>Fat (g)</Text>
                <TextInput
                  style={[styles.macroInput, replaceTouched.fat && replaceErrors.fat && styles.modalInputError]}
                  placeholder="0"
                  placeholderTextColor={colors.text.light}
                  keyboardType="decimal-pad"
                  value={replaceFat}
                  onChangeText={(v) => handleReplaceFieldChange('fat', v, setReplaceFat)}
                  onBlur={() => handleReplaceFieldBlur('fat', replaceFat)}
                />
                {replaceTouched.fat && replaceErrors.fat && (
                  <Text style={styles.fieldError}>{replaceErrors.fat}</Text>
                )}
              </View>
            </View>

            {/* Estimated calories preview */}
            {replaceProtein !== '' && replaceCarbs !== '' && replaceFat !== '' &&
              !replaceErrors.protein && !replaceErrors.carbs && !replaceErrors.fat && (
              <Text style={styles.caloriePreview}>
                🔥 Estimated: {Math.round((parseFloat(replaceProtein) || 0) * 4 + (parseFloat(replaceCarbs) || 0) * 4 + (parseFloat(replaceFat) || 0) * 9)} kcal
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReplaceModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  estimating && styles.modalSubmitDisabled,
                ]}
                onPress={handleSubmitReplacement}
                disabled={estimating}
              >
                {estimating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Extra Meal Modal */}
      <Modal
        visible={extraMealModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExtraMealModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>➕ Add Extra Meal</Text>
              <Text style={styles.modalSubtitle}>
                Log something you ate outside your plan
              </Text>

              <Text style={styles.fieldLabel}>Meal Name *</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputSingle]}
                placeholder="e.g. Protein shake, Fruit bowl..."
                placeholderTextColor={colors.text.light}
                value={extraMealName}
                onChangeText={setExtraMealName}
                maxLength={200}
                autoFocus
              />

              <Text style={styles.fieldLabel}>Nutritional Details (optional)</Text>
              <View style={styles.macroRow}>
                <View style={styles.macroField}>
                  <Text style={styles.macroLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.macroInput}
                    placeholder="0"
                    placeholderTextColor={colors.text.light}
                    keyboardType="decimal-pad"
                    value={extraProtein}
                    onChangeText={setExtraProtein}
                  />
                </View>
                <View style={styles.macroField}>
                  <Text style={styles.macroLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.macroInput}
                    placeholder="0"
                    placeholderTextColor={colors.text.light}
                    keyboardType="decimal-pad"
                    value={extraCarbs}
                    onChangeText={setExtraCarbs}
                  />
                </View>
                <View style={styles.macroField}>
                  <Text style={styles.macroLabel}>Fat (g)</Text>
                  <TextInput
                    style={styles.macroInput}
                    placeholder="0"
                    placeholderTextColor={colors.text.light}
                    keyboardType="decimal-pad"
                    value={extraFat}
                    onChangeText={setExtraFat}
                  />
                </View>
              </View>

              {/* Estimated calories preview */}
              {(extraProtein !== '' || extraCarbs !== '' || extraFat !== '') && (
                <Text style={styles.caloriePreview}>
                  🔥 Estimated: {Math.round(
                    (parseFloat(extraProtein) || 0) * 4 +
                    (parseFloat(extraCarbs) || 0) * 4 +
                    (parseFloat(extraFat) || 0) * 9
                  )} kcal
                </Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setExtraMealModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, extraSaving && styles.modalSubmitDisabled]}
                  onPress={handleSubmitExtraMeal}
                  disabled={extraSaving}
                >
                  {extraSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Add Meal</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.inverse,
  },
  newPlanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  newPlanButtonText: {
    ...typography.bodySmall,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  planSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planName: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  dayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  dayBadgeText: {
    ...typography.bodySmall,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  dailyTotals: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalValue: {
    ...typography.h3,
    color: colors.primary,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  mealIcon: {
    fontSize: 24,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  mealTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  mealCalories: {
    alignItems: 'center',
  },
  caloriesValue: {
    ...typography.h3,
    color: colors.primary,
  },
  caloriesLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  foodItemsContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  foodItemBullet: {
    color: colors.primary,
    marginRight: spacing.xs,
    fontWeight: 'bold',
    fontSize: 16,
  },
  foodItemContent: {
    flex: 1,
  },
  foodItemText: {
    ...typography.body,
    color: colors.text.primary,
  },
  foodItemMacros: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  macroLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  noMealsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  noMealsIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noMealsText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  // --- Consumed label under totals ---
  totalConsumedLabel: {
    ...typography.caption,
    color: colors.text.light,
    fontSize: 10,
  },
  // --- Progress bar ---
  progressContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  progressPercent: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.primary + '20',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 5,
  },
  progressSub: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  // --- Prompt banners ---
  mealPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  mealPromptDone: {
    backgroundColor: colors.success + '18',
  },
  mealPromptActive: {
    backgroundColor: colors.primary + '18',
  },
  mealPromptMissed: {
    backgroundColor: colors.error + '18',
  },
  promptEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  promptText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
  promptTextActive: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  promptTextMissed: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
    flex: 1,
  },
  // --- Completed / missed card tints ---
  mealCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    opacity: 0.85,
  },
  mealCardMissed: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  mealNameDone: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  foodItemDone: {
    textDecorationLine: 'line-through',
    color: colors.text.light,
  },
  // --- Checkbox row ---
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  checkboxRowActive: {
    backgroundColor: colors.primary + '10',
  },
  checkboxRowMissed: {
    backgroundColor: colors.error + '10',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxInner: {
    fontSize: 12,
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success + '12',
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxCheck: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  completedLabel: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
  undoHint: {
    ...typography.caption,
    color: colors.text.light,
    fontStyle: 'italic',
  },
  // --- Replaced meal ---
  mealCardReplaced: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  mealPromptReplaced: {
    backgroundColor: colors.warning + '18',
  },
  promptTextReplaced: {
    ...typography.bodySmall,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  mealNameReplaced: {
    color: '#6B7280',
    fontWeight: '700',
  },
  replacedOriginal: {
    ...typography.caption,
    color: colors.error,
    textDecorationLine: 'line-through',
  },
  replacedMacrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.warning + '40',
  },
  // --- Ate something else ---
  ateSomethingElseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warning + '15',
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  ateSomethingElseIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  ateSomethingElseText: {
    ...typography.bodySmall,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  // --- Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.text.light + '40',
    marginBottom: spacing.xs,
  },
  modalInputSingle: {
    minHeight: 44,
    textAlignVertical: 'center',
  },
  modalInputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  fieldLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  fieldError: {
    ...typography.caption,
    color: '#EF4444',
    marginBottom: spacing.xs,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  macroField: {
    flex: 1,
    marginHorizontal: 3,
  },
  macroLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.text.light + '40',
    textAlign: 'center',
  },
  caloriePreview: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  modalHint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
  },
  modalCancelText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minWidth: 90,
    alignItems: 'center',
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  quickActionBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 11,
  },
  // --- Extra Meal ---
  extraMealCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    backgroundColor: colors.surface,
  },
  addExtraMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
    borderStyle: 'dashed',
  },
  addExtraMealIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  addExtraMealText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  removeExtraBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.error + '12',
  },
  removeExtraBtnText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  // --- Macro Percentages ---
  macroPercentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  macroBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  macroBarLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    width: 60,
    fontWeight: '600',
  },
  macroBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: colors.border + '60',
    borderRadius: 5,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  macroBarPct: {
    ...typography.bodySmall,
    fontWeight: '700',
    width: 42,
    textAlign: 'right',
  },
});

export default MyNutritionPlanScreen;

