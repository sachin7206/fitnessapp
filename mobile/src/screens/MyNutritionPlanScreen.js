import React, { useState, useEffect, useCallback } from 'react';
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
  persistTracking,
  loadTrackingFromStorage,
  getLocalDateString,
} from '../store/slices/mealTrackingSlice';

const MyNutritionPlanScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const tracking = useSelector((state) => state.mealTracking);
  const [activePlan, setActivePlan] = useState(route.params?.userPlan || null);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  // Replacement food modal state
  const [replaceModalVisible, setReplaceModalVisible] = useState(false);
  const [replaceMealTarget, setReplaceMealTarget] = useState(null); // the meal being replaced
  const [replaceFoodText, setReplaceFoodText] = useState('');
  const [estimating, setEstimating] = useState(false);

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
        dispatch(loadTrackingFromStorage());
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
      console.log('Fetched active plan:', response);

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
      console.log('Error fetching plan:', error);
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
      if (window.confirm('Create a new nutrition plan? This will replace your current plan.')) {
        navigation.navigate('NutritionProfileSetup');
      }
    } else {
      Alert.alert(
        'Create New Plan',
        'This will replace your current plan. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => navigation.navigate('NutritionProfileSetup') },
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
    dispatch(persistTracking());
  };

  const handleUncheckMeal = (meal) => {
    const mealId = meal.id || meal.mealId;
    if (Platform.OS === 'web') {
      if (window.confirm('Undo this meal? Calories will be subtracted.')) {
        dispatch(uncompleteMeal({ mealId }));
        dispatch(persistTracking());
      }
    } else {
      Alert.alert('Undo Meal', 'Undo this meal? Calories will be subtracted.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: () => {
            dispatch(uncompleteMeal({ mealId }));
            dispatch(persistTracking());
          },
        },
      ]);
    }
  };

  // Called when a missed meal's "I ate something else" is tapped
  const handleAteSomethingElse = (meal) => {
    setReplaceMealTarget(meal);
    setReplaceFoodText('');
    setReplaceModalVisible(true);
  };

  // Submit the replacement food — estimate macros via AI, then replace
  const handleSubmitReplacement = async () => {
    if (!replaceFoodText.trim()) return;
    setEstimating(true);
    try {
      const macros = await nutritionService.estimateMacros(replaceFoodText.trim());
      dispatch(replaceMeal({
        mealId: replaceMealTarget.id || replaceMealTarget.mealId,
        foodName: macros.name || replaceFoodText.trim(),
        calories: macros.calories || 400,
        proteinGrams: macros.proteinGrams || 15,
        carbsGrams: macros.carbsGrams || 45,
        fatGrams: macros.fatGrams || 12,
      }));
      dispatch(persistTracking());
      setReplaceModalVisible(false);
    } catch (err) {
      // Fallback defaults
      dispatch(replaceMeal({
        mealId: replaceMealTarget.id || replaceMealTarget.mealId,
        foodName: replaceFoodText.trim(),
        calories: 400,
        proteinGrams: 15,
        carbsGrams: 45,
        fatGrams: 12,
      }));
      dispatch(persistTracking());
      setReplaceModalVisible(false);
    } finally {
      setEstimating(false);
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
        )}

        {!isReplaced && (
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

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Replacement Food Modal */}
      <Modal
        visible={replaceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReplaceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🍔 What did you eat instead?</Text>
            <Text style={styles.modalSubtitle}>
              Instead of: {replaceMealTarget?.name}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 2 parathas with curd, dal rice..."
              placeholderTextColor={colors.text.light}
              value={replaceFoodText}
              onChangeText={setReplaceFoodText}
              multiline
              autoFocus
            />

            <Text style={styles.modalHint}>
              💡 We'll estimate the calories & macros using AI
            </Text>

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
                  (!replaceFoodText.trim() || estimating) && styles.modalSubmitDisabled,
                ]}
                onPress={handleSubmitReplacement}
                disabled={!replaceFoodText.trim() || estimating}
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
    color: '#B8860B',
    fontWeight: '600',
    flex: 1,
  },
  mealNameReplaced: {
    color: '#B8860B',
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
    color: '#B8860B',
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
    marginBottom: spacing.sm,
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
});

export default MyNutritionPlanScreen;

