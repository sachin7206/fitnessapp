
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  completeMeal,
  uncompleteMeal,
  persistTracking,
  loadTrackingFromStorage,
  getLocalDateString,
} from '../store/slices/mealTrackingSlice';
import {
  completeWorkout,
  uncompleteWorkout,
  setActivePlan as setWorkoutPlan,
  setMotivationalQuote,
  persistWorkoutTracking,
  loadWorkoutTrackingFromStorage,
} from '../store/slices/workoutTrackingSlice';
import workoutService from '../services/workoutService';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const tracking = useSelector((state) => state.mealTracking);
  const workoutTracking = useSelector((state) => state.workoutTracking);
  const [now, setNow] = useState(new Date());

  // Load persisted tracking on mount
  useEffect(() => {
    dispatch(loadTrackingFromStorage());
    dispatch(loadWorkoutTrackingFromStorage());
    fetchWorkoutData();
  }, []);

  // Refresh clock every 30 seconds; detect day change to auto-reset
  useEffect(() => {
    let lastDate = getLocalDateString();
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      const currentDate = getLocalDateString();
      if (currentDate !== lastDate) {
        // Midnight crossed — reload tracking (will auto-reset)
        lastDate = currentDate;
        dispatch(loadTrackingFromStorage());
        dispatch(loadWorkoutTrackingFromStorage());
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Also refresh on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      dispatch(loadTrackingFromStorage());
      dispatch(loadWorkoutTrackingFromStorage());
      setNow(new Date());
      fetchWorkoutData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchWorkoutData = async () => {
    try {
      const plan = await workoutService.getActiveWorkoutPlan();
      if (plan) {
        dispatch(setWorkoutPlan(plan));
        dispatch(persistWorkoutTracking());
        // Fetch motivational quote
        const quoteData = await workoutService.getMotivationalQuote();
        dispatch(setMotivationalQuote(quoteData.quote));
        dispatch(persistWorkoutTracking());
      }
    } catch (e) { /* no active plan is fine */ }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        dispatch(logout());
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: () => dispatch(logout()),
          },
        ]
      );
    }
  };

  const showComingSoon = (feature) => {
    if (Platform.OS === 'web') {
      window.alert(`Coming Soon: ${feature} will be available in Phase 2`);
    } else {
      Alert.alert('Coming Soon', `${feature} will be available in Phase 2`);
    }
  };

  // ---------- Meal tracking helpers ----------
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

  const getMealStatus = (meal) => {
    if (meal.completed) return 'completed';
    const mealMin = getTimeInMinutes(meal.timeOfDay);
    const nowMin = getNowMinutes();
    if (nowMin >= mealMin - 30 && nowMin <= mealMin) return 'active';
    if (nowMin > mealMin) return 'missed';
    return 'upcoming';
  };

  const getOrdinal = (idx) => {
    const n = idx + 1;
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  };

  const handleCheckMeal = (mealId) => {
    dispatch(completeMeal({ mealId }));
    dispatch(persistTracking());
  };

  const handleUncheckMeal = (mealId) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Undo this meal? Calories will be subtracted.')) {
        dispatch(uncompleteMeal({ mealId }));
        dispatch(persistTracking());
      }
    } else {
      Alert.alert('Undo Meal', 'Undo this meal? Calories will be subtracted.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Undo', style: 'destructive', onPress: () => { dispatch(uncompleteMeal({ mealId })); dispatch(persistTracking()); } },
      ]);
    }
  };

  // Find the current / next actionable meal (first non-completed that is active or missed)
  const getActiveMealInfo = () => {
    const meals = tracking.meals || [];
    for (let i = 0; i < meals.length; i++) {
      const status = getMealStatus(meals[i]);
      if (status === 'active' || status === 'missed') {
        return { meal: meals[i], index: i, status };
      }
    }
    // All done or all upcoming – find first upcoming
    for (let i = 0; i < meals.length; i++) {
      if (!meals[i].completed) {
        return { meal: meals[i], index: i, status: 'upcoming' };
      }
    }
    return null; // all completed
  };

  const activeMealInfo = tracking.meals.length > 0 ? getActiveMealInfo() : null;
  const completedCount = tracking.meals.filter(m => m.completed).length;
  const totalMealCalories = tracking.meals.reduce((s, m) => s + (m.calories || 0), 0);

  // ---------- Workout tracking helpers ----------
  const exerciseTime = workoutTracking.activePlan?.workoutPlan?.exerciseTime || '6:00 AM';
  const exerciseMin = getTimeInMinutes(exerciseTime);
  const exerciseDuration = workoutTracking.activePlan?.workoutPlan?.exerciseDurationMinutes || 60;
  const nowMin = getNowMinutes();
  const isPreWorkout = nowMin >= exerciseMin - 30 && nowMin < exerciseMin;
  const isPostWorkoutTime = nowMin >= exerciseMin + 90;
  const showWorkoutPrompt = workoutTracking.activePlan && isPostWorkoutTime && !workoutTracking.todayCompleted;

  const handleCompleteWorkout = async () => {
    try {
      await workoutService.markWorkoutComplete();
      dispatch(completeWorkout());
      dispatch(persistWorkoutTracking());
      const msg = 'Great job completing your workout today! 🎉';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Awesome! 💪', msg);
    } catch (e) { console.log('Error:', e); }
  };

  const handleUncompleteWorkout = () => {
    const doUndo = () => { dispatch(uncompleteWorkout()); dispatch(persistWorkoutTracking()); };
    if (Platform.OS === 'web') {
      if (window.confirm('Undo workout completion?')) doUndo();
    } else {
      Alert.alert('Undo Workout', 'Undo workout completion?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Undo', style: 'destructive', onPress: doUndo },
      ]);
    }
  };

  const cards = [
    {
      title: 'My Workouts',
      description: 'View your personalized workout plans',
      icon: '💪',
      onPress: () => navigation.navigate('MyWorkout'),
    },
    {
      title: 'Nutrition Plans',
      description: 'Regional diet plans tailored for you',
      icon: '🥗',
      onPress: () => navigation.navigate('NutritionPlans'),
    },
    {
      title: 'Progress Tracking',
      description: 'Track your fitness journey',
      icon: '📊',
      onPress: () => showComingSoon('Progress tracking'),
    },
    {
      title: 'Yoga & Wellness',
      description: 'Traditional Indian fitness practices',
      icon: '🧘',
      onPress: () => showComingSoon('Wellness modules'),
    },
  ];

  // ---------- Render ----------
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Namaste, {user?.profile?.firstName || 'User'}! 🙏</Text>
          <Text style={styles.subtitle}>Ready to achieve your fitness goals?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats row – with live consumed calories */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, workoutTracking.workoutCount > 0 && styles.statCardHighlight]}>
            <Text style={[styles.statValue, workoutTracking.workoutCount > 0 && styles.statValueHighlight]}>
              {workoutTracking.workoutCount || 0}
            </Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {workoutTracking.activePlan?.currentWeek
                ? `W${workoutTracking.activePlan.currentWeek}`
                : '0'}
            </Text>
            <Text style={styles.statLabel}>
              {workoutTracking.activePlan ? 'Week' : 'Days Active'}
            </Text>
          </View>
          <View style={[styles.statCard, tracking.consumedCalories > 0 && styles.statCardHighlight]}>
            <Text style={[styles.statValue, tracking.consumedCalories > 0 && styles.statValueHighlight]}>
              {tracking.consumedCalories || 0}
            </Text>
            <Text style={styles.statLabel}>Calories</Text>
            {totalMealCalories > 0 && (
              <Text style={styles.statSub}>of {totalMealCalories}</Text>
            )}
          </View>
        </View>

        {/* -------- Meal Tracking Widget -------- */}
        {tracking.meals.length > 0 && (
          <View style={styles.trackingWidget}>
            <View style={styles.trackingHeader}>
              <Text style={styles.trackingTitle}>🍽️ Today's Meals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyNutritionPlan')}>
                <Text style={styles.trackingLink}>View Plan →</Text>
              </TouchableOpacity>
            </View>

            {/* Mini progress */}
            <View style={styles.miniProgress}>
              <View style={styles.miniProgressBarBg}>
                <View
                  style={[
                    styles.miniProgressBarFill,
                    {
                      width: `${tracking.meals.length > 0
                        ? Math.min(100, (completedCount / tracking.meals.length) * 100)
                        : 0}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.miniProgressText}>
                {completedCount}/{tracking.meals.length} meals
              </Text>
            </View>

            {/* Current meal prompt */}
            {activeMealInfo && (
              <View
                style={[
                  styles.currentMealCard,
                  activeMealInfo.status === 'active' && styles.currentMealActive,
                  activeMealInfo.status === 'missed' && styles.currentMealMissed,
                ]}
              >
                {activeMealInfo.status === 'active' && (
                  <View style={styles.currentMealBanner}>
                    <Text style={styles.bannerEmoji}>🍽️</Text>
                    <Text style={styles.bannerText}>
                      Time for your {getOrdinal(activeMealInfo.index)} meal!
                    </Text>
                  </View>
                )}
                {activeMealInfo.status === 'missed' && (
                  <View style={styles.currentMealBannerMissed}>
                    <Text style={styles.bannerEmoji}>😔</Text>
                    <Text style={styles.bannerTextMissed}>You are not on track</Text>
                  </View>
                )}
                {activeMealInfo.status === 'upcoming' && (
                  <View style={styles.currentMealBannerUpcoming}>
                    <Text style={styles.bannerEmoji}>⏰</Text>
                    <Text style={styles.bannerTextUpcoming}>
                      Next: {activeMealInfo.meal.name} at {activeMealInfo.meal.timeOfDay}
                    </Text>
                  </View>
                )}

                <View style={styles.currentMealRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.currentMealName}>
                      {activeMealInfo.meal.replacedWith || activeMealInfo.meal.name}
                    </Text>
                    {activeMealInfo.meal.replaced && (
                      <Text style={styles.currentMealReplaced}>
                        ✕ {activeMealInfo.meal.originalName}
                      </Text>
                    )}
                    <Text style={styles.currentMealTime}>
                      🕐 {activeMealInfo.meal.timeOfDay}  •  {activeMealInfo.meal.calories} kcal
                    </Text>
                  </View>
                </View>

                {(activeMealInfo.status === 'active' || activeMealInfo.status === 'missed') && (
                  <TouchableOpacity
                    style={[
                      styles.mealCheckBtn,
                      activeMealInfo.status === 'missed' && styles.mealCheckBtnMissed,
                    ]}
                    onPress={() => handleCheckMeal(activeMealInfo.meal.mealId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.mealCheckbox}>
                      <Text> </Text>
                    </View>
                    <Text style={styles.mealCheckLabel}>
                      {activeMealInfo.status === 'missed'
                        ? `Mark ${getOrdinal(activeMealInfo.index)} meal as taken`
                        : `Have you taken your ${getOrdinal(activeMealInfo.index)} meal?`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* All meals completed */}
            {!activeMealInfo && completedCount > 0 && (
              <View style={styles.allDoneCard}>
                <Text style={styles.allDoneEmoji}>🎉</Text>
                <Text style={styles.allDoneText}>All meals completed! Great job!</Text>
                <Text style={styles.allDoneSub}>
                  Total consumed: {tracking.consumedCalories} kcal
                </Text>
              </View>
            )}
          </View>
        )}

        {/* -------- Workout Tracking Widget -------- */}
        {workoutTracking.activePlan && (
          <View style={styles.trackingWidget}>
            <View style={styles.trackingHeader}>
              <Text style={styles.trackingTitle}>💪 Today's Workout</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyWorkout')}>
                <Text style={styles.trackingLink}>View Plan →</Text>
              </TouchableOpacity>
            </View>

            {/* Pre-workout motivational quote */}
            {isPreWorkout && workoutTracking.motivationalQuote && (
              <View style={[styles.currentMealCard, styles.currentMealActive]}>
                <View style={styles.currentMealBanner}>
                  <Text style={styles.bannerEmoji}>🔥</Text>
                  <Text style={styles.bannerText}>{workoutTracking.motivationalQuote}</Text>
                </View>
                <Text style={{ ...typography.caption, color: colors.primary, textAlign: 'center', marginTop: spacing.xs }}>
                  Workout at {exerciseTime} — Let's go!
                </Text>
              </View>
            )}

            {/* Workout completion prompt — 1.5 hours after */}
            {showWorkoutPrompt && (
              <TouchableOpacity
                style={[styles.mealCheckBtn]}
                onPress={handleCompleteWorkout}
              >
                <View style={styles.mealCheckbox}><Text> </Text></View>
                <Text style={styles.mealCheckLabel}>Have you completed your workout? 💪</Text>
              </TouchableOpacity>
            )}

            {/* Already completed */}
            {workoutTracking.todayCompleted && (
              <TouchableOpacity
                style={[styles.mealCheckBtn, { backgroundColor: colors.success + '12' }]}
                onPress={handleUncompleteWorkout}
              >
                <View style={[styles.mealCheckbox, { backgroundColor: colors.success, borderColor: colors.success }]}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✓</Text>
                </View>
                <Text style={[styles.mealCheckLabel, { color: colors.success }]}>
                  Workout completed! Great job! 🎉
                </Text>
                <Text style={{ ...typography.caption, color: colors.text.light, fontStyle: 'italic' }}>
                  Tap to undo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.cardsContainer}>
          {cards.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={card.onPress}
            >
              <Text style={styles.cardIcon}>{card.icon}</Text>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    ...typography.h2,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  logoutText: {
    ...typography.bodySmall,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    ...shadows.md,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statCardHighlight: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  statValueHighlight: {
    color: colors.success,
  },
  statSub: {
    ...typography.caption,
    color: colors.text.light,
    fontSize: 10,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  // ----- Tracking widget -----
  trackingWidget: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trackingTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text.primary,
  },
  trackingLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  miniProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  miniProgressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.primary + '20',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  miniProgressText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  // Current meal card
  currentMealCard: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  currentMealActive: {
    backgroundColor: colors.primary + '08',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  currentMealMissed: {
    backgroundColor: colors.error + '08',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  currentMealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  currentMealBannerMissed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  currentMealBannerUpcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bannerEmoji: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  bannerText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  bannerTextMissed: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
  },
  bannerTextUpcoming: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  currentMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  currentMealName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  currentMealTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  currentMealReplaced: {
    ...typography.caption,
    color: colors.error,
    textDecorationLine: 'line-through',
  },
  mealCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '12',
    marginTop: spacing.xs,
  },
  mealCheckBtnMissed: {
    backgroundColor: colors.error + '12',
  },
  mealCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  mealCheckLabel: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  // All done
  allDoneCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  allDoneEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  allDoneText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '700',
  },
  allDoneSub: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});

export default HomeScreen;

