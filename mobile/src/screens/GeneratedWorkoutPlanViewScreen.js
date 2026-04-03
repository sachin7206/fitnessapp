import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Modal, TextInput, Share, Vibration,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import workoutService from '../services/workoutService';
import { useTranslation } from '../i18n';

const formatLabel = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const MUSCLE_ICONS = {
  'CHEST': '🫁', 'BACK': '🏋️‍♂️', 'LEGS': '🦵', 'SHOULDERS': '💪',
  'ARMS': '💪', 'FULL_BODY': '🏋️', 'CARDIO': '❤️', 'CORE': '🎯',
};

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

// Numeric input filters
const filterInteger = (val) => val.replace(/[^0-9]/g, '');
const filterDecimal = (val) => {
  const cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
};

const GeneratedWorkoutPlanViewScreen = ({ navigation, route }) => {
  const { plan: initialPlan, exerciseTime } = route.params || {};
  const { t } = useTranslation();

  // Plan state (mutable for substitutions & edits)
  const [plan, setPlan] = useState(initialPlan);
  const [assigning, setAssigning] = useState(false);

  // Motivational quote
  const [quote, setQuote] = useState('');

  // Expanded days
  const [expandedDays, setExpandedDays] = useState({});

  // Exercise detail expand (per exercise)
  const [expandedExercises, setExpandedExercises] = useState({});

  // Substitution modal
  const [showSubModal, setShowSubModal] = useState(false);
  const [subExercise, setSubExercise] = useState(null);
  const [subDay, setSubDay] = useState(null);
  const [subIndex, setSubIndex] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [subResults, setSubResults] = useState([]);
  const [subReason, setSubReason] = useState('');

  // Edit exercise modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editExercise, setEditExercise] = useState(null);
  const [editDay, setEditDay] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [editSets, setEditSets] = useState('3');
  const [editReps, setEditReps] = useState('12');
  const [editWeight, setEditWeight] = useState('');
  const [editRestSeconds, setEditRestSeconds] = useState('60');
  const [editDurationMinutes, setEditDurationMinutes] = useState('20');
  const [editIsCardio, setEditIsCardio] = useState(false);

  // Rest timer state
  const [restTimer, setRestTimer] = useState({ active: false, seconds: 0, total: 0, exerciseName: '' });
  const restTimerRef = useRef(null);

  // Fetch motivational quote on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await workoutService.getMotivationalQuote();
        setQuote(data?.quote || '');
      } catch (e) { /* ignore */ }
    })();
  }, []);

  // Cleanup rest timer
  useEffect(() => {
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, []);

  // ---- Rest Timer ----
  const startRestTimer = (seconds, exerciseName) => {
    const safe = Math.min(600, Math.max(1, Math.round(seconds)));
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestTimer({ active: true, seconds: safe, total: safe, exerciseName });
    restTimerRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev.seconds <= 1) {
          clearInterval(restTimerRef.current);
          restTimerRef.current = null;
          try { Vibration.vibrate([0, 500, 200, 500]); } catch (e) {}
          return { ...prev, seconds: 0, active: false };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
  };

  const cancelRestTimer = () => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = null;
    setRestTimer({ active: false, seconds: 0, total: 0, exerciseName: '' });
  };

  // ---- No Plan Guard ----
  if (!plan) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>No Plan</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>No plan data available</Text>
        </View>
      </View>
    );
  }

  // ---- Computed Data ----
  const exercises = plan.exercises || [];

  // Group exercises by day
  const exercisesByDay = {};
  exercises.forEach(ex => {
    const day = ex.dayOfWeek || 'MONDAY';
    if (!exercisesByDay[day]) exercisesByDay[day] = [];
    exercisesByDay[day].push(ex);
  });

  // Include rest days in the schedule
  const workoutDays = new Set(Object.keys(exercisesByDay));
  const restDays = DAY_ORDER.filter(d => !workoutDays.has(d));

  const totalCalories = exercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
  const sortedDays = Object.keys(exercisesByDay).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  const avgCalPerSession = sortedDays.length > 0 ? Math.round(totalCalories / sortedDays.length) : 0;
  const maxDayCal = Math.max(...sortedDays.map(d => exercisesByDay[d].reduce((s, e) => s + (e.caloriesBurned || 0), 0)), 1);

  const totalSets = exercises.filter(e => !e.isCardio).reduce((s, e) => s + (e.sets || 0), 0);
  const totalDurationMins = exercises.reduce((s, e) => {
    if (e.isCardio) return s + Math.round((e.durationSeconds || 0) / 60);
    return s + ((e.sets || 3) * (e.reps || 12) * 3 + (e.sets || 3) * (e.restTimeSeconds || 60)) / 60;
  }, 0);

  // ---- Assign Plan ----
  const handleAssign = async () => {
    setAssigning(true);
    try {
      await workoutService.assignWorkoutPlan(plan.id);
      const msg = 'Your workout plan has been assigned! Let\'s crush it! 💪';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Plan Assigned! 🎉', msg);
      }
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }, { name: 'MyWorkout' }] });
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to assign plan';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setAssigning(false);
    }
  };

  // ---- Discard Plan ----
  const handleDiscard = () => {
    const doDiscard = () => navigation.goBack();
    if (Platform.OS === 'web') {
      if (window.confirm('Discard this plan and go back?')) doDiscard();
    } else {
      Alert.alert('Discard Plan?', 'This generated plan will be lost. You can always generate a new one.', [
        { text: 'Keep', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: doDiscard },
      ]);
    }
  };

  // ---- Regenerate Plan ----
  const handleRegenerate = () => {
    const doRegen = () => {
      navigation.replace('WorkoutSetup');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Go back to setup and generate a new plan?')) doRegen();
    } else {
      Alert.alert('Regenerate Plan? 🔄', 'Go back to workout setup to create a fresh plan with updated preferences.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', onPress: doRegen },
      ]);
    }
  };

  // ---- Share Plan ----
  const handleShare = async () => {
    try {
      let shareText = `🏋️ ${plan.planName}\n`;
      shareText += `Goal: ${formatLabel(plan.goal)} • ${formatLabel(plan.difficulty)}\n`;
      shareText += `${plan.daysPerWeek} days/week • ${plan.durationWeeks} weeks\n\n`;

      sortedDays.forEach(day => {
        const dayExercises = exercisesByDay[day];
        shareText += `📅 ${formatLabel(day)}\n`;
        dayExercises.forEach(ex => {
          if (ex.isCardio) {
            shareText += `  ❤️ ${ex.exerciseName} - ${Math.round((ex.durationSeconds || 0) / 60)} min\n`;
          } else {
            shareText += `  💪 ${ex.exerciseName} - ${ex.sets}×${ex.reps}\n`;
          }
        });
        shareText += '\n';
      });

      shareText += `Total: ${exercises.length} exercises • ~${totalCalories} cal/week\n`;
      shareText += '\nGenerated by FitnessApp 🚀';

      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          window.alert('Plan copied to clipboard!');
        }
      } else {
        await Share.share({
          message: shareText,
          title: plan.planName,
        });
      }
    } catch (e) { /* user cancelled */ }
  };

  // ---- Exercise Substitution ----
  const openSubstitution = (exercise, day, index) => {
    setSubExercise(exercise);
    setSubDay(day);
    setSubIndex(index);
    setSubResults([]);
    setSubReason('');
    setShowSubModal(true);
  };

  const fetchSubstitutes = async () => {
    if (!subExercise) return;
    setSubLoading(true);
    try {
      const request = {
        exerciseName: subExercise.exerciseName,
        muscleGroup: subExercise.muscleGroup || 'FULL_BODY',
        reason: subReason || 'preference',
      };
      const response = await workoutService.suggestExerciseSubstitutes(request);
      setSubResults(response?.alternatives || response || []);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to get substitutes';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setSubLoading(false);
    }
  };

  const applySubstitution = (substitute) => {
    // Replace exercise in local plan state
    const updatedExercises = [...(plan.exercises || [])];
    const dayExercises = updatedExercises.filter(e => e.dayOfWeek === subDay);
    if (dayExercises[subIndex]) {
      const targetEx = dayExercises[subIndex];
      const globalIdx = updatedExercises.indexOf(targetEx);
      if (globalIdx !== -1) {
        updatedExercises[globalIdx] = {
          ...targetEx,
          exerciseName: substitute.exerciseName || substitute.name || substitute,
          muscleGroup: substitute.muscleGroup || targetEx.muscleGroup,
          sets: substitute.sets || targetEx.sets,
          reps: substitute.reps || targetEx.reps,
          caloriesBurned: substitute.caloriesBurned || targetEx.caloriesBurned,
        };
        setPlan({ ...plan, exercises: updatedExercises });
      }
    }
    setShowSubModal(false);
    const msg = `Swapped to ${substitute.exerciseName || substitute.name || substitute}!`;
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Substituted! ✅', msg);
  };

  // ---- Edit Exercise ----
  const openEditExercise = (exercise, day, index) => {
    setEditExercise(exercise);
    setEditDay(day);
    setEditIndex(index);
    setEditIsCardio(exercise.isCardio || false);

    if (exercise.isCardio) {
      setEditDurationMinutes(String(Math.round((exercise.durationSeconds || 0) / 60) || 20));
    } else {
      setEditSets(String(exercise.sets || 3));
      setEditReps(String(exercise.reps || 12));
      setEditWeight(exercise.weight ? String(exercise.weight) : '');
      setEditRestSeconds(String(exercise.restTimeSeconds || 60));
    }
    setShowEditModal(true);
  };

  const saveEditExercise = () => {
    if (!editExercise) return;

    // Validate
    if (editIsCardio) {
      const dur = parseInt(editDurationMinutes) || 0;
      if (dur < 1 || dur > 1440) {
        const msg = 'Duration must be between 1 and 1440 minutes';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Input', msg);
        return;
      }
    } else {
      const sets = parseInt(editSets) || 0;
      const reps = parseInt(editReps) || 0;
      if (sets < 1 || sets > 50) {
        const msg = 'Sets must be between 1 and 50';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Input', msg);
        return;
      }
      if (reps < 1 || reps > 500) {
        const msg = 'Reps must be between 1 and 500';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Input', msg);
        return;
      }
      const w = editWeight ? parseFloat(editWeight) : null;
      if (w !== null && (w < 0 || w > 1000)) {
        const msg = 'Weight must be between 0 and 1000 kg';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Input', msg);
        return;
      }
      const rest = parseInt(editRestSeconds) || 0;
      if (rest < 0 || rest > 600) {
        const msg = 'Rest time must be between 0 and 600 seconds';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Input', msg);
        return;
      }
    }

    // Update local plan state
    const updatedExercises = [...(plan.exercises || [])];
    const dayExercises = updatedExercises.filter(e => e.dayOfWeek === editDay);
    if (dayExercises[editIndex]) {
      const targetEx = dayExercises[editIndex];
      const globalIdx = updatedExercises.indexOf(targetEx);
      if (globalIdx !== -1) {
        if (editIsCardio) {
          updatedExercises[globalIdx] = {
            ...targetEx,
            durationSeconds: (parseInt(editDurationMinutes) || 20) * 60,
          };
        } else {
          updatedExercises[globalIdx] = {
            ...targetEx,
            sets: parseInt(editSets) || targetEx.sets,
            reps: parseInt(editReps) || targetEx.reps,
            weight: editWeight ? parseFloat(editWeight) : targetEx.weight,
            restTimeSeconds: parseInt(editRestSeconds) || targetEx.restTimeSeconds,
          };
        }
        setPlan({ ...plan, exercises: updatedExercises });
      }
    }
    setShowEditModal(false);
  };

  // ---- Toggle Exercise Detail ----
  const toggleExerciseDetail = (day, index) => {
    const key = `${day}-${index}`;
    setExpandedExercises(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ---- Render ----
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Workout Plan</Text>
        <TouchableOpacity onPress={handleRegenerate} style={styles.regenBtn}>
          <Text style={styles.regenBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Motivational Quote */}
        {quote ? (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteEmoji}>🔥</Text>
            <Text style={styles.quoteText}>{quote}</Text>
          </View>
        ) : null}

        {/* Plan Overview */}
        <View style={styles.overview}>
          <Text style={styles.planName}>{plan.planName}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.badgeText}>🏋️ {formatLabel(plan.exerciseType)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
              <Text style={styles.badgeText}>🎯 {formatLabel(plan.goal)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.badgeText}>📅 {plan.daysPerWeek} days/week</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.badgeText}>⏱ {exerciseTime || plan.exerciseTime || '6:00 AM'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{plan.durationWeeks}</Text>
            <Text style={styles.statLabel}>Weeks</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{avgCalPerSession}</Text>
            <Text style={styles.statLabel}>Cal/Session</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{exercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatLabel(plan.difficulty)}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Extended Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalCalories}</Text>
            <Text style={styles.statLabel}>Cal/Week</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>~{Math.round(totalDurationMins)}</Text>
            <Text style={styles.statLabel}>Min/Week</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{restDays.length}</Text>
            <Text style={styles.statLabel}>Rest Days</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={handleShare}>
            <Text style={styles.quickActionIcon}>📤</Text>
            <Text style={styles.quickActionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={handleRegenerate}>
            <Text style={styles.quickActionIcon}>🔄</Text>
            <Text style={styles.quickActionLabel}>Regenerate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('ReportGenerator')}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionLabel}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('ExerciseProgress')}>
            <Text style={styles.quickActionIcon}>📈</Text>
            <Text style={styles.quickActionLabel}>Progress</Text>
          </TouchableOpacity>
        </View>

        {/* Cardio Summary */}
        {plan.cardioCalories > 0 && (
          <View style={styles.cardioSummary}>
            <Text style={styles.cardioTitle}>❤️ Cardio Included</Text>
            <Text style={styles.cardioDetail}>
              {formatLabel(plan.cardioType)} • {plan.cardioDurationMinutes} min
              {plan.cardioSteps > 0 ? ` • ${plan.cardioSteps} steps` : ''}
              {' • ~'}{plan.cardioCalories} cal burned
            </Text>
          </View>
        )}

        {/* Calorie Breakdown Chart */}
        <Text style={styles.sectionTitle}>Daily Calorie Breakdown</Text>
        <View style={styles.calorieChart}>
          {sortedDays.map(day => {
            const dayCal = exercisesByDay[day].reduce((s, e) => s + (e.caloriesBurned || 0), 0);
            const barWidth = maxDayCal > 0 ? Math.max(10, (dayCal / maxDayCal) * 100) : 10;
            return (
              <View key={day} style={styles.calorieBarRow}>
                <Text style={styles.calorieBarLabel}>{day.substring(0, 3)}</Text>
                <View style={styles.calorieBarBg}>
                  <View style={[styles.calorieBarFill, { width: `${barWidth}%` }]} />
                </View>
                <Text style={styles.calorieBarValue}>{dayCal}</Text>
              </View>
            );
          })}
        </View>

        {/* Weekly Schedule */}
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>

        {DAY_ORDER.map(day => {
          const dayExercises = exercisesByDay[day];
          const isRestDay = !dayExercises || dayExercises.length === 0;
          const isExpanded = expandedDays[day] || false;
          const dayCalories = isRestDay ? 0 : dayExercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);

          return (
            <View key={day}>
              <TouchableOpacity
                style={[styles.dayCard, isRestDay && styles.restDayCardStyle]}
                onPress={() => {
                  if (!isRestDay) {
                    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
                  }
                }}
                activeOpacity={isRestDay ? 1 : 0.7}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayHeaderLeft}>
                    {!isRestDay && (
                      <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                    )}
                    <Text style={[styles.dayName, isRestDay && styles.restDayName]}>
                      {formatLabel(day)}
                    </Text>
                  </View>
                  {isRestDay ? (
                    <Text style={styles.restDayBadge}>😴 Rest Day</Text>
                  ) : (
                    <View style={styles.dayMeta}>
                      <Text style={styles.dayExCount}>{dayExercises.length} exercises</Text>
                      <Text style={styles.dayCal}>~{dayCalories} cal</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Expanded Exercise List */}
              {isExpanded && !isRestDay && (
                <View style={styles.expandedContainer}>
                  {dayExercises
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((ex, idx) => {
                      const exKey = `${day}-${idx}`;
                      const isDetailExpanded = expandedExercises[exKey] || false;

                      return (
                        <View key={idx} style={styles.exerciseCard}>
                          <TouchableOpacity
                            style={styles.exerciseRow}
                            onPress={() => toggleExerciseDetail(day, idx)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.exerciseIcon}>
                              {ex.isCardio ? '❤️' : (MUSCLE_ICONS[ex.muscleGroup] || '💪')}
                            </Text>
                            <View style={styles.exerciseInfo}>
                              <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                              <Text style={styles.exerciseDetail}>
                                {ex.isCardio
                                  ? `${Math.round((ex.durationSeconds || 0) / 60)} min${ex.steps > 0 ? ` • ${ex.steps} steps` : ''}`
                                  : `${ex.sets} sets × ${ex.reps} reps${ex.weight ? ` • ${ex.weight} kg` : ''} • Rest ${ex.restTimeSeconds}s`}
                              </Text>
                              {ex.muscleGroup && !ex.isCardio && (
                                <Text style={styles.exerciseMuscle}>{formatLabel(ex.muscleGroup)}</Text>
                              )}
                            </View>
                            <Text style={styles.exerciseCal}>{ex.caloriesBurned || 0} cal</Text>
                          </TouchableOpacity>

                          {/* Expanded Exercise Details */}
                          {isDetailExpanded && (
                            <View style={styles.exerciseExpanded}>
                              {/* Detail breakdown */}
                              {!ex.isCardio ? (
                                <View style={styles.detailGrid}>
                                  <View style={styles.detailItem}>
                                    <Text style={styles.detailValue}>{ex.sets}</Text>
                                    <Text style={styles.detailLabel}>Sets</Text>
                                  </View>
                                  <View style={styles.detailItem}>
                                    <Text style={styles.detailValue}>{ex.reps}</Text>
                                    <Text style={styles.detailLabel}>Reps</Text>
                                  </View>
                                  <View style={styles.detailItem}>
                                    <Text style={styles.detailValue}>{ex.weight || '-'}</Text>
                                    <Text style={styles.detailLabel}>kg</Text>
                                  </View>
                                  <View style={styles.detailItem}>
                                    <Text style={styles.detailValue}>{ex.restTimeSeconds}s</Text>
                                    <Text style={styles.detailLabel}>Rest</Text>
                                  </View>
                                </View>
                              ) : (
                                <View style={styles.detailGrid}>
                                  <View style={styles.detailItem}>
                                    <Text style={styles.detailValue}>{Math.round((ex.durationSeconds || 0) / 60)}</Text>
                                    <Text style={styles.detailLabel}>Minutes</Text>
                                  </View>
                                  <View style={styles.detailItem}>
                                    <Text style={styles.detailValue}>{ex.steps || '-'}</Text>
                                    <Text style={styles.detailLabel}>Steps</Text>
                                  </View>
                                  <View style={styles.detailItem}>
                                    <Text style={styles.detailValue}>{ex.caloriesBurned || 0}</Text>
                                    <Text style={styles.detailLabel}>Calories</Text>
                                  </View>
                                </View>
                              )}

                              {/* Estimated workout time per exercise */}
                              {!ex.isCardio && (
                                <Text style={styles.estTime}>
                                  ⏱ Est. time: ~{Math.round(((ex.sets || 3) * (ex.reps || 12) * 3 + (ex.sets || 3) * (ex.restTimeSeconds || 60)) / 60)} min
                                </Text>
                              )}

                              {/* Action buttons */}
                              <View style={styles.exerciseActions}>
                                {/* Rest Timer */}
                                {!ex.isCardio && ex.restTimeSeconds > 0 && (
                                  <TouchableOpacity
                                    style={styles.actionChip}
                                    onPress={() => startRestTimer(ex.restTimeSeconds, ex.exerciseName)}
                                  >
                                    <Text style={styles.actionChipText}>⏱ Rest Timer ({ex.restTimeSeconds}s)</Text>
                                  </TouchableOpacity>
                                )}

                                {/* Edit */}
                                <TouchableOpacity
                                  style={styles.actionChip}
                                  onPress={() => openEditExercise(ex, day, idx)}
                                >
                                  <Text style={styles.actionChipText}>✏️ Edit</Text>
                                </TouchableOpacity>

                                {/* Substitute */}
                                <TouchableOpacity
                                  style={[styles.actionChip, { borderColor: colors.warning + '60' }]}
                                  onPress={() => openSubstitution(ex, day, idx)}
                                >
                                  <Text style={[styles.actionChipText, { color: colors.warning }]}>🔄 Swap</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                </View>
              )}
            </View>
          );
        })}

        {/* Rest Days Info */}
        {restDays.length > 0 && (
          <View style={styles.restDayInfo}>
            <Text style={styles.restDayInfoTitle}>😴 Rest Days</Text>
            <Text style={styles.restDayInfoText}>
              {restDays.map(d => formatLabel(d)).join(', ')}
            </Text>
            <Text style={styles.restDayInfoHint}>
              Rest days are essential for muscle recovery and growth. Use them for light stretching or mobility work.
            </Text>
          </View>
        )}

        {/* Plan Tips */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Tips for Success</Text>
          <Text style={styles.tipText}>• Tap any exercise to view details, edit, or swap it</Text>
          <Text style={styles.tipText}>• Use the rest timer during your workout</Text>
          <Text style={styles.tipText}>• Share your plan with a workout buddy</Text>
          <Text style={styles.tipText}>• Assign the plan when you're ready to start!</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
          <Text style={styles.discardBtnText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.assignBtn} onPress={handleAssign} disabled={assigning}>
          {assigning ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.assignBtnText}>🚀 Assign Plan ({plan.durationWeeks} weeks)</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ===== MODALS ===== */}

      {/* Exercise Substitution Modal */}
      <Modal visible={showSubModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>🔄 Swap Exercise</Text>

              {subExercise && (
                <View style={styles.modalExHeader}>
                  <Text style={styles.modalExName}>
                    {MUSCLE_ICONS[subExercise.muscleGroup] || '💪'} {subExercise.exerciseName}
                  </Text>
                  <Text style={styles.modalExDetail}>
                    {subExercise.muscleGroup ? formatLabel(subExercise.muscleGroup) : ''} •{' '}
                    {subExercise.sets}×{subExercise.reps}
                  </Text>
                </View>
              )}

              {/* Reason input */}
              <Text style={styles.modalLabel}>Reason for swap (optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={subReason}
                onChangeText={setSubReason}
                placeholder="e.g., injury, no equipment, preference"
                placeholderTextColor={colors.text.light}
              />

              {/* Find substitutes */}
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, subLoading && { opacity: 0.6 }]}
                onPress={fetchSubstitutes}
                disabled={subLoading}
              >
                {subLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalPrimaryBtnText}>🤖 Find AI Alternatives</Text>
                )}
              </TouchableOpacity>

              {/* Results */}
              {subResults.length > 0 && (
                <View style={styles.subResultsContainer}>
                  <Text style={styles.modalLabel}>Choose a replacement:</Text>
                  {subResults.map((sub, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.subResultItem}
                      onPress={() => applySubstitution(sub)}
                    >
                      <View style={styles.subResultInfo}>
                        <Text style={styles.subResultName}>
                          {sub.exerciseName || sub.name || sub}
                        </Text>
                        {sub.muscleGroup && (
                          <Text style={styles.subResultMuscle}>{formatLabel(sub.muscleGroup)}</Text>
                        )}
                        {sub.reason && (
                          <Text style={styles.subResultReason}>{sub.reason}</Text>
                        )}
                      </View>
                      <Text style={styles.subResultArrow}>→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSubModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Exercise Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>✏️ Edit Exercise</Text>

              {editExercise && (
                <View style={styles.modalExHeader}>
                  <Text style={styles.modalExName}>
                    {editExercise.isCardio ? '❤️' : (MUSCLE_ICONS[editExercise.muscleGroup] || '💪')}{' '}
                    {editExercise.exerciseName}
                  </Text>
                  <Text style={styles.modalExDetail}>
                    {editExercise.isCardio
                      ? `Current: ${Math.round((editExercise.durationSeconds || 0) / 60)} minutes`
                      : `Current: ${editExercise.sets} sets × ${editExercise.reps} reps${editExercise.weight ? ` • ${editExercise.weight} kg` : ''}`}
                  </Text>
                </View>
              )}

              {editIsCardio ? (
                <View style={styles.editFieldRow}>
                  <Text style={styles.editFieldLabel}>Duration (minutes)</Text>
                  <TextInput
                    style={styles.editFieldInput}
                    value={editDurationMinutes}
                    onChangeText={v => setEditDurationMinutes(filterInteger(v))}
                    keyboardType="numeric"
                    placeholder="20"
                  />
                </View>
              ) : (
                <>
                  <View style={styles.editFieldRow}>
                    <Text style={styles.editFieldLabel}>Sets</Text>
                    <TextInput
                      style={styles.editFieldInput}
                      value={editSets}
                      onChangeText={v => setEditSets(filterInteger(v))}
                      keyboardType="numeric"
                      placeholder="3"
                    />
                  </View>
                  <View style={styles.editFieldRow}>
                    <Text style={styles.editFieldLabel}>Reps per Set</Text>
                    <TextInput
                      style={styles.editFieldInput}
                      value={editReps}
                      onChangeText={v => setEditReps(filterInteger(v))}
                      keyboardType="numeric"
                      placeholder="12"
                    />
                  </View>
                  <View style={styles.editFieldRow}>
                    <Text style={styles.editFieldLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.editFieldInput}
                      value={editWeight}
                      onChangeText={v => setEditWeight(filterDecimal(v))}
                      keyboardType="numeric"
                      placeholder="Optional"
                    />
                  </View>
                  <View style={styles.editFieldRow}>
                    <Text style={styles.editFieldLabel}>Rest Between Sets (seconds)</Text>
                    <TextInput
                      style={styles.editFieldInput}
                      value={editRestSeconds}
                      onChangeText={v => setEditRestSeconds(filterInteger(v))}
                      keyboardType="numeric"
                      placeholder="60"
                    />
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={saveEditExercise}>
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rest Timer Overlay */}
      {(restTimer.active || (restTimer.seconds === 0 && restTimer.total > 0)) && (
        <Modal transparent animationType="fade" visible={restTimer.active || (restTimer.seconds === 0 && restTimer.total > 0)}>
          <View style={styles.timerOverlay}>
            <View style={styles.timerCard}>
              <Text style={styles.timerEmoji}>{restTimer.seconds === 0 ? '✅' : '⏱'}</Text>
              <Text style={styles.timerExName}>{restTimer.exerciseName}</Text>
              <Text style={styles.timerCountdown}>
                {restTimer.seconds === 0
                  ? "Time's Up!"
                  : `${Math.floor(restTimer.seconds / 60)}:${String(restTimer.seconds % 60).padStart(2, '0')}`}
              </Text>
              <View style={styles.timerProgressBg}>
                <View style={[styles.timerProgressFill, {
                  width: restTimer.total > 0 ? `${((restTimer.total - restTimer.seconds) / restTimer.total) * 100}%` : '0%',
                  backgroundColor: restTimer.seconds === 0 ? colors.success : colors.primary,
                }]} />
              </View>
              <TouchableOpacity style={styles.timerCancelBtn} onPress={cancelRestTimer}>
                <Text style={styles.timerCancelText}>{restTimer.seconds === 0 ? 'Done' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...typography.body, color: colors.text.secondary },

  // Header
  header: {
    backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  regenBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', width: 40, height: 40,
    borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  regenBtnText: { fontSize: 20 },

  content: { flex: 1, padding: spacing.lg },

  // Quote
  quoteCard: {
    backgroundColor: colors.primary + '10', borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '30',
    flexDirection: 'row',
  },
  quoteEmoji: { fontSize: 24, marginRight: spacing.sm },
  quoteText: { ...typography.bodySmall, color: colors.text.primary, fontStyle: 'italic', flex: 1 },

  // Overview
  overview: { marginBottom: spacing.lg },
  planName: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  badgeText: { ...typography.bodySmall, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.text.secondary },

  // Quick Actions
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-around', marginVertical: spacing.md,
  },
  quickActionBtn: {
    alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md, ...shadows.sm, minWidth: 72,
  },
  quickActionIcon: { fontSize: 24, marginBottom: 4 },
  quickActionLabel: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },

  // Cardio Summary
  cardioSummary: {
    backgroundColor: '#FEF2F2', borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: '#374151',
  },
  cardioTitle: { ...typography.body, fontWeight: '700', color: '#374151', marginBottom: 4 },
  cardioDetail: { ...typography.bodySmall, color: colors.text.secondary },

  // Calorie Chart
  calorieChart: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.lg, ...shadows.sm,
  },
  calorieBarRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs,
  },
  calorieBarLabel: {
    ...typography.caption, fontWeight: '700', color: colors.text.secondary, width: 36,
  },
  calorieBarBg: {
    flex: 1, height: 16, backgroundColor: colors.primary + '15',
    borderRadius: 8, overflow: 'hidden', marginHorizontal: spacing.sm,
  },
  calorieBarFill: {
    height: '100%', backgroundColor: colors.primary, borderRadius: 8,
  },
  calorieBarValue: {
    ...typography.caption, fontWeight: '700', color: colors.warning, width: 36, textAlign: 'right',
  },

  // Section Title
  sectionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },

  // Day Card (collapsible header)
  dayCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.xs, ...shadows.sm,
  },
  restDayCardStyle: { opacity: 0.7 },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expandIcon: { fontSize: 10, color: colors.text.secondary, marginRight: spacing.sm, width: 14 },
  dayName: { ...typography.h3, color: colors.primary },
  restDayName: { color: colors.text.secondary },
  dayMeta: { alignItems: 'flex-end' },
  dayExCount: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  dayCal: { ...typography.caption, color: colors.warning, fontWeight: '600' },
  restDayBadge: { ...typography.bodySmall, color: colors.text.light },

  // Expanded Exercise Container
  expandedContainer: {
    marginBottom: spacing.sm, marginLeft: spacing.sm,
    borderLeftWidth: 2, borderLeftColor: colors.primary + '40', paddingLeft: spacing.sm,
  },

  // Exercise Card
  exerciseCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.sm, ...shadows.sm,
  },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  exerciseIcon: { fontSize: 20, marginRight: spacing.sm },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  exerciseDetail: { ...typography.caption, color: colors.text.secondary },
  exerciseMuscle: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  exerciseCal: { ...typography.bodySmall, color: colors.warning, fontWeight: '600' },

  // Exercise Expanded Details
  exerciseExpanded: {
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  detailGrid: {
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm,
  },
  detailItem: { alignItems: 'center' },
  detailValue: { ...typography.h3, color: colors.primary },
  detailLabel: { ...typography.caption, color: colors.text.secondary },
  estTime: { ...typography.caption, color: colors.text.light, fontStyle: 'italic', marginBottom: spacing.sm },
  exerciseActions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  actionChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.primary + '30',
    backgroundColor: colors.primary + '08',
  },
  actionChipText: { fontSize: 12, color: colors.primary, fontWeight: '700' },

  // Rest Day Info
  restDayInfo: {
    backgroundColor: '#F0FDF4', borderRadius: borderRadius.lg, padding: spacing.md,
    marginTop: spacing.md, marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.success,
  },
  restDayInfoTitle: { ...typography.body, fontWeight: '700', color: colors.success, marginBottom: 4 },
  restDayInfoText: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '600', marginBottom: 4 },
  restDayInfoHint: { ...typography.caption, color: colors.text.secondary, fontStyle: 'italic' },

  // Tips
  tipCard: {
    backgroundColor: colors.primary + '08', borderRadius: borderRadius.lg, padding: spacing.md,
    marginTop: spacing.sm, borderWidth: 1, borderColor: colors.primary + '20',
  },
  tipTitle: { ...typography.body, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  tipText: { ...typography.caption, color: colors.text.secondary, lineHeight: 20 },

  // Footer
  footer: {
    padding: spacing.lg, backgroundColor: colors.surface, ...shadows.lg,
    flexDirection: 'row', gap: spacing.sm,
  },
  discardBtn: {
    backgroundColor: colors.error + '15', width: 50, height: 50, borderRadius: borderRadius.lg,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.error + '30',
  },
  discardBtnText: { fontSize: 18, color: colors.error, fontWeight: '700' },
  assignBtn: {
    flex: 1, backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  assignBtnText: { ...typography.h3, color: colors.text.inverse },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, maxHeight: '85%',
  },
  modalTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },
  modalExHeader: { marginBottom: spacing.lg },
  modalExName: { ...typography.h3, color: colors.text.primary },
  modalExDetail: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 4 },
  modalLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.xs },
  modalInput: {
    backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md,
    ...typography.body, color: colors.text.primary, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  modalPrimaryBtn: {
    backgroundColor: colors.primary, padding: spacing.md, borderRadius: borderRadius.lg,
    alignItems: 'center', marginBottom: spacing.lg,
  },
  modalPrimaryBtnText: { ...typography.body, color: colors.text.inverse, fontWeight: '700' },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  modalCancel: {
    flex: 1, padding: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.background, alignItems: 'center',
  },
  modalCancelText: { ...typography.body, color: colors.text.secondary, fontWeight: '600' },
  modalSave: {
    flex: 1, padding: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  modalSaveText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },

  // Substitution Results
  subResultsContainer: { marginTop: spacing.sm },
  subResultItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background,
    borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  subResultInfo: { flex: 1 },
  subResultName: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  subResultMuscle: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  subResultReason: { ...typography.caption, color: colors.text.secondary, fontStyle: 'italic', marginTop: 2 },
  subResultArrow: { fontSize: 20, color: colors.primary, fontWeight: '600' },

  // Edit Fields
  editFieldRow: {
    backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.sm,
  },
  editFieldLabel: { ...typography.bodySmall, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  editFieldInput: {
    backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.sm,
    ...typography.body, color: colors.text.primary, borderWidth: 1, borderColor: colors.border,
    textAlign: 'center',
  },

  // Rest Timer Overlay
  timerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
  },
  timerCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xl,
    alignItems: 'center', width: 280, ...shadows.lg,
  },
  timerEmoji: { fontSize: 48, marginBottom: spacing.sm },
  timerExName: { ...typography.body, color: colors.text.secondary, fontWeight: '600', marginBottom: spacing.sm },
  timerCountdown: { fontSize: 56, fontWeight: '800', color: colors.primary, marginVertical: spacing.md },
  timerProgressBg: {
    width: '100%', height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.lg,
  },
  timerProgressFill: { height: '100%', borderRadius: 4 },
  timerCancelBtn: {
    backgroundColor: colors.text.secondary + '20', paddingVertical: spacing.sm, paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  timerCancelText: { ...typography.body, color: colors.text.secondary, fontWeight: '600' },
});

export default GeneratedWorkoutPlanViewScreen;

