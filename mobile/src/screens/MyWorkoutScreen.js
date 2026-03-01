import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/core';
import { useDispatch, useSelector } from 'react-redux';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import workoutService from '../services/workoutService';
import {
  setActivePlan, completeWorkout, uncompleteWorkout,
  setMotivationalQuote, persistWorkoutTracking, loadWorkoutTrackingFromStorage,
} from '../store/slices/workoutTrackingSlice';

const formatLabel = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const MUSCLE_ICONS = {
  'CHEST': '🫁', 'BACK': '🔙', 'LEGS': '🦵', 'SHOULDERS': '💪',
  'ARMS': '💪', 'FULL_BODY': '🏋️', 'CARDIO': '❤️', 'CORE': '🎯',
};

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const MyWorkoutScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const workout = useSelector(state => state.workoutTracking);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    dispatch(loadWorkoutTrackingFromStorage());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchPlan = async () => {
    try {
      const response = await workoutService.getActiveWorkoutPlan();
      if (response) {
        setUserPlan(response);
        dispatch(setActivePlan(response));
        dispatch(persistWorkoutTracking());

        // Fetch motivational quote
        try {
          const quoteData = await workoutService.getMotivationalQuote();
          dispatch(setMotivationalQuote(quoteData.quote));
          dispatch(persistWorkoutTracking());
        } catch (e) { /* ignore */ }
      } else {
        navigation.replace('WorkoutSetup');
      }
    } catch (error) {
      console.log('Error fetching workout plan:', error);
      navigation.replace('WorkoutSetup');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPlan(); }, []);
  useFocusEffect(useCallback(() => { fetchPlan(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchPlan(); };

  // Time helpers
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const p = match[3]?.toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const exerciseTime = userPlan?.workoutPlan?.exerciseTime || '6:00 AM';
  const exerciseMin = parseTime(exerciseTime);
  const exerciseDuration = userPlan?.workoutPlan?.exerciseDurationMinutes || 60;

  // Statuses
  const isBeforeWorkout = nowMinutes < exerciseMin - 30;
  const isPreWorkout = nowMinutes >= exerciseMin - 30 && nowMinutes < exerciseMin;
  const isDuringWorkout = nowMinutes >= exerciseMin && nowMinutes < exerciseMin + exerciseDuration;
  const isPostWorkout = nowMinutes >= exerciseMin + 90; // 1.5 hours after workout start
  const showCompletionPrompt = isPostWorkout && !workout.todayCompleted;

  // Today's exercises
  const todayDay = DAY_NAMES[now.getDay()];
  const allExercises = userPlan?.workoutPlan?.exercises || [];
  const todayExercises = allExercises.filter(e => e.dayOfWeek === todayDay);
  const isRestDay = todayExercises.length === 0;
  const todayCalories = todayExercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);

  const handleCompleteWorkout = async () => {
    try {
      await workoutService.markWorkoutComplete();
      dispatch(completeWorkout());
      dispatch(persistWorkoutTracking());
      const msg = 'Great job completing your workout today! Keep it up! 🎉';
      Platform.OS === 'web' ? window.alert('Awesome! 💪\n' + msg) : Alert.alert('Awesome! 💪', msg);
    } catch (error) {
      console.log('Error marking workout complete:', error);
    }
  };

  const handleUncomplete = () => {
    const doUndo = () => {
      dispatch(uncompleteWorkout());
      dispatch(persistWorkoutTracking());
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Undo today\'s workout completion?')) doUndo();
    } else {
      Alert.alert('Undo Workout', 'Undo today\'s workout completion?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Undo', style: 'destructive', onPress: doUndo },
      ]);
    }
  };

  const handleNewPlan = () => {
    const doNav = () => navigation.navigate('WorkoutSetup');
    if (Platform.OS === 'web') {
      if (window.confirm('Create a new workout plan? This will replace your current plan.')) doNav();
    } else {
      Alert.alert('Create New Plan', 'This will replace your current plan. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: doNav },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your workout...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Workout</Text>
        <TouchableOpacity onPress={handleNewPlan} style={styles.newPlanBtn}>
          <Text style={styles.newPlanText}>New Plan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Plan Summary */}
        <View style={styles.planSummary}>
          <Text style={styles.planName}>{userPlan?.workoutPlan?.planName}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.badgeText}>Week {userPlan?.currentWeek || 1}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
              <Text style={styles.badgeText}>{userPlan?.completedWorkouts || 0}/{userPlan?.totalWorkouts || 0} done</Text>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressPercent}>
              {userPlan?.totalWorkouts > 0 ? Math.round(((userPlan?.completedWorkouts || 0) / userPlan.totalWorkouts) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {
              width: `${userPlan?.totalWorkouts > 0 ? Math.min(100, ((userPlan?.completedWorkouts || 0) / userPlan.totalWorkouts) * 100) : 0}%`,
            }]} />
          </View>
        </View>

        {/* Motivational Quote — 30 min before workout */}
        {(isPreWorkout || isDuringWorkout) && workout.motivationalQuote && (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteEmoji}>🔥</Text>
            <Text style={styles.quoteText}>{workout.motivationalQuote}</Text>
            <Text style={styles.quoteLabel}>Let's go for a workout!</Text>
          </View>
        )}

        {/* Today's Workout */}
        <Text style={styles.sectionTitle}>
          Today — {formatLabel(todayDay)} {isRestDay ? '(Rest Day 😴)' : ''}
        </Text>

        {isRestDay ? (
          <View style={styles.restDayCard}>
            <Text style={styles.restDayIcon}>😴</Text>
            <Text style={styles.restDayText}>Rest day! Your muscles need recovery.</Text>
          </View>
        ) : (
          <>
            <View style={styles.todayStats}>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatVal}>{todayExercises.length}</Text>
                <Text style={styles.todayStatLabel}>Exercises</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatVal}>{todayCalories}</Text>
                <Text style={styles.todayStatLabel}>Est. Calories</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatVal}>{exerciseTime}</Text>
                <Text style={styles.todayStatLabel}>Time</Text>
              </View>
            </View>

            {todayExercises
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((ex, idx) => (
                <View key={idx} style={[styles.exerciseCard, workout.todayCompleted && styles.exerciseCardDone]}>
                  <View style={styles.exerciseRow}>
                    <Text style={styles.exerciseIcon}>
                      {ex.isCardio ? '❤️' : (MUSCLE_ICONS[ex.muscleGroup] || '💪')}
                    </Text>
                    <View style={styles.exerciseInfo}>
                      <Text style={[styles.exerciseName, workout.todayCompleted && styles.exerciseNameDone]}>
                        {ex.exerciseName}
                      </Text>
                      <Text style={styles.exerciseDetail}>
                        {ex.isCardio
                          ? `${Math.round((ex.durationSeconds || 0) / 60)} min${ex.steps > 0 ? ` • ${ex.steps} steps` : ''}`
                          : `${ex.sets} sets × ${ex.reps} reps • Rest ${ex.restTimeSeconds}s`}
                      </Text>
                    </View>
                    <Text style={styles.exerciseCal}>{ex.caloriesBurned || 0} cal</Text>
                  </View>
                </View>
              ))}
          </>
        )}

        {/* Workout Completion */}
        {!isRestDay && showCompletionPrompt && (
          <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteWorkout}>
            <View style={styles.checkbox}><Text> </Text></View>
            <Text style={styles.completeBtnText}>Have you completed your workout? 💪</Text>
          </TouchableOpacity>
        )}

        {!isRestDay && workout.todayCompleted && (
          <TouchableOpacity style={styles.completedRow} onPress={handleUncomplete}>
            <View style={styles.checkboxChecked}><Text style={styles.checkMark}>✓</Text></View>
            <Text style={styles.completedText}>Workout completed! Great job! 🎉</Text>
            <Text style={styles.undoHint}>Tap to undo</Text>
          </TouchableOpacity>
        )}

        {/* Weekly Overview — Expandable */}
        <Text style={styles.sectionTitle}>Weekly Overview</Text>
        {DAY_NAMES.slice(1).concat(DAY_NAMES.slice(0, 1)).map(day => {
          const dayExercises = allExercises.filter(e => e.dayOfWeek === day);
          const isToday = day === todayDay;
          const isExpanded = expandedDays[day] || false;
          const hasExercises = dayExercises.length > 0;
          const dayCals = dayExercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);

          return (
            <View key={day}>
              <TouchableOpacity
                style={[styles.weekDayRow, isToday && styles.weekDayRowToday]}
                onPress={() => {
                  if (hasExercises) {
                    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
                  }
                }}
                activeOpacity={hasExercises ? 0.7 : 1}
              >
                <View style={styles.weekDayLeft}>
                  {hasExercises && (
                    <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                  )}
                  <Text style={[styles.weekDayName, isToday && styles.weekDayNameToday]}>
                    {formatLabel(day)} {isToday ? '(Today)' : ''}
                  </Text>
                </View>
                <Text style={styles.weekDayExercises}>
                  {hasExercises
                    ? `${dayExercises.length} exercises • ~${dayCals} cal`
                    : 'Rest Day 😴'}
                </Text>
              </TouchableOpacity>

              {/* Expanded exercise list */}
              {isExpanded && hasExercises && (
                <View style={styles.expandedExercises}>
                  {dayExercises
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((ex, idx) => (
                      <View key={idx} style={styles.expandedExRow}>
                        <Text style={styles.expandedExIcon}>
                          {ex.isCardio ? '❤️' : (MUSCLE_ICONS[ex.muscleGroup] || '💪')}
                        </Text>
                        <View style={styles.expandedExInfo}>
                          <Text style={styles.expandedExName}>{ex.exerciseName}</Text>
                          <Text style={styles.expandedExDetail}>
                            {ex.isCardio
                              ? `${Math.round((ex.durationSeconds || 0) / 60)} min${ex.steps > 0 ? ` • ${ex.steps} steps` : ''}`
                              : `${ex.sets} sets × ${ex.reps} reps • Rest ${ex.restTimeSeconds}s`}
                          </Text>
                        </View>
                        <Text style={styles.expandedExCal}>{ex.caloriesBurned || 0} cal</Text>
                      </View>
                    ))}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { ...typography.body, color: colors.text.secondary, marginTop: spacing.md },
  header: {
    backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backButton: { padding: spacing.xs },
  backText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  newPlanBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.sm,
  },
  newPlanText: { ...typography.bodySmall, color: colors.text.inverse, fontWeight: '600' },
  content: { flex: 1, padding: spacing.lg },
  planSummary: { marginBottom: spacing.md },
  planName: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  badgeText: { ...typography.bodySmall, fontWeight: '600' },
  progressCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.lg, ...shadows.sm,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressTitle: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  progressPercent: { ...typography.body, fontWeight: '700', color: colors.primary },
  progressBarBg: { height: 10, backgroundColor: colors.primary + '20', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.success, borderRadius: 5 },
  quoteCard: {
    backgroundColor: colors.primary + '10', borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '30',
  },
  quoteEmoji: { fontSize: 32, marginBottom: spacing.sm },
  quoteText: { ...typography.body, color: colors.text.primary, textAlign: 'center', fontStyle: 'italic', marginBottom: spacing.xs },
  quoteLabel: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
  sectionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md, marginTop: spacing.sm },
  restDayCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl,
    alignItems: 'center', ...shadows.sm,
  },
  restDayIcon: { fontSize: 48, marginBottom: spacing.md },
  restDayText: { ...typography.body, color: colors.text.secondary },
  todayStats: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.md, ...shadows.sm,
  },
  todayStat: { flex: 1, alignItems: 'center' },
  todayStatVal: { ...typography.h3, color: colors.primary },
  todayStatLabel: { ...typography.caption, color: colors.text.secondary },
  exerciseCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.sm, ...shadows.sm,
  },
  exerciseCardDone: { opacity: 0.6, borderLeftWidth: 3, borderLeftColor: colors.success },
  exerciseRow: { flexDirection: 'row', alignItems: 'center' },
  exerciseIcon: { fontSize: 24, marginRight: spacing.sm },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  exerciseNameDone: { textDecorationLine: 'line-through', color: colors.text.secondary },
  exerciseDetail: { ...typography.caption, color: colors.text.secondary },
  exerciseCal: { ...typography.bodySmall, color: colors.warning, fontWeight: '600' },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.primary + '10', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  completeBtnText: { ...typography.body, color: colors.primary, fontWeight: '600', flex: 1 },
  completedRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.success + '12', borderRadius: borderRadius.md,
  },
  checkboxChecked: {
    width: 24, height: 24, borderRadius: 6, backgroundColor: colors.success,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  checkMark: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  completedText: { ...typography.body, color: colors.success, fontWeight: '600', flex: 1 },
  undoHint: { ...typography.caption, color: colors.text.light, fontStyle: 'italic' },
  weekDayRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md,
    marginBottom: spacing.xs, ...shadows.sm,
  },
  weekDayRowToday: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  weekDayLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expandIcon: { fontSize: 10, color: colors.text.secondary, marginRight: spacing.sm, width: 14 },
  weekDayName: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  weekDayNameToday: { color: colors.primary },
  weekDayExercises: { ...typography.caption, color: colors.text.secondary },
  expandedExercises: {
    backgroundColor: colors.surface, marginBottom: spacing.sm, marginLeft: spacing.md,
    borderLeftWidth: 2, borderLeftColor: colors.primary + '40', paddingLeft: spacing.sm,
    borderBottomLeftRadius: borderRadius.md, borderBottomRightRadius: borderRadius.md,
  },
  expandedExRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border + '40',
  },
  expandedExIcon: { fontSize: 16, marginRight: spacing.sm },
  expandedExInfo: { flex: 1 },
  expandedExName: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary },
  expandedExDetail: { ...typography.caption, color: colors.text.secondary },
  expandedExCal: { ...typography.caption, color: colors.warning, fontWeight: '600' },
});

export default MyWorkoutScreen;

