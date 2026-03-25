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
  persistTrackingNow,
  loadTrackingFromStorage,
  loadTrackingLocal,
  getLocalDateString,
  clearTracking,
} from '../store/slices/mealTrackingSlice';
import {
  completeWorkout,
  uncompleteWorkout,
  setActivePlan as setWorkoutPlan,
  setMotivationalQuote,
  persistWorkoutTracking,
  loadWorkoutTrackingFromStorage,
  loadWorkoutTrackingLocal,
  updateSteps,
  setStepGoal,
  clearWorkoutTracking,
} from '../store/slices/workoutTrackingSlice';
import workoutService from '../services/workoutService';
import { Pedometer } from 'expo-sensors';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import { useTranslation } from '../i18n';
import Svg, { Circle } from 'react-native-svg';

// ---------- Progress Ring Component ----------
const ProgressRing = ({ progress, size = 64, strokeWidth = 5, color = colors.success, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
};

// ---------- Constants ----------
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_UPPER = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const tracking = useSelector((state) => state.mealTracking);
  const { t } = useTranslation();
  const workoutTracking = useSelector((state) => state.workoutTracking);
  const [now, setNow] = useState(new Date());

  // Load persisted tracking on mount (with backend sync — one time only)
  useEffect(() => {
    dispatch(loadTrackingFromStorage());
    dispatch(loadWorkoutTrackingFromStorage()).then(() => {
      // Fetch workout plan data only after tracking is loaded (avoids double step calls)
      fetchWorkoutData();
    });
  }, []);

  // Refresh clock every 30 seconds; detect day change to auto-reset
  useEffect(() => {
    let lastDate = getLocalDateString();
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      const currentDate = getLocalDateString();
      if (currentDate !== lastDate) {
        // Midnight crossed — reload tracking (local only, fast)
        lastDate = currentDate;
        dispatch(loadTrackingLocal());
        dispatch(loadWorkoutTrackingLocal());
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Also refresh on focus (local only — no API calls)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      dispatch(loadTrackingLocal());
      dispatch(loadWorkoutTrackingLocal());
      setNow(new Date());
    });
    return unsubscribe;
  }, [navigation]);

  const fetchWorkoutData = async () => {
    try {
      const plan = await workoutService.getActiveWorkoutPlan();
      if (plan) {
        dispatch(setWorkoutPlan(plan));
        // Set step goal from cardio steps if configured
        const cardioSteps = plan?.workoutPlan?.cardioSteps;
        if (cardioSteps && cardioSteps > 0) {
          dispatch(setStepGoal(cardioSteps));
        }
        // Fetch motivational quote
        try {
          const quoteData = await workoutService.getMotivationalQuote();
          dispatch(setMotivationalQuote(quoteData.quote));
        } catch (e) { /* quote fetch failure is non-critical */ }
      }
    } catch (e) { /* no active plan is fine */ }
  };

  // ---------- Pedometer / Step tracking ----------
  const [pedometerAvailable, setPedometerAvailable] = useState(false);
  const [stepCounterSub, setStepCounterSub] = useState(null);

  useEffect(() => {
    let sub = null;
    const startPedometer = async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        setPedometerAvailable(available);
        if (available) {
          // Get today's steps from midnight
          const midnight = new Date();
          midnight.setHours(0, 0, 0, 0);
          try {
            const result = await Pedometer.getStepCountAsync(midnight, new Date());
            if (result && result.steps != null) {
              dispatch(updateSteps(result.steps));
            }
          } catch (e) { /* getStepCountAsync may not be supported on all devices */ }

          // Subscribe to live updates
          sub = Pedometer.watchStepCount(result => {
            // result.steps is incremental since subscription start
          });
          setStepCounterSub(sub);

          // Poll full-day count every 10 seconds for accuracy
          const poller = setInterval(async () => {
            try {
              const midnightNow = new Date();
              midnightNow.setHours(0, 0, 0, 0);
              const r = await Pedometer.getStepCountAsync(midnightNow, new Date());
              if (r && r.steps != null) {
                dispatch(updateSteps(r.steps));
              }
            } catch (e) { /* ignore */ }
          }, 10000);

          return () => {
            clearInterval(poller);
            if (sub) sub.remove();
          };
        }
      } catch (e) {
        
      }
    };
    const cleanup = startPedometer();
    return () => {
      if (cleanup && typeof cleanup === 'function') cleanup();
      if (sub) sub.remove();
    };
  }, []);

  // Persist steps every 30 seconds
  useEffect(() => {
    const persistTimer = setInterval(() => {
      dispatch(persistWorkoutTracking());
    }, 30000);
    return () => clearInterval(persistTimer);
  }, []);

  const handleLogout = async () => {
    const doLogout = () => {
      dispatch(clearTracking());
      dispatch(clearWorkoutTracking());
      dispatch(logout());
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        doLogout();
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
            onPress: doLogout,
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
    dispatch(persistTrackingNow());
  };

  const handleUncheckMeal = (mealId) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Undo this meal? Calories will be subtracted.')) {
        dispatch(uncompleteMeal({ mealId }));
        dispatch(persistTrackingNow());
      }
    } else {
      Alert.alert('Undo Meal', 'Undo this meal? Calories will be subtracted.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Undo', style: 'destructive', onPress: () => { dispatch(uncompleteMeal({ mealId })); dispatch(persistTrackingNow()); } },
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
    } catch (e) {  }
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

  // ---------- Derived state for new design ----------
  const firstName = user?.profile?.firstName || 'User';
  const hour = now.getHours();
  const dateStr = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`;

  // Rest day detection
  const todayDayName = DAY_NAMES_UPPER[now.getDay()];
  const planRestDay = workoutTracking.activePlan?.workoutPlan?.restDay;
  const isRestDay = workoutTracking.activePlan && todayDayName === planRestDay;

  // Meal progress
  const mealTotal = tracking.meals.length;
  const mealProgress = mealTotal > 0 ? completedCount / mealTotal : 0;
  const allMealsDone = completedCount > 0 && completedCount === mealTotal;

  // Step progress
  const stepGoal = workoutTracking.stepGoal || 0;
  const todaySteps = workoutTracking.todaySteps || 0;
  const stepProgress = stepGoal > 0 ? Math.min(1, todaySteps / stepGoal) : (todaySteps > 0 ? 0.2 : 0);
  const stepsGoalReached = workoutTracking.stepGoalCompleted;

  // All-complete celebration
  const allComplete = allMealsDone
    && workoutTracking.todayCompleted
    && (stepsGoalReached || stepGoal === 0);

  // Time-based greeting
  const getGreeting = () => {
    if (isRestDay) return { text: 'Rest well', emoji: '🌿' };
    if (allComplete) return { text: 'Perfect day', emoji: '🌟' };
    if (hour < 12) return { text: 'Good morning', emoji: '👋' };
    if (hour < 17) return { text: 'Keep going', emoji: '💪' };
    if (hour < 21) return { text: 'Almost there', emoji: '💪' };
    return { text: 'Great work', emoji: '🌟' };
  };
  const greetingData = getGreeting();

  // Ring color — purple on rest day, green on workout day
  const ringColor = isRestDay ? '#8B5CF6' : colors.success;

  // Workout card info
  const exerciseCount = workoutTracking.activePlan?.workoutPlan?.exercises?.length
    || workoutTracking.activePlan?.exercises?.length || 8;
  const workoutType = workoutTracking.activePlan?.workoutPlan?.focusArea
    || workoutTracking.activePlan?.workoutPlan?.planName || 'Workout';

  const cards = [
    {
      title: t('home.myWorkout'),
      description: t('home.trackWorkout'),
      icon: '💪',
      bg: '#EFF6FF',
      onPress: () => {
        const activePlan = workoutTracking.activePlan;
        if (activePlan) {
          // If custom plan, go to free workout view
          if (activePlan?.workoutPlan?.planType === 'CUSTOM') {
            navigation.navigate('FreeWorkoutView');
          } else {
            navigation.navigate('MyWorkout');
          }
        } else {
          // No plan - show choice screen
          navigation.navigate('WorkoutChoice');
        }
      },
    },
    {
      title: t('home.myNutrition'),
      description: t('home.viewPlan'),
      icon: '🥗',
      bg: '#ECFDF5',
      onPress: () => navigation.navigate('NutritionPlans'),
    },
    {
      title: t('home.progressTracking'),
      description: t('home.trackProgress'),
      icon: '📊',
      bg: '#F5F3FF',
      onPress: () => navigation.navigate('ProgressDashboard'),
    },
    {
      title: t('home.yogaWellness'),
      description: t('home.mindBody'),
      icon: '🧘',
      bg: '#FFFBEB',
      onPress: () => navigation.navigate('WellnessHome'),
    },
    {
      title: 'Food Log',
      description: 'Log meals',
      icon: '📸',
      bg: '#FDF2F8',
      onPress: () => navigation.navigate('FoodPhotoLog'),
    },
    {
      title: 'Grocery List',
      description: 'Shopping list',
      icon: '🛒',
      bg: '#F0FDFA',
      onPress: () => navigation.navigate('GroceryList'),
    },
    {
      title: 'Feedback',
      description: 'Rate workouts',
      icon: '⚡',
      bg: '#FFF7ED',
      onPress: () => navigation.navigate('WorkoutFeedback'),
    },
    {
      title: 'Reports',
      description: 'View reports',
      icon: '📄',
      bg: '#F8FAFC',
      onPress: () => navigation.navigate('ReportGenerator'),
    },
  ];

  // ---------- Render ----------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {greetingData.text}, {firstName} {greetingData.emoji}
          </Text>
          <Text style={styles.subtitle}>{dateStr}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* -------- Overview Section with Ring Progress -------- */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>OVERVIEW</Text>
          <View style={styles.ringsRow}>
            {/* Meals Ring */}
            <TouchableOpacity
              style={styles.ringItem}
              onPress={() => mealTotal > 0 && navigation.navigate('MyNutritionPlan')}
              activeOpacity={0.7}
            >
              <ProgressRing progress={mealProgress} color={ringColor}>
                {allMealsDone ? (
                  <Text style={[styles.ringCheckmark, { color: ringColor }]}>✓</Text>
                ) : (
                  <>
                    <Text style={styles.ringPercent}>{Math.round(mealProgress * 100)}%</Text>
                    <Text style={styles.ringSub}>{completedCount} of {mealTotal}</Text>
                  </>
                )}
              </ProgressRing>
              <Text style={styles.ringLabel}>Today Meals</Text>
            </TouchableOpacity>

            {/* Workout Ring */}
            <TouchableOpacity
              style={styles.ringItem}
              onPress={() => {
                if (workoutTracking.activePlan) {
                  navigation.navigate('MyWorkout');
                } else {
                  navigation.navigate('WorkoutChoice');
                }
              }}
              activeOpacity={0.7}
            >
              <ProgressRing
                progress={workoutTracking.todayCompleted || workoutTracking.workoutCount > 0 ? 1 : 0}
                color={workoutTracking.todayCompleted ? ringColor : (workoutTracking.workoutCount > 0 ? colors.primary : '#F3F4F6')}
              >
                <Text style={[
                  styles.ringCount,
                  workoutTracking.todayCompleted && { color: ringColor },
                ]}>
                  {workoutTracking.workoutCount || 0}
                </Text>
                <Text style={[
                  styles.ringSub,
                  workoutTracking.todayCompleted && { color: ringColor },
                ]}>total</Text>
              </ProgressRing>
              <Text style={styles.ringLabel}>Workout Done</Text>
            </TouchableOpacity>

            {/* Steps Ring */}
            <TouchableOpacity
              style={styles.ringItem}
              onPress={() => navigation.navigate('StepHistory')}
              activeOpacity={0.7}
            >
              <ProgressRing progress={stepProgress} color={ringColor}>
                {stepsGoalReached ? (
                  <Text style={[styles.ringCheckmark, { color: ringColor }]}>✓</Text>
                ) : (
                  <>
                    <Text style={styles.ringPercent}>
                      {stepGoal > 0 ? `${Math.round(stepProgress * 100)}%` : todaySteps > 0 ? '—' : '0%'}
                    </Text>
                    <Text style={styles.ringSub}>{todaySteps.toLocaleString()}</Text>
                  </>
                )}
              </ProgressRing>
              <Text style={styles.ringLabel}>Today Steps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* -------- All-Complete Celebration -------- */}
        {allComplete && (
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationIcon}>🎉</Text>
            <Text style={styles.celebrationTitle}>You crushed it today!</Text>
            <Text style={styles.celebrationSub}>All meals, workout & step goal completed</Text>
            <Text style={styles.celebrationDetail}>
              {tracking.consumedCalories} kcal • {exerciseDuration} min workout • {todaySteps.toLocaleString()} steps
            </Text>
          </View>
        )}

        {/* -------- Rest Day Card -------- */}
        {isRestDay && !allComplete && (
          <View style={styles.restDayCard}>
            <Text style={styles.restDayIcon}>🧘</Text>
            <Text style={styles.restDayTitle}>Today is Rest Day</Text>
            <Text style={styles.restDayText}>
              Your muscles grow when you rest.{'\n'}Stay hydrated and stretch! 💧
            </Text>
          </View>
        )}

        {/* -------- View Your Meals Row -------- */}
        {mealTotal > 0 && (
          <TouchableOpacity
            style={styles.viewMealsRow}
            onPress={() => navigation.navigate('MyNutritionPlan')}
            activeOpacity={0.7}
          >
            <View style={styles.vmLeft}>
              <View style={[styles.vmIcon, isRestDay && { backgroundColor: '#F5F3FF' }]}>
                <Text style={{ fontSize: 18 }}>🍽️</Text>
              </View>
              <View>
                <Text style={styles.vmText}>View your meals</Text>
                <Text style={styles.vmSub}>
                  {tracking.consumedCalories || 0} / {totalMealCalories} kcal • {completedCount} of {mealTotal} done
                </Text>
              </View>
            </View>
            <Text style={styles.vmArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* -------- Meal Tracking Widget (inline action for current meal) -------- */}
        {tracking.meals.length > 0 && activeMealInfo && (
          <View style={styles.mealActionCard}>
            {activeMealInfo.status === 'active' && (
              <View style={styles.mealBanner}>
                <Text style={styles.bannerEmoji}>🍽️</Text>
                <Text style={styles.bannerText}>
                  Time for your {getOrdinal(activeMealInfo.index)} meal!
                </Text>
              </View>
            )}
            {activeMealInfo.status === 'missed' && (
              <View style={styles.mealBannerMissed}>
                <Text style={styles.bannerEmoji}>😔</Text>
                <Text style={styles.bannerTextMissed}>You are not on track</Text>
              </View>
            )}
            {activeMealInfo.status === 'upcoming' && (
              <View style={styles.mealBannerUpcoming}>
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

        {/* All meals completed inline */}
        {tracking.meals.length > 0 && !activeMealInfo && completedCount > 0 && (
          <View style={styles.allMealsDoneCard}>
            <Text style={styles.allDoneEmoji}>🎉</Text>
            <Text style={styles.allDoneText}>All meals completed! Great job!</Text>
            <Text style={styles.allDoneSub}>
              Total consumed: {tracking.consumedCalories} kcal
            </Text>
          </View>
        )}

        {/* -------- Today's Workout Card -------- */}
        {workoutTracking.activePlan && !isRestDay && (
          <View style={styles.workoutCard}>
            <View style={styles.workoutCardHead}>
              <Text style={styles.workoutCardTitle}>💪 Today's Workout</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyWorkout')}>
                <Text style={styles.workoutCardLink}>{workoutType}</Text>
              </TouchableOpacity>
            </View>

            {/* Not yet completed */}
            {!workoutTracking.todayCompleted && (
              <View style={styles.workoutStatusPending}>
                <View style={styles.wsIconPending}>
                  <Text style={{ fontSize: 16 }}>🏋️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.wsText}>Scheduled at {exerciseTime}</Text>
                  <Text style={styles.wsSub}>{exerciseCount} exercises • ~{exerciseDuration} min</Text>
                </View>
                <View style={styles.wsBadgePending}>
                  <Text style={styles.wsBadgePendingText}>Pending</Text>
                </View>
              </View>
            )}

            {/* Workout completion prompt */}
            {showWorkoutPrompt && (
              <TouchableOpacity
                style={styles.mealCheckBtn}
                onPress={handleCompleteWorkout}
              >
                <View style={styles.mealCheckbox}><Text> </Text></View>
                <Text style={styles.mealCheckLabel}>Have you completed your workout? 💪</Text>
              </TouchableOpacity>
            )}

            {/* Already completed */}
            {workoutTracking.todayCompleted && (
              <TouchableOpacity
                style={styles.workoutStatusDone}
                onPress={handleUncompleteWorkout}
                activeOpacity={0.7}
              >
                <View style={styles.wsIconDone}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.wsTextDone}>Workout completed!</Text>
                  <Text style={styles.wsSub}>{exerciseCount} exercises • {exerciseDuration} min</Text>
                </View>
                <View style={styles.wsBadgeDone}>
                  <Text style={styles.wsBadgeDoneText}>Done</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Pre-workout motivational quote */}
            {!workoutTracking.todayCompleted && workoutTracking.motivationalQuote && (
              <Text style={styles.motivationalQuote}>
                "{workoutTracking.motivationalQuote}"
              </Text>
            )}
          </View>
        )}

        {/* -------- Quick Actions -------- */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.cardsContainer}>
          {cards.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={card.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: card.bg }]}>
                <Text style={{ fontSize: 18 }}>{card.icon}</Text>
              </View>
              <Text style={styles.actionTitle}>{card.title}</Text>
              <Text style={styles.actionDesc}>{card.description}</Text>
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
    backgroundColor: '#F8F9FA',
  },
  // ---- Header ----
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
    marginTop: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  avatarText: {
    fontSize: 15,
  },
  // ---- Content ----
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // ---- Overview ----
  overviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    ...shadows.sm,
  },
  overviewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  ringItem: {
    alignItems: 'center',
    gap: 6,
  },
  ringPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  ringCount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  ringCheckmark: {
    fontSize: 14,
    fontWeight: '800',
  },
  ringSub: {
    fontSize: 7,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  ringLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  // ---- Celebration ----
  celebrationCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(34,197,94,0.05)',
  },
  celebrationIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  celebrationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16a34a',
    marginBottom: 2,
  },
  celebrationSub: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  celebrationDetail: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '600',
  },
  // ---- Rest Day ----
  restDayCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(139,92,246,0.04)',
  },
  restDayIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  restDayTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  restDayText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 17,
    textAlign: 'center',
  },
  // ---- View Meals Row ----
  viewMealsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    ...shadows.sm,
  },
  vmLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vmIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  vmSub: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  vmArrow: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  // ---- Meal Action Card ----
  mealActionCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
  },
  mealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealBannerMissed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealBannerUpcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  bannerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  bannerTextMissed: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '700',
  },
  bannerTextUpcoming: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  currentMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentMealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  currentMealTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  currentMealReplaced: {
    fontSize: 12,
    color: colors.error,
    textDecorationLine: 'line-through',
  },
  mealCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    marginTop: 8,
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
    marginRight: 10,
  },
  mealCheckLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  // ---- All Meals Done
  allMealsDoneCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    ...shadows.sm,
  },
  allDoneEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  allDoneText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: '700',
  },
  allDoneSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // ---- Workout Card ----
  workoutCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
  },
  workoutCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  workoutCardLink: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  // Workout status rows
  workoutStatusPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  workoutStatusDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.05)',
  },
  wsIconPending: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(17,24,39,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsIconDone: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  wsTextDone: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  wsSub: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 1,
  },
  wsBadgePending: {
    backgroundColor: 'rgba(17,24,39,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  wsBadgePendingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
  },
  wsBadgeDone: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  wsBadgeDoneText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16a34a',
  },
  motivationalQuote: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    lineHeight: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  // ---- Quick Actions ----
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 12,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...shadows.sm,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  actionDesc: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
});

export default HomeScreen;

