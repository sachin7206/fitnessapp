import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  persistTracking,
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
  mergeStepHistory,
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
  const [dailyStreak, setDailyStreak] = useState({ current: 0, best: 0 });

  // Workout summary bottom sheet state
  const [workoutSheetVisible, setWorkoutSheetVisible] = useState(false);
  const [completionDates, setCompletionDates] = useState([]);
  const [sheetWeekOffset, setSheetWeekOffset] = useState(0);
  const [sheetSelectedBar, setSheetSelectedBar] = useState(null);
  const sheetAnim = useState(new Animated.Value(0))[0];
  const SCREEN_HEIGHT = Dimensions.get('window').height;

  // Step history bottom sheet state
  const [stepSheetVisible, setStepSheetVisible] = useState(false);
  const [stepSheetWeekOffset, setStepSheetWeekOffset] = useState(0);
  const [stepSheetSelectedBar, setStepSheetSelectedBar] = useState(null);
  const stepSheetAnim = useState(new Animated.Value(0))[0];

  const getDateString = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const getWeekStart = (date, offset = 0) => {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    d.setDate(d.getDate() - diffToMon + (offset * 7));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const openWorkoutSheet = async () => {
    setWorkoutSheetVisible(true);
    setSheetWeekOffset(0);
    setSheetSelectedBar(null);
    try {
      const data = await workoutService.getCompletionHistory();
      const raw = data?.completionDates || data || [];
      if (Array.isArray(raw)) {
        setCompletionDates(raw.map(d => typeof d === 'string' ? d : d.date));
      }
    } catch (e) { /* non-critical */ }
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeWorkoutSheet = () => {
    Animated.timing(sheetAnim, { toValue: 0, useNativeDriver: true, duration: 200 }).start(() => {
      setWorkoutSheetVisible(false);
    });
  };

  // 12-week bar chart data
  const getSheetWeeksData = () => {
    const weeks = [];
    const dateSet = new Set(completionDates);
    for (let w = 0; w < 12; w++) {
      const ws = getWeekStart(new Date(), sheetWeekOffset - 11 + w);
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(ws); d.setDate(ws.getDate() + i);
        if (dateSet.has(getDateString(d))) count++;
      }
      weeks.push({
        weekLabel: `${ws.getDate()} ${ws.toLocaleString('default', { month: 'short' })}`,
        count,
        isCurrentWeek: sheetWeekOffset === 0 && w === 11,
      });
    }
    return weeks;
  };

  // Current week day-by-day
  const getSheetCurrentWeekDays = () => {
    const ws = getWeekStart(new Date(), sheetWeekOffset);
    const today = getDateString(new Date());
    const DAY_S = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateSet = new Set(completionDates);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws); d.setDate(ws.getDate() + i);
      const ds = getDateString(d);
      days.push({
        dayLabel: DAY_S[d.getDay()],
        dayNum: d.getDate(),
        completed: dateSet.has(ds),
        isToday: ds === today,
        isFuture: d > new Date(),
      });
    }
    return days;
  };

  // Sheet week label
  const getSheetWeekLabel = () => {
    if (sheetWeekOffset === 0) return 'This Week';
    if (sheetWeekOffset === -1) return 'Last Week';
    const ws = getWeekStart(new Date(), sheetWeekOffset);
    const we = new Date(ws); we.setDate(ws.getDate() + 6);
    return `${ws.getDate()} ${ws.toLocaleString('default', { month: 'short' })} – ${we.getDate()} ${we.toLocaleString('default', { month: 'short' })}`;
  };

  // Streak from completion dates (for sheet)
  const getSheetStreakData = () => {
    if (!completionDates || completionDates.length === 0) return { current: 0, best: 0 };
    const sorted = [...new Set(completionDates)].sort();
    let current = 0;
    const today = getDateString(new Date());
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return getDateString(d); })();
    let checkDate = sorted.includes(today) ? today : (sorted.includes(yesterday) ? yesterday : null);
    if (checkDate) {
      let d = new Date(checkDate + 'T00:00:00');
      while (sorted.includes(getDateString(d))) { current++; d.setDate(d.getDate() - 1); }
    }
    let best = 0, run = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + 'T00:00:00');
      const curr = new Date(sorted[i] + 'T00:00:00');
      if ((curr - prev) / 86400000 === 1) { run++; } else { run = 1; }
      if (run > best) best = run;
    }
    if (sorted.length === 1) best = 1;
    if (current > best) best = current;
    return { current, best };
  };

  // ---------- Step History Bottom Sheet ----------
  const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const openStepSheet = async () => {
    setStepSheetVisible(true);
    setStepSheetWeekOffset(0);
    setStepSheetSelectedBar(null);
    // Load step history from backend
    try {
      const historyData = await workoutService.getStepHistory(90);
      if (historyData && historyData.length > 0) {
        dispatch(mergeStepHistory(historyData.map(h => ({
          date: h.trackingDate,
          steps: h.steps,
          caloriesBurned: h.caloriesBurned || Math.round(h.steps * 0.04),
        }))));
        dispatch(persistWorkoutTracking());
      }
    } catch (e) { /* non-critical */ }
    Animated.spring(stepSheetAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeStepSheet = () => {
    Animated.timing(stepSheetAnim, { toValue: 0, useNativeDriver: true, duration: 200 }).start(() => {
      setStepSheetVisible(false);
    });
  };

  const getStepSheetWeekData = () => {
    const rawSteps = workoutTracking.todaySteps;
    const rawHistory = workoutTracking.stepHistory;
    const todayStepsVal = (typeof rawSteps === 'number' && !isNaN(rawSteps)) ? rawSteps : 0;
    const history = Array.isArray(rawHistory) ? rawHistory.filter(h => h && typeof h.steps === 'number') : [];

    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(today.getDate() - diffToMon + (stepSheetWeekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = getDateString(d);
      const isToday = dateStr === getDateString(today);
      let steps = 0;
      if (isToday) {
        steps = todayStepsVal || 0;
      } else {
        const entry = history.find(h => h.date === dateStr);
        steps = entry ? entry.steps : 0;
      }
      const caloriesBurned = Math.round(steps * 0.04);
      days.push({
        date: dateStr,
        dayLabel: DAY_SHORT[d.getDay()],
        dayNum: d.getDate(),
        month: d.toLocaleString('default', { month: 'short' }),
        steps,
        caloriesBurned,
        isToday,
      });
    }
    return days;
  };

  const getStepSheetWeekLabel = () => {
    if (stepSheetWeekOffset === 0) return 'This Week';
    if (stepSheetWeekOffset === -1) return 'Last Week';
    const wd = getStepSheetWeekData();
    return `${wd[0].dayNum} ${wd[0].month} – ${wd[6].dayNum} ${wd[6].month}`;
  };

  // Load persisted tracking on mount (with backend sync — one time only)
  useEffect(() => {
    dispatch(loadTrackingFromStorage());
    dispatch(loadWorkoutTrackingFromStorage()).then(() => {
      // Fetch workout plan data only after tracking is loaded (avoids double step calls)
      fetchWorkoutData();
    });
    fetchDailyStreak();
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
      fetchDailyStreak();
    });
    return unsubscribe;
  }, [navigation]);

  // Fetch daily streak from workout completion history
  const fetchDailyStreak = async () => {
    try {
      const data = await workoutService.getCompletionHistory();
      const dates = data?.completionDates || data || [];
      if (!Array.isArray(dates) || dates.length === 0) return;

      const getDS = (d) => d.toISOString().split('T')[0];
      const sorted = [...new Set(dates)].sort();

      // Current streak
      let current = 0;
      const today = getDS(new Date());
      const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return getDS(d); })();
      let checkDate = sorted.includes(today) ? today : (sorted.includes(yesterday) ? yesterday : null);
      if (checkDate) {
        let d = new Date(checkDate + 'T00:00:00');
        while (sorted.includes(getDS(d))) {
          current++;
          d.setDate(d.getDate() - 1);
        }
      }
      // Best streak
      let best = 0, run = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1] + 'T00:00:00');
        const curr = new Date(sorted[i] + 'T00:00:00');
        if ((curr - prev) / 86400000 === 1) { run++; } else { run = 1; }
        if (run > best) best = run;
      }
      if (sorted.length === 1) best = 1;
      if (current > best) best = current;
      setDailyStreak({ current, best });
    } catch (e) { /* streak is non-critical */ }
  };

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

  // Find the next upcoming meal (first non-completed)
  const getNextMealInfo = () => {
    const meals = tracking.meals || [];
    // Find the next non-completed meal
    for (let i = 0; i < meals.length; i++) {
      if (!meals[i].completed) {
        const status = getMealStatus(meals[i]);
        return { meal: meals[i], index: i, status };
      }
    }
    return null; // all completed
  };

  const nextMealInfo = tracking.meals.length > 0 ? getNextMealInfo() : null;
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
    const doUndo = async () => {
      try {
        await workoutService.markWorkoutUncomplete();
      } catch (e) { /* continue with local update even if backend fails */ }
      dispatch(uncompleteWorkout());
      dispatch(persistWorkoutTracking());
    };
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

  // Workout card info — count only TODAY's exercises (not all days)
  const getTodayExerciseCount = () => {
    const allExercises = workoutTracking.activePlan?.workoutPlan?.exercises || [];
    if (allExercises.length === 0) return workoutTracking.activePlan?.exercises?.length || 0;

    // Direct exercises for today
    const directExercises = allExercises.filter(e => e.dayOfWeek === todayDayName);
    if (directExercises.length > 0) return directExercises.length;

    // Cycling: if today has no direct exercises, inherit from a workout day
    const ORDERED_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const workoutDays = ORDERED_DAYS.filter(d => allExercises.some(e => e.dayOfWeek === d));
    if (workoutDays.length === 0 || workoutDays.length >= 7) return 0;

    let cycleIndex = 0;
    for (const day of ORDERED_DAYS) {
      if (workoutDays.includes(day)) continue;
      if (day === planRestDay) continue;
      if (day === todayDayName) {
        const mappedDay = workoutDays[cycleIndex % workoutDays.length];
        return allExercises.filter(e => e.dayOfWeek === mappedDay).length;
      }
      cycleIndex++;
    }
    return 0;
  };
  const exerciseCount = getTodayExerciseCount();
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
      title: 'Reports',
      description: 'View reports',
      icon: '📄',
      bg: '#F8FAFC',
      onPress: () => navigation.navigate('ReportGenerator'),
    },
    {
      title: 'Photo Log',
      description: 'Before & after',
      icon: '📸',
      bg: '#FFF1F2',
      onPress: () => navigation.navigate('PhotoLog'),
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
              onPress={openWorkoutSheet}
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
              onPress={openStepSheet}
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

        {/* -------- Daily Streak -------- */}
        {dailyStreak.current > 0 && (
          <View style={styles.streakCard}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakFlame}>🔥</Text>
              <View>
                <Text style={styles.streakCount}>{dailyStreak.current} day{dailyStreak.current !== 1 ? 's' : ''}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </View>
            </View>
            {dailyStreak.best > 0 && (
              <View style={styles.streakRight}>
                <Text style={styles.streakBestIcon}>🏆</Text>
                <Text style={styles.streakBestText}>Best: {dailyStreak.best}</Text>
              </View>
            )}
          </View>
        )}

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

        {/* -------- Next Meal Info -------- */}
        {tracking.meals.length > 0 && nextMealInfo && (
          <TouchableOpacity
            style={styles.nextMealCard}
            onPress={() => navigation.navigate('MyNutritionPlan')}
            activeOpacity={0.7}
          >
            <View style={styles.nextMealHeader}>
              <Text style={styles.nextMealBadge}>
                {nextMealInfo.status === 'active' ? '🍽️ Current Meal' : nextMealInfo.status === 'missed' ? '⏰ Pending' : '⏰ Up Next'}
              </Text>
            </View>
            <View style={styles.nextMealRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextMealName}>{nextMealInfo.meal.name}</Text>
                <Text style={styles.nextMealMeta}>
                  🕐 {nextMealInfo.meal.timeOfDay}  •  {nextMealInfo.meal.calories || 0} kcal
                </Text>
              </View>
              <Text style={styles.vmArrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* All meals completed */}
        {tracking.meals.length > 0 && !nextMealInfo && completedCount > 0 && (
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

      {/* -------- Workout History Bottom Sheet -------- */}
      <Modal visible={workoutSheetVisible} transparent animationType="none" onRequestClose={closeWorkoutSheet}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeWorkoutSheet}>
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [{
                  translateY: sheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_HEIGHT, 0],
                  }),
                }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Handle bar */}
              <View style={styles.sheetHandle}>
                <View style={styles.sheetHandleBar} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ maxHeight: SCREEN_HEIGHT * 0.78 }}>
                {/* Header */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>🏋️ Workout History</Text>
                  <TouchableOpacity onPress={closeWorkoutSheet}>
                    <Text style={styles.sheetCloseBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Streak */}
                {(() => {
                  const s = getSheetStreakData();
                  return (s.current > 0 || s.best > 0) ? (
                    <View style={styles.sheetStreakRow}>
                      <View style={styles.sheetStreakItem}>
                        <Text style={{ fontSize: 22 }}>🔥</Text>
                        <Text style={styles.sheetStreakVal}>{s.current}</Text>
                        <Text style={styles.sheetStreakLbl}>Current</Text>
                      </View>
                      <View style={styles.sheetStreakDivider} />
                      <View style={styles.sheetStreakItem}>
                        <Text style={{ fontSize: 22 }}>🏆</Text>
                        <Text style={styles.sheetStreakVal}>{s.best}</Text>
                        <Text style={styles.sheetStreakLbl}>Best</Text>
                      </View>
                    </View>
                  ) : null;
                })()}

                {/* Summary stats */}
                {(() => {
                  const weeksData = getSheetWeeksData();
                  const thisWeekCount = weeksData[weeksData.length - 1]?.count || 0;
                  const last4WeeksTotal = weeksData.slice(-4).reduce((s, w) => s + w.count, 0);
                  const totalCount = workoutTracking.workoutCount || 0;
                  return (
                    <View style={styles.sheetCountRow}>
                      <View style={styles.sheetCountCard}>
                        <Text style={styles.sheetCountValue}>{totalCount}</Text>
                        <Text style={styles.sheetCountLabel}>💪 Total</Text>
                      </View>
                      <View style={styles.sheetCountCard}>
                        <Text style={styles.sheetCountValue}>{thisWeekCount}</Text>
                        <Text style={styles.sheetCountLabel}>🔥 This Week</Text>
                      </View>
                      <View style={styles.sheetCountCard}>
                        <Text style={styles.sheetCountValue}>{last4WeeksTotal}</Text>
                        <Text style={styles.sheetCountLabel}>📅 Last 4 Wks</Text>
                      </View>
                    </View>
                  );
                })()}

                {/* 12-Week Bar Chart */}
                <View style={styles.sheetChartNav}>
                  <TouchableOpacity onPress={() => { setSheetWeekOffset(w => w - 12); setSheetSelectedBar(null); }}>
                    <Text style={styles.sheetChartArrow}>◀</Text>
                  </TouchableOpacity>
                  <Text style={styles.sheetSectionTitle}>Weekly Overview</Text>
                  <TouchableOpacity
                    onPress={() => { if (sheetWeekOffset < 0) { setSheetWeekOffset(w => Math.min(0, w + 12)); setSheetSelectedBar(null); } }}
                    disabled={sheetWeekOffset >= 0}
                  >
                    <Text style={[styles.sheetChartArrow, sheetWeekOffset >= 0 && { opacity: 0.3 }]}>▶</Text>
                  </TouchableOpacity>
                </View>
                {(() => {
                  const weeksData = getSheetWeeksData();
                  const maxCount = Math.max(...weeksData.map(w => w.count), 1);
                  const CHART_H = 130;
                  const BAR_LABEL_H = 18;
                  const MAX_BAR_H = CHART_H - BAR_LABEL_H;
                  return (
                    <View style={styles.sheetChartContainer}>
                      {/* Y-axis */}
                      <View style={[styles.sheetYAxis, { height: MAX_BAR_H, marginBottom: BAR_LABEL_H }]}>
                        <Text style={styles.sheetYLabel}>{maxCount}</Text>
                        <Text style={styles.sheetYLabel}>{Math.ceil(maxCount / 2)}</Text>
                        <Text style={styles.sheetYLabel}>0</Text>
                      </View>
                      {/* Bars */}
                      <View style={[styles.sheetBarsArea, { height: CHART_H }]}>
                        {weeksData.map((week, idx) => {
                          const barH = week.count > 0 ? Math.max(4, (week.count / maxCount) * MAX_BAR_H) : 3;
                          const isSelected = sheetSelectedBar === idx;
                          return (
                            <TouchableOpacity key={idx} style={styles.sheetBarCol}
                              onPress={() => setSheetSelectedBar(isSelected ? null : idx)} activeOpacity={0.7}>
                              {isSelected && (
                                <View style={styles.sheetTooltip}>
                                  <Text style={styles.sheetTooltipText}>{week.weekLabel}</Text>
                                  <Text style={styles.sheetTooltipCount}>{week.count}</Text>
                                </View>
                              )}
                              <View style={styles.sheetBarWrap}>
                                <View style={[styles.sheetBar, {
                                  height: barH,
                                  backgroundColor: week.isCurrentWeek ? colors.primary : week.count > 0 ? colors.primary + '60' : '#E5E7EB',
                                  borderWidth: isSelected ? 1.5 : 0, borderColor: colors.primary,
                                }]} />
                              </View>
                              <Text style={[styles.sheetBarLbl, week.isCurrentWeek && { color: colors.primary, fontWeight: '700' }]}>
                                {week.weekLabel.split(' ')[0]}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}

                {/* Current Week Day-by-Day */}
                <Text style={[styles.sheetSectionTitle, { marginTop: 12 }]}>{getSheetWeekLabel()}</Text>
                <View style={styles.sheetDayRow}>
                  {getSheetCurrentWeekDays().map((day, idx) => (
                    <View key={idx} style={styles.sheetDayItem}>
                      <Text style={[styles.sheetDayLabel, day.isToday && styles.sheetDayLabelToday]}>{day.dayLabel}</Text>
                      <View style={[
                        styles.sheetDayCircle,
                        day.completed && styles.sheetDayCircleDone,
                        day.isToday && !day.completed && styles.sheetDayCircleToday,
                        day.isFuture && { backgroundColor: '#FAFAFA' },
                      ]}>
                        {day.completed ? (
                          <Text style={{ color: colors.success, fontWeight: '800', fontSize: 14 }}>✓</Text>
                        ) : (
                          <Text style={{ fontSize: 11, fontWeight: '600', color: day.isFuture ? '#D1D5DB' : '#6B7280' }}>{day.dayNum}</Text>
                        )}
                      </View>
                      {day.isToday && <Text style={{ color: colors.primary, fontSize: 5 }}>●</Text>}
                    </View>
                  ))}
                </View>

                {/* Consistency */}
                <Text style={[styles.sheetSectionTitle, { marginTop: 12 }]}>Consistency</Text>
                <View style={styles.sheetConsistencyCard}>
                  {getSheetWeeksData().slice(-8).map((week, idx) => (
                    <View key={idx} style={styles.sheetConsistencyRow}>
                      <Text style={styles.sheetConsistencyLabel}>{week.weekLabel}</Text>
                      <View style={styles.sheetConsistencyTrack}>
                        <View style={[styles.sheetConsistencyFill, {
                          width: `${Math.min(100, (week.count / 7) * 100)}%`,
                          backgroundColor: week.count >= 5 ? colors.success : week.count >= 3 ? colors.primary : week.count > 0 ? '#F59E0B' : '#E5E7EB',
                        }]} />
                      </View>
                      <Text style={styles.sheetConsistencyCount}>{week.count}/7</Text>
                    </View>
                  ))}
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* -------- Step History Bottom Sheet -------- */}
      <Modal visible={stepSheetVisible} transparent animationType="none" onRequestClose={closeStepSheet}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeStepSheet}>
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [{
                  translateY: stepSheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_HEIGHT, 0],
                  }),
                }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Handle bar */}
              <View style={styles.sheetHandle}>
                <View style={styles.sheetHandleBar} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ maxHeight: SCREEN_HEIGHT * 0.85 }}>
                {/* Header */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>👟 Step Tracker</Text>
                  <TouchableOpacity onPress={closeStepSheet}>
                    <Text style={styles.sheetCloseBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Today's summary card */}
                {(() => {
                  const rawSteps = workoutTracking.todaySteps;
                  const rawGoal = workoutTracking.stepGoal;
                  const stepsVal = (typeof rawSteps === 'number' && !isNaN(rawSteps)) ? rawSteps : 0;
                  const goalVal = (typeof rawGoal === 'number' && !isNaN(rawGoal)) ? rawGoal : 0;
                  const todayCal = Math.round(stepsVal * 0.04);
                  const todayKm = (stepsVal * 0.0008).toFixed(1);
                  const goalPct = goalVal > 0 ? Math.min(100, Math.round((stepsVal / goalVal) * 100)) : 0;
                  return (
                    <View style={styles.stepSheetTodayCard}>
                      <Text style={styles.stepSheetTodayIcon}>👟</Text>
                      <Text style={styles.stepSheetTodaySteps}>{stepsVal.toLocaleString()}</Text>
                      <Text style={styles.stepSheetTodayLabel}>Steps Today</Text>
                      <View style={styles.stepSheetMetaRow}>
                        <View style={styles.stepSheetMetaItem}>
                          <Text style={styles.stepSheetMetaValue}>🔥 {todayCal}</Text>
                          <Text style={styles.stepSheetMetaLabel}>Calories</Text>
                        </View>
                        <View style={styles.stepSheetMetaItem}>
                          <Text style={styles.stepSheetMetaValue}>📏 {todayKm}</Text>
                          <Text style={styles.stepSheetMetaLabel}>km</Text>
                        </View>
                        {goalVal > 0 && (
                          <View style={styles.stepSheetMetaItem}>
                            <Text style={styles.stepSheetMetaValue}>🎯 {goalPct}%</Text>
                            <Text style={styles.stepSheetMetaLabel}>Goal</Text>
                          </View>
                        )}
                      </View>
                      {goalVal > 0 && (
                        <View style={styles.stepSheetGoalProgress}>
                          <View style={styles.stepSheetGoalBarBg}>
                            <View style={[styles.stepSheetGoalBarFill, {
                              width: `${Math.min(100, (stepsVal / goalVal) * 100)}%`,
                              backgroundColor: stepsVal >= goalVal ? colors.success : colors.primary,
                            }]} />
                          </View>
                          <Text style={styles.stepSheetGoalText}>
                            {stepsVal.toLocaleString()} / {goalVal.toLocaleString()} steps
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })()}

                {/* Week navigation */}
                <View style={styles.sheetChartNav}>
                  <TouchableOpacity onPress={() => { setStepSheetWeekOffset(w => w - 1); setStepSheetSelectedBar(null); }}>
                    <Text style={styles.sheetChartArrow}>◀</Text>
                  </TouchableOpacity>
                  <Text style={styles.sheetSectionTitle}>{getStepSheetWeekLabel()}</Text>
                  <TouchableOpacity
                    onPress={() => { if (stepSheetWeekOffset < 0) { setStepSheetWeekOffset(w => w + 1); setStepSheetSelectedBar(null); } }}
                    disabled={stepSheetWeekOffset >= 0}
                  >
                    <Text style={[styles.sheetChartArrow, stepSheetWeekOffset >= 0 && { opacity: 0.3 }]}>▶</Text>
                  </TouchableOpacity>
                </View>

                {/* Bar chart */}
                {(() => {
                  const weekData = getStepSheetWeekData();
                  const maxSteps = Math.max(...weekData.map(d => d.steps), 1000);
                  const CHART_H = 160;
                  const BAR_LABEL_H = 24;
                  const MAX_BAR_H = CHART_H - BAR_LABEL_H;
                  return (
                    <View style={[styles.sheetChartContainer, { height: CHART_H + 10 }]}>
                      {/* Y-axis */}
                      <View style={[styles.sheetYAxis, { height: MAX_BAR_H, marginBottom: BAR_LABEL_H }]}>
                        <Text style={styles.sheetYLabel}>{maxSteps.toLocaleString()}</Text>
                        <Text style={styles.sheetYLabel}>{Math.round(maxSteps / 2).toLocaleString()}</Text>
                        <Text style={styles.sheetYLabel}>0</Text>
                      </View>
                      {/* Bars */}
                      <View style={[styles.sheetBarsArea, { height: CHART_H }]}>
                        {weekData.map((day, idx) => {
                          const barH = day.steps > 0 ? Math.max(4, (day.steps / maxSteps) * MAX_BAR_H) : 3;
                          const isSelected = stepSheetSelectedBar === idx;
                          return (
                            <TouchableOpacity key={idx} style={styles.sheetBarCol}
                              onPress={() => setStepSheetSelectedBar(isSelected ? null : idx)} activeOpacity={0.7}>
                              {isSelected && day.steps > 0 && (
                                <View style={styles.sheetTooltip}>
                                  <Text style={styles.sheetTooltipText}>{day.steps.toLocaleString()} steps</Text>
                                  <Text style={styles.sheetTooltipCount}>🔥 {day.caloriesBurned} cal</Text>
                                </View>
                              )}
                              <View style={[styles.sheetBarWrap, { maxWidth: 28 }]}>
                                <View style={[styles.sheetBar, {
                                  height: barH,
                                  backgroundColor: day.isToday ? colors.primary : day.steps > 0 ? colors.primary + '60' : '#E5E7EB',
                                  borderWidth: isSelected ? 1.5 : 0, borderColor: colors.primary,
                                }]} />
                              </View>
                              <Text style={[styles.sheetBarLbl, { fontSize: 9 }, day.isToday && { color: colors.primary, fontWeight: '700' }]}>
                                {day.dayLabel}
                              </Text>
                              <Text style={[styles.sheetBarLbl, { fontSize: 8 }]}>{day.dayNum}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}

                {/* Week summary stats */}
                {(() => {
                  const weekData = getStepSheetWeekData();
                  const weekTotalSteps = weekData.reduce((s, d) => s + d.steps, 0);
                  const weekTotalCal = weekData.reduce((s, d) => s + d.caloriesBurned, 0);
                  const weekAvgSteps = Math.round(weekTotalSteps / 7);
                  return (
                    <View style={styles.sheetCountRow}>
                      <View style={styles.sheetCountCard}>
                        <Text style={styles.sheetCountValue}>{weekTotalSteps.toLocaleString()}</Text>
                        <Text style={styles.sheetCountLabel}>👟 Total Steps</Text>
                      </View>
                      <View style={styles.sheetCountCard}>
                        <Text style={styles.sheetCountValue}>{weekAvgSteps.toLocaleString()}</Text>
                        <Text style={styles.sheetCountLabel}>📊 Daily Avg</Text>
                      </View>
                      <View style={styles.sheetCountCard}>
                        <Text style={styles.sheetCountValue}>{weekTotalCal.toLocaleString()}</Text>
                        <Text style={styles.sheetCountLabel}>🔥 Calories</Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Daily breakdown */}
                <Text style={[styles.sheetSectionTitle, { marginTop: 4 }]}>Daily Breakdown</Text>
                {getStepSheetWeekData().slice().reverse().map((day, idx) => (
                  <View key={idx} style={[styles.stepSheetDayRow, day.isToday && styles.stepSheetDayRowToday]}>
                    <View style={styles.stepSheetDayLeft}>
                      <Text style={[styles.stepSheetDayName, day.isToday && { color: colors.primary }]}>
                        {day.dayLabel} {day.dayNum}
                      </Text>
                      {day.isToday && <Text style={styles.stepSheetTodayBadge}>Today</Text>}
                    </View>
                    <View style={styles.stepSheetDayRight}>
                      <Text style={styles.stepSheetDaySteps}>{day.steps.toLocaleString()} steps</Text>
                      <Text style={styles.stepSheetDayCal}>🔥 {day.caloriesBurned} cal</Text>
                    </View>
                  </View>
                ))}

                <View style={{ height: 20 }} />
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
  // ---- Streak ----
  streakCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDBA7420',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakFlame: { fontSize: 32 },
  streakCount: { fontSize: 18, fontWeight: '800', color: '#EA580C' },
  streakLabel: { fontSize: 11, color: '#9A3412', fontWeight: '600' },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FED7AA40',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streakBestIcon: { fontSize: 16 },
  streakBestText: { fontSize: 12, fontWeight: '700', color: '#C2410C' },
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
  // ---- Next Meal Card ----
  nextMealCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
  },
  nextMealHeader: {
    marginBottom: 8,
  },
  nextMealBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  nextMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextMealName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  nextMealMeta: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
  // ---- Workout History Bottom Sheet ----
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetHandleBar: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB',
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18, fontWeight: '800', color: '#111827',
  },
  sheetCloseBtn: {
    fontSize: 20, color: '#9CA3AF', fontWeight: '600', padding: 4,
  },
  // Streak
  sheetStreakRow: {
    flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 14,
    paddingVertical: 10, marginBottom: 10, alignItems: 'center', justifyContent: 'center',
  },
  sheetStreakItem: { flex: 1, alignItems: 'center' },
  sheetStreakVal: { fontSize: 22, fontWeight: '800', color: colors.primary },
  sheetStreakLbl: { fontSize: 9, fontWeight: '600', color: '#9CA3AF', marginTop: 2 },
  sheetStreakDivider: { width: 1, height: 36, backgroundColor: '#E5E7EB' },
  // Count cards
  sheetCountRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 6,
  },
  sheetCountCard: {
    flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, paddingVertical: 10, alignItems: 'center',
  },
  sheetCountValue: {
    fontSize: 20, fontWeight: '900', color: '#111827',
  },
  sheetCountLabel: {
    fontSize: 9, fontWeight: '600', color: '#9CA3AF', marginTop: 2, textAlign: 'center',
  },
  sheetSectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8,
  },
  // Chart navigation
  sheetChartNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  sheetChartArrow: { fontSize: 16, color: colors.primary, fontWeight: '700', padding: 4 },
  // 12-week chart
  sheetChartContainer: {
    flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 14,
    padding: 8, paddingBottom: 10, marginBottom: 4, overflow: 'hidden',
  },
  sheetYAxis: {
    width: 22, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 3,
  },
  sheetYLabel: { fontSize: 8, color: '#D1D5DB' },
  sheetBarsArea: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', overflow: 'hidden',
  },
  sheetBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  sheetBarWrap: { width: '55%', maxWidth: 14, justifyContent: 'flex-end', borderRadius: 3, overflow: 'hidden' },
  sheetBar: { width: '100%', borderRadius: 3, minHeight: 3 },
  sheetBarLbl: { fontSize: 7, color: '#D1D5DB', marginTop: 2 },
  sheetTooltip: {
    position: 'absolute', bottom: '100%', marginBottom: 2, backgroundColor: colors.primary,
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, alignItems: 'center', zIndex: 10, minWidth: 50,
  },
  sheetTooltipText: { color: '#FFF', fontSize: 7, fontWeight: '600' },
  sheetTooltipCount: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  // Day-by-day
  sheetDayRow: {
    flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F9FAFB',
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4, marginBottom: 4,
  },
  sheetDayItem: { alignItems: 'center', gap: 4 },
  sheetDayLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  sheetDayLabelToday: { color: colors.primary, fontWeight: '800' },
  sheetDayCircle: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetDayCircleDone: { backgroundColor: colors.success + '20' },
  sheetDayCircleToday: { borderWidth: 2, borderColor: colors.primary, backgroundColor: 'transparent' },
  // Consistency
  sheetConsistencyCard: {
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 10, marginBottom: 4,
  },
  sheetConsistencyRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 5,
  },
  sheetConsistencyLabel: { fontSize: 9, color: '#9CA3AF', width: 50 },
  sheetConsistencyTrack: {
    flex: 1, height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden', marginHorizontal: 6,
  },
  sheetConsistencyFill: { height: '100%', borderRadius: 5 },
  sheetConsistencyCount: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', width: 26, textAlign: 'right' },
  // ---- Step History Bottom Sheet ----
  stepSheetTodayCard: {
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 12,
  },
  stepSheetTodayIcon: { fontSize: 32, marginBottom: 4 },
  stepSheetTodaySteps: { fontSize: 38, fontWeight: '800', color: colors.primary },
  stepSheetTodayLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  stepSheetMetaRow: { flexDirection: 'row', gap: 24 },
  stepSheetMetaItem: { alignItems: 'center' },
  stepSheetMetaValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
  stepSheetMetaLabel: { fontSize: 9, color: '#9CA3AF', marginTop: 2 },
  stepSheetGoalProgress: { width: '100%', marginTop: 12 },
  stepSheetGoalBarBg: { height: 8, backgroundColor: colors.primary + '20', borderRadius: 4, overflow: 'hidden' },
  stepSheetGoalBarFill: { height: '100%', borderRadius: 4 },
  stepSheetGoalText: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },
  stepSheetDayRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 10, backgroundColor: '#F9FAFB', borderRadius: 10, marginBottom: 4,
  },
  stepSheetDayRowToday: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  stepSheetDayLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepSheetDayName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  stepSheetTodayBadge: {
    fontSize: 9, color: colors.primary, fontWeight: '700',
    backgroundColor: colors.primary + '15', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, overflow: 'hidden',
  },
  stepSheetDayRight: { alignItems: 'flex-end' },
  stepSheetDaySteps: { fontSize: 13, fontWeight: '600', color: '#111827' },
  stepSheetDayCal: { fontSize: 10, color: '#F59E0B' },
});

export default HomeScreen;

