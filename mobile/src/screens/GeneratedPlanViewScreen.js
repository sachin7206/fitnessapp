import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import nutritionService from '../services/nutritionService';

const GeneratedPlanViewScreen = ({ navigation, route }) => {
  const {
    plan: existingPlan,
    region,
    foodPreferences,
    customMeals,
    workoutMeals,
    canTakeWheyProtein,
    supplements,
  } = route.params || {};

  const [plan, setPlan] = useState(existingPlan || null);
  const [loading, setLoading] = useState(!existingPlan);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!existingPlan && region) {
      generatePlan();
    }
  }, []);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const request = {
        region,
        customMeals: (customMeals || []).map(m => ({
          name: m.name,
          type: m.type,
          time: m.time,
          enabled: m.enabled,
        })),
        includePreWorkoutMeal: workoutMeals?.includePreWorkout,
        preWorkoutTime: workoutMeals?.preWorkoutTime,
        includePostWorkoutMeal: workoutMeals?.includePostWorkout,
        postWorkoutTime: workoutMeals?.postWorkoutTime,
        canTakeWheyProtein,
        supplements,
        foodPreferences: foodPreferences ? {
          includeChicken: foodPreferences.includeChicken,
          includeFish: foodPreferences.includeFish,
          includeRedMeat: foodPreferences.includeRedMeat,
          eggsPerDay: foodPreferences.eggsPerDay,
          includeRice: foodPreferences.includeRice,
          includeRoti: foodPreferences.includeRoti,
          includeDal: foodPreferences.includeDal,
          includeMilk: foodPreferences.includeMilk,
          includePaneer: foodPreferences.includePaneer,
          includeCurd: foodPreferences.includeCurd,
          allergies: foodPreferences.allergies,
          dislikedFoods: foodPreferences.dislikedFoods,
          cookingOilPreference: foodPreferences.cookingOilPreference,
          preferHomemade: foodPreferences.preferHomemade,
        } : null,
      };

      const generatedPlan = await nutritionService.generatePersonalizedPlan(request);
      setPlan(generatedPlan);
    } catch (err) {
      
      setError(err.response?.data?.message || 'Failed to generate nutrition plan');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getMealTypeIcon = (mealType) => {
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
      'SNACK': '🍎',
    };
    return icons[mealType] || '🍽️';
  };

  const handleStartPlan = () => {
    showAlert('Plan Activated! 🎉', 'Your personalized nutrition plan is now active!');
    navigation.reset({
      index: 0,
      routes: [
        { name: 'MainTabs' },
        { name: 'MyNutritionPlan' },
      ],
    });
  };

  // Calculate meal totals
  const calculateMealTotals = (foodItems) => {
    if (!foodItems || foodItems.length === 0) {
      return { protein: 0, carbs: 0, fat: 0, calories: 0 };
    }
    return foodItems.reduce((acc, item) => ({
      protein: acc.protein + (item.proteinGrams || item.protein || 0),
      carbs: acc.carbs + (item.carbsGrams || item.carbs || 0),
      fat: acc.fat + (item.fatGrams || item.fat || 0),
      calories: acc.calories + (item.calories || 0),
    }), { protein: 0, carbs: 0, fat: 0, calories: 0 });
  };

  const renderMacroCircle = (value, label, color) => (
    <View style={styles.macroItem}>
      <View style={[styles.macroCircle, { borderColor: color }]}>
        <Text style={[styles.macroValue, { color }]}>{Math.round(value || 0)}g</Text>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );

  const renderMiniMacro = (value, label, color) => (
    <View style={styles.miniMacroItem}>
      <Text style={[styles.miniMacroValue, { color }]}>{Math.round(value || 0)}g</Text>
      <Text style={styles.miniMacroLabel}>{label}</Text>
    </View>
  );

  const renderMeal = (meal, index) => {
    const mealTotals = calculateMealTotals(meal.foodItems);

    return (
      <View key={meal.id || index} style={styles.mealCard}>
        {/* Meal Header */}
        <View style={styles.mealHeader}>
          <Text style={styles.mealIcon}>{getMealTypeIcon(meal.mealType)}</Text>
          <View style={styles.mealInfo}>
            <Text style={styles.mealType}>{meal.mealType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</Text>
            <Text style={styles.mealTime}>🕐 {meal.timeOfDay}</Text>
          </View>
          <View style={styles.mealCalories}>
            <Text style={styles.calorieValue}>{mealTotals.calories || meal.calories || 0}</Text>
            <Text style={styles.calorieLabel}>cal</Text>
          </View>
        </View>

        <Text style={styles.mealName}>{meal.name}</Text>

        {/* Food Items with individual macros */}
        {meal.foodItems && meal.foodItems.length > 0 && (
          <View style={styles.foodItemsContainer}>
            {meal.foodItems.map((food, foodIndex) => (
              <View key={food.id || foodIndex} style={styles.foodItem}>
                <View style={styles.foodMain}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodQuantity}>{food.quantity}</Text>
                </View>
                <View style={styles.foodMacros}>
                  <View style={styles.macroTag}>
                    <Text style={styles.macroTagText}>P: {Math.round(food.proteinGrams || food.protein || 0)}g</Text>
                  </View>
                  <View style={[styles.macroTag, styles.macroTagCarbs]}>
                    <Text style={styles.macroTagText}>C: {Math.round(food.carbsGrams || food.carbs || 0)}g</Text>
                  </View>
                  <View style={[styles.macroTag, styles.macroTagFat]}>
                    <Text style={styles.macroTagText}>F: {Math.round(food.fatGrams || food.fat || 0)}g</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Meal Total Macros */}
        <View style={styles.mealTotalsContainer}>
          <Text style={styles.mealTotalsTitle}>Meal Total</Text>
          <View style={styles.mealTotalsRow}>
            <View style={styles.mealTotalItem}>
              <Text style={[styles.mealTotalValue, { color: '#374151' }]}>
                {Math.round(mealTotals.protein)}g
              </Text>
              <Text style={styles.mealTotalLabel}>Protein</Text>
            </View>
            <View style={styles.mealTotalItem}>
              <Text style={[styles.mealTotalValue, { color: '#6B7280' }]}>
                {Math.round(mealTotals.carbs)}g
              </Text>
              <Text style={styles.mealTotalLabel}>Carbs</Text>
            </View>
            <View style={styles.mealTotalItem}>
              <Text style={[styles.mealTotalValue, { color: '#9CA3AF' }]}>
                {Math.round(mealTotals.fat)}g
              </Text>
              <Text style={styles.mealTotalLabel}>Fat</Text>
            </View>
            <View style={styles.mealTotalItem}>
              <Text style={[styles.mealTotalValue, { color: colors.primary }]}>
                {Math.round(mealTotals.calories)}
              </Text>
              <Text style={styles.mealTotalLabel}>Cal</Text>
            </View>
          </View>
        </View>

        {meal.preparationTips && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsIcon}>💡</Text>
            <Text style={styles.tipsText}>{meal.preparationTips}</Text>
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generating Plan</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>🪄 Crafting your personalized plan...</Text>
          <Text style={styles.loadingSubtext}>Analyzing your profile, preferences & goals</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Oops!</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>Couldn't generate your plan</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={generatePlan}>
            <Text style={styles.retryButtonText}>🔄 Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.border, marginTop: 12 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.retryButtonText, { color: colors.text.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // No plan
  if (!plan) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>No Plan</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No plan data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Plan</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plan Overview */}
        <View style={styles.planOverview}>
          <View style={styles.planBadges}>
            <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
              <Text style={styles.badgeText}>🥬 {plan.dietType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.badgeText}>📍 {plan.region?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.info + '20' }]}>
              <Text style={styles.badgeText}>🍽️ {plan.meals?.length || 0} Meals</Text>
            </View>
          </View>

          <Text style={styles.planName}>{plan.name?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\(([^)]+)\)/g, (_, g) => `(${g.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())})`)}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>

          {/* Calories and Duration */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{plan.totalCalories}</Text>
              <Text style={styles.statLabel}>Calories/Day</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{plan.durationDays}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{plan.meals?.length || 0}</Text>
              <Text style={styles.statLabel}>Meals/Day</Text>
            </View>
          </View>

          {/* Daily Macros */}
          <View style={styles.macrosContainer}>
            <Text style={styles.macrosTitle}>Daily Macros Target</Text>
            <View style={styles.macrosRow}>
              {renderMacroCircle(plan.proteinGrams, 'Protein', '#374151')}
              {renderMacroCircle(plan.carbsGrams, 'Carbs', '#6B7280')}
              {renderMacroCircle(plan.fatGrams, 'Fat', '#9CA3AF')}
            </View>
          </View>
        </View>

        {/* Meals */}
        <Text style={styles.sectionTitle}>Today's Meals</Text>

        {plan.meals && plan.meals.length > 0 ? (
          [...plan.meals]
            .sort((a, b) => {
              // Sort by time
              const getTimeValue = (timeStr) => {
                if (!timeStr) return 0;
                const [time, period] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
                return hours * 60 + (minutes || 0);
              };
              return getTimeValue(a.timeOfDay) - getTimeValue(b.timeOfDay);
            })
            .map((meal, index) => renderMeal(meal, index))
        ) : (
          <Text style={styles.noMeals}>No meals available</Text>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartPlan}>
          <Text style={styles.startButtonText}>🚀 Start This Plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    paddingTop: spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  planOverview: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  planBadges: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  planName: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  planDescription: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  macrosContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  macrosTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  macroValue: {
    ...typography.body,
    fontWeight: 'bold',
  },
  macroLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  mealCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mealIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  mealTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  mealCalories: {
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  calorieValue: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
  },
  calorieLabel: {
    ...typography.caption,
    color: colors.primary,
  },
  mealName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  foodItemsContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  foodMain: {
    flex: 1,
  },
  foodName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  foodQuantity: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  foodMacros: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroTag: {
    backgroundColor: '#FEF2F220',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginLeft: spacing.xs,
  },
  macroTagCarbs: {
    backgroundColor: '#6B728020',
  },
  macroTagFat: {
    backgroundColor: '#F3F4F640',
  },
  macroTagText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.primary,
  },
  mealTotalsContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  mealTotalsTitle: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  mealTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mealTotalItem: {
    alignItems: 'center',
  },
  mealTotalValue: {
    ...typography.body,
    fontWeight: 'bold',
  },
  mealTotalLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
  },
  tipsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  tipsIcon: {
    marginRight: spacing.xs,
  },
  tipsText: {
    flex: 1,
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  noMeals: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  loadingSubtext: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  startButton: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  startButtonText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GeneratedPlanViewScreen;

