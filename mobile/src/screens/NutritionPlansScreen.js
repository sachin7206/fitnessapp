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
} from 'react-native';
import { useSelector } from 'react-redux';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import nutritionService from '../services/nutritionService';

const NutritionPlansScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [filters, setFilters] = useState({
    region: null,
    dietType: null,
    goal: null,
  });

  const regions = [
    { label: 'All Regions', value: null },
    { label: 'North India', value: 'NORTH' },
    { label: 'South India', value: 'SOUTH' },
    { label: 'East India', value: 'EAST' },
    { label: 'West India', value: 'WEST' },
    { label: 'Pan India', value: 'PAN_INDIA' },
  ];

  const dietTypes = [
    { label: 'All Diets', value: null },
    { label: 'Vegetarian', value: 'VEGETARIAN' },
    { label: 'Vegan', value: 'VEGAN' },
    { label: 'Eggetarian', value: 'EGGETARIAN' },
    { label: 'Non-Vegetarian', value: 'NON_VEGETARIAN' },
    { label: 'Jain', value: 'JAIN' },
  ];

  const goals = [
    { label: 'All Goals', value: null },
    { label: 'Weight Loss', value: 'WEIGHT_LOSS' },
    { label: 'Weight Gain', value: 'WEIGHT_GAIN' },
    { label: 'Muscle Building', value: 'MUSCLE_BUILDING' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
    { label: 'Diabetes Friendly', value: 'DIABETES_FRIENDLY' },
    { label: 'Heart Healthy', value: 'HEART_HEALTHY' },
  ];

  // Check profile completion on mount
  useEffect(() => {
    checkForActivePlanFirst();
  }, []);

  const checkForActivePlanFirst = async () => {
    try {
      setCheckingProfile(true);

      // First check if user already has an active plan
      const active = await nutritionService.getActivePlan();
      if (active && active.nutritionPlan) {
        // User has active plan, go directly to meal plan view
        navigation.replace('MyNutritionPlan', { userPlan: active });
        return;
      }

      // No active plan, check profile completion
      checkProfileCompletion();
    } catch (error) {
      console.log('No active plan, checking profile...');
      checkProfileCompletion();
    }
  };

  const checkProfileCompletion = async () => {
    try {
      const status = await nutritionService.checkProfileStatus();

      if (!status.isComplete) {
        // Profile is incomplete, navigate to setup
        navigation.replace('NutritionProfileSetup', { missingFields: status.missingFields });
        return;
      }

      // Profile is complete, load plans
      setCheckingProfile(false);
      loadData();
    } catch (error) {
      console.error('Error checking profile:', error);
      setCheckingProfile(false);
      loadData(); // Still try to load plans
    }
  };

  const fetchPlans = useCallback(async () => {
    try {
      const plansData = await nutritionService.getPlans(filters);
      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching plans:', error);
      showAlert('Error', 'Failed to load nutrition plans');
    }
  }, [filters]);

  const fetchActivePlan = useCallback(async () => {
    try {
      const active = await nutritionService.getActivePlan();
      setActivePlan(active);
    } catch (error) {
      // No active plan or error
      setActivePlan(null);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPlans(), fetchActivePlan()]);
    setLoading(false);
  }, [fetchPlans, fetchActivePlan]);

  useEffect(() => {
    if (!checkingProfile) {
      loadData();
    }
  }, [filters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        if (window.confirm(`${title}\n${message}`)) {
          buttons[1]?.onPress?.();
        }
      } else {
        window.alert(`${title}\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handlePlanPress = async (plan) => {
    try {
      const fullPlan = await nutritionService.getPlanById(plan.id);
      setSelectedPlan(fullPlan);
      setModalVisible(true);
    } catch (error) {
      showAlert('Error', 'Failed to load plan details');
    }
  };

  const handleEnroll = async () => {
    if (!selectedPlan) return;

    if (activePlan) {
      showAlert(
        'Active Plan Exists',
        'You already have an active plan. The new plan will start from tomorrow, and your current plan will remain active until midnight tonight. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => enrollInPlan() },
        ]
      );
    } else {
      enrollInPlan();
    }
  };

  const enrollInPlan = async () => {
    setEnrolling(true);
    try {
      const userPlan = await nutritionService.enrollInPlan(selectedPlan.id);
      setActivePlan(userPlan);
      setModalVisible(false);

      if (userPlan?.scheduledForTomorrow) {
        showAlert(
          'Plan Scheduled! 📅',
          `Your new plan "${selectedPlan.name}" will start from tomorrow! 🌅\n\nYour current plan remains active until midnight tonight.`
        );
      } else {
        showAlert('Success! 🎉', `You are now enrolled in "${selectedPlan.name}"`);
      }
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to enroll in plan');
    } finally {
      setEnrolling(false);
    }
  };

  const getGoalIcon = (goal) => {
    const icons = {
      WEIGHT_LOSS: '⚖️',
      WEIGHT_GAIN: '💪',
      MUSCLE_BUILDING: '🏋️',
      MAINTENANCE: '✨',
      DIABETES_FRIENDLY: '🩺',
      HEART_HEALTHY: '❤️',
    };
    return icons[goal] || '🥗';
  };

  const getDietIcon = (dietType) => {
    const icons = {
      VEGETARIAN: '🥬',
      VEGAN: '🌱',
      EGGETARIAN: '🥚',
      NON_VEGETARIAN: '🍗',
      JAIN: '🙏',
    };
    return icons[dietType] || '🍽️';
  };

  const renderFilterChips = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
      {/* Region Filter */}
      {regions.map((region) => (
        <TouchableOpacity
          key={region.value || 'all-region'}
          style={[
            styles.filterChip,
            filters.region === region.value && styles.filterChipActive,
          ]}
          onPress={() => setFilters({ ...filters, region: region.value })}
        >
          <Text
            style={[
              styles.filterChipText,
              filters.region === region.value && styles.filterChipTextActive,
            ]}
          >
            {region.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderActivePlanBanner = () => {
    if (!activePlan) return null;

    return (
      <View style={styles.activePlanBanner}>
        <View style={styles.activePlanHeader}>
          <Text style={styles.activePlanLabel}>📋 Your Active Plan</Text>
          <Text style={styles.activePlanDay}>Day {activePlan.currentDay}</Text>
        </View>
        <Text style={styles.activePlanName}>{activePlan.nutritionPlan?.name}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${activePlan.adherencePercentage || 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(activePlan.adherencePercentage || 0)}% Complete
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewPlanButton}
          onPress={() => navigation.navigate('MyNutritionPlan', { userPlan: activePlan })}
        >
          <Text style={styles.viewPlanButtonText}>View Today's Meals →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPlanCard = (plan) => (
    <TouchableOpacity
      key={plan.id}
      style={styles.planCard}
      onPress={() => handlePlanPress(plan)}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planIcon}>{getGoalIcon(plan.goal)}</Text>
        <View style={styles.planBadges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{getDietIcon(plan.dietType)} {plan.dietType?.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.badge, styles.regionBadge]}>
            <Text style={styles.badgeText}>📍 {plan.region}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.planDescription} numberOfLines={2}>
        {plan.description}
      </Text>
      <View style={styles.planStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{plan.totalCalories}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{plan.proteinGrams}g</Text>
          <Text style={styles.statLabel}>Protein</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{plan.durationDays}</Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{plan.difficulty}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPlanModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedPlan && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalIcon}>{getGoalIcon(selectedPlan.goal)}</Text>
                  <Text style={styles.modalTitle}>{selectedPlan.name}</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDescription}>{selectedPlan.description}</Text>

                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedPlan.totalCalories}</Text>
                    <Text style={styles.nutritionLabel}>Calories/Day</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedPlan.proteinGrams}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedPlan.carbsGrams}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{selectedPlan.fatGrams}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>

                {selectedPlan.meals && selectedPlan.meals.length > 0 && (
                  <View style={styles.mealsSection}>
                    <Text style={styles.sectionTitle}>Sample Meals</Text>
                    {selectedPlan.meals.slice(0, 4).map((meal, index) => (
                      <View key={index} style={styles.mealCard}>
                        <View style={styles.mealHeader}>
                          <Text style={styles.mealType}>{meal.mealType}</Text>
                          <Text style={styles.mealTime}>{meal.timeOfDay}</Text>
                        </View>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        {meal.foodItems && meal.foodItems.length > 0 && (
                          <View style={styles.foodItems}>
                            {meal.foodItems.map((food, foodIndex) => (
                              <View key={foodIndex} style={styles.foodItem}>
                                <Text style={styles.foodName}>
                                  {food.name} {food.hindiName ? `(${food.hindiName})` : ''}
                                </Text>
                                <Text style={styles.foodQuantity}>{food.quantity}</Text>
                                <Text style={styles.foodCalories}>{food.calories} cal</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {meal.preparationTips && (
                          <Text style={styles.tips}>💡 {meal.preparationTips}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.enrollButton, enrolling && styles.enrollButtonDisabled]}
                  onPress={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <ActivityIndicator color={colors.text.inverse} />
                  ) : (
                    <Text style={styles.enrollButtonText}>
                      {activePlan?.nutritionPlan?.id === selectedPlan.id
                        ? '✓ Currently Active'
                        : 'Start This Plan'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (checkingProfile || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {checkingProfile ? 'Checking your profile...' : 'Loading nutrition plans...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🥗 Nutrition Plans</Text>
        <View style={{ width: 60 }} />
      </View>

      {renderFilterChips()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Generate Custom Plan Card */}
        <TouchableOpacity
          style={styles.generateCard}
          onPress={() => navigation.navigate('NutritionRegionSelect')}
        >
          <View style={styles.generateCardContent}>
            <Text style={styles.generateIcon}>🪄</Text>
            <View style={styles.generateInfo}>
              <Text style={styles.generateTitle}>Generate Custom Plan</Text>
              <Text style={styles.generateDesc}>
                Get a personalized plan based on your profile, goals, and regional preferences
              </Text>
            </View>
            <Text style={styles.generateArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {renderActivePlanBanner()}

        <Text style={styles.sectionHeader}>
          {filters.region || filters.dietType || filters.goal
            ? 'Filtered Plans'
            : 'Pre-made Plans'}
          {' '}({plans.length})
        </Text>

        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No plans match your filters</Text>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => setFilters({ region: null, dietType: null, goal: null })}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map(renderPlanCard)
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {renderPlanModal()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  filterContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  activePlanBanner: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  activePlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activePlanLabel: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  activePlanDay: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  activePlanName: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  viewPlanButton: {
    marginTop: spacing.sm,
  },
  viewPlanButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  sectionHeader: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  planIcon: {
    fontSize: 32,
  },
  planBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  badge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
  },
  regionBadge: {
    backgroundColor: colors.primary + '20',
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  planName: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  planDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  clearFiltersButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  clearFiltersText: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.text.secondary,
  },
  modalDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  nutritionItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  nutritionValue: {
    ...typography.h4,
    color: colors.primary,
  },
  nutritionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  mealsSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  mealCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  mealType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
  mealTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  mealName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  foodItems: {
    marginTop: spacing.xs,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  foodName: {
    ...typography.bodySmall,
    color: colors.text.primary,
    flex: 1,
  },
  foodQuantity: {
    ...typography.caption,
    color: colors.text.secondary,
    marginHorizontal: spacing.sm,
  },
  foodCalories: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  tips: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  enrollButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  enrollButtonDisabled: {
    backgroundColor: colors.primary + '80',
  },
  enrollButtonText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  generateCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  generateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  generateIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  generateInfo: {
    flex: 1,
  },
  generateTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginBottom: 2,
  },
  generateDesc: {
    ...typography.caption,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  generateArrow: {
    fontSize: 24,
    color: colors.text.inverse,
    marginLeft: spacing.sm,
  },
});

export default NutritionPlansScreen;

