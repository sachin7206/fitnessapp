import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Platform, TextInput, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/core';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import workoutService from '../services/workoutService';

const formatLabel = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const MUSCLE_ICONS = {
  'CHEST': '🫁', 'BACK': '🏋️‍♂️', 'LEGS': '🦵', 'SHOULDERS': '💪',
  'ARMS': '💪', 'FULL_BODY': '🏋️', 'CARDIO': '❤️', 'CORE': '🎯',
};

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const getLocalDateString = () => new Date().toISOString().split('T')[0];

// Numeric input filters
const filterInteger = (val) => val.replace(/[^0-9]/g, '');
const filterDecimal = (val) => {
  const cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
};

const FreeWorkoutViewScreen = ({ navigation }) => {
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});
  const [now, setNow] = useState(new Date());

  // Exercise logging state
  const [exerciseLogs, setExerciseLogs] = useState({}); // { "2026-03-06": { "MONDAY": { 0: { sets: [{reps:12, weight:50},...] } } } }
  const [showLogModal, setShowLogModal] = useState(false);
  const [logExerciseIndex, setLogExerciseIndex] = useState(null);
  const [logDay, setLogDay] = useState(null);
  const [logSets, setLogSets] = useState([]);
  const [previousLog, setPreviousLog] = useState(null);
  const isInitialMount = useRef(true);

  // Edit exercise state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDay, setEditDay] = useState(null);
  const [editExerciseIndex, setEditExerciseIndex] = useState(null);
  const [editSets, setEditSets] = useState('3');
  const [editSetDetails, setEditSetDetails] = useState([]); // per-set [{reps, weight}]
  const [editRestSeconds, setEditRestSeconds] = useState('60');
  const [editPreviousLog, setEditPreviousLog] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editDurationMinutes, setEditDurationMinutes] = useState('20');
  const [editIsCardio, setEditIsCardio] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadExerciseLogs();
    fetchPlan();
  }, []);

  useFocusEffect(useCallback(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchPlan();
  }, []));

  const loadExerciseLogs = async () => {
    // Load from backend DB only
    try {
      const backendLogs = await workoutService.getCustomWorkoutLogs(90);
      if (backendLogs && backendLogs.length > 0) {
        const logData = {};
        backendLogs.forEach(log => {
          const date = log.logDate;
          if (!logData[date]) logData[date] = {};
          if (!logData[date][log.dayOfWeek]) logData[date][log.dayOfWeek] = {};
          try {
            const parsed = JSON.parse(log.setsData || '[]');
            logData[date][log.dayOfWeek][log.exerciseIndex] = parsed;
          } catch (e) { /* ignore */ }
        });
        setExerciseLogs(logData);
      }
    } catch (e) { /* ignore backend fetch failure */ }
  };

  const saveExerciseLogs = async (logs) => {
    // Sync to backend only
    try {
      const todayLogs = logs[getLocalDateString()] || {};
      const cleanedLogs = {};
      for (const [day, exercises] of Object.entries(todayLogs)) {
        cleanedLogs[day] = {};
        for (const [idx, entry] of Object.entries(exercises)) {
          if (entry.completedAt && entry.sets) {
            const { edits, type, ...cleanEntry } = entry;
            cleanedLogs[day][idx] = cleanEntry;
          }
        }
        if (Object.keys(cleanedLogs[day]).length === 0) delete cleanedLogs[day];
      }
      if (Object.keys(cleanedLogs).length > 0) {
        await workoutService.syncCustomWorkoutLog({
          date: getLocalDateString(),
          logs: cleanedLogs,
        });
      }
    } catch (e) { /* ignore if backend fails */ }
  };

  const fetchPlan = async () => {
    try {
      const response = await workoutService.getActiveWorkoutPlan();
      if (response) {
        setUserPlan(response);
        // Auto-expand today's exercises
        const todayDay = DAY_NAMES[new Date().getDay()];
        setExpandedDays(prev => ({ ...prev, [todayDay]: true }));
      }
    } catch (error) {
      console.log('Error fetching workout plan:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchPlan(); loadExerciseLogs(); };

  const todayDay = DAY_NAMES[now.getDay()];
  const allExercises = userPlan?.workoutPlan?.exercises || [];
  const isCustomPlan = userPlan?.workoutPlan?.planType === 'CUSTOM';
  const planRestDay = userPlan?.workoutPlan?.restDay || '';

  // Build cycle map: non-workout, non-rest days inherit exercises from workout days in order
  const ORDERED_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  const getWorkoutDaysFromPlan = () => {
    const daysWithExercises = new Set(allExercises.map(e => e.dayOfWeek));
    return ORDERED_DAYS.filter(d => daysWithExercises.has(d));
  };

  const getCycleDayMap = () => {
    const workoutDays = getWorkoutDaysFromPlan();
    if (workoutDays.length === 0 || workoutDays.length >= 7) return {};
    const cycleMap = {};
    let cycleIndex = 0;
    ORDERED_DAYS.forEach(day => {
      if (workoutDays.includes(day)) return;
      if (day === planRestDay) { cycleMap[day] = '__REST__'; return; }
      cycleMap[day] = workoutDays[cycleIndex % workoutDays.length];
      cycleIndex++;
    });
    return cycleMap;
  };

  const cycleDayMap = getCycleDayMap();

  const getExercisesForDay = (day) => {
    const directExercises = allExercises.filter(e => e.dayOfWeek === day);
    if (directExercises.length > 0) return { exercises: directExercises, sourceDay: null };
    const mappedDay = cycleDayMap[day];
    if (!mappedDay || mappedDay === '__REST__') return { exercises: [], sourceDay: null, isRest: mappedDay === '__REST__' };
    return { exercises: allExercises.filter(e => e.dayOfWeek === mappedDay), sourceDay: mappedDay };
  };

  const todayData = getExercisesForDay(todayDay);
  const todayExercises = todayData.exercises;

  // Find previous session log for a specific exercise
  const findPreviousLog = (day, exerciseIndex) => {
    const dates = Object.keys(exerciseLogs).sort().reverse();
    const today = getLocalDateString();
    for (const date of dates) {
      if (date === today) continue; // skip today
      const dayLogs = exerciseLogs[date]?.[day];
      if (dayLogs?.[exerciseIndex]) {
        return { date, log: dayLogs[exerciseIndex] };
      }
    }
    return null;
  };

  // Open log modal for an exercise
  const openLogModal = (day, exerciseIndex) => {
    const exercise = allExercises.filter(e => e.dayOfWeek === day)[exerciseIndex];
    if (!exercise) return;

    setLogDay(day);
    setLogExerciseIndex(exerciseIndex);

    // Check today's existing log
    const todayLog = exerciseLogs[getLocalDateString()]?.[day]?.[exerciseIndex];
    if (todayLog?.sets?.length > 0) {
      setLogSets(todayLog.sets.map(s => ({ reps: String(s.reps || ''), weight: String(s.weight || '') })));
    } else {
      // Pre-fill with expected sets/reps
      const numSets = exercise.sets || 3;
      setLogSets(
        Array.from({ length: numSets }, () => ({
          reps: String(exercise.reps || 12),
          weight: '',
        }))
      );
    }

    // Find previous session
    const prev = findPreviousLog(day, exerciseIndex);
    setPreviousLog(prev);

    setShowLogModal(true);
  };

  const updateSetLog = (setIndex, field, value) => {
    const filtered = field === 'weight' ? filterDecimal(value) : filterInteger(value);
    setLogSets(prev => {
      const updated = [...prev];
      updated[setIndex] = { ...updated[setIndex], [field]: filtered };
      return updated;
    });
  };

  const addSet = () => {
    setLogSets(prev => [...prev, { reps: '', weight: '' }]);
  };

  const removeSet = (index) => {
    if (logSets.length <= 1) return;
    setLogSets(prev => prev.filter((_, i) => i !== index));
  };

  const saveSetLog = async () => {
    const today = getLocalDateString();
    const setsData = logSets.map(s => ({
      reps: parseInt(s.reps) || 0,
      weight: parseFloat(s.weight) || 0,
    }));

    const updatedLogs = { ...exerciseLogs };
    if (!updatedLogs[today]) updatedLogs[today] = {};
    if (!updatedLogs[today][logDay]) updatedLogs[today][logDay] = {};

    const existingEntry = updatedLogs[today][logDay][logExerciseIndex] || {};
    updatedLogs[today][logDay][logExerciseIndex] = {
      sets: setsData,
      completedAt: new Date().toISOString(),
    };

    setExerciseLogs(updatedLogs);
    await saveExerciseLogs(updatedLogs);
    setShowLogModal(false);
  };

  const isExerciseLogged = (day, exerciseIndex) => {
    const entry = exerciseLogs[getLocalDateString()]?.[day]?.[exerciseIndex];
    if (!entry) return false;
    // Only count as "logged/completed" if it has completedAt and is not just an edit
    return !!entry.completedAt;
  };

  const handleNewPlan = () => {
    const doNav = () => navigation.navigate('WorkoutChoice');
    if (Platform.OS === 'web') {
      if (window.confirm('Create a new workout plan? Your current plan will be replaced immediately.')) doNav();
    } else {
      Alert.alert('Create New Plan', 'Your current plan will be replaced immediately. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: doNav },
      ]);
    }
  };

  // Open edit exercise modal
  const openEditExercise = (day, exerciseIndex) => {
    const dayExercises = allExercises.filter(e => e.dayOfWeek === day);
    const exercise = dayExercises[exerciseIndex];
    if (!exercise) return;

    setEditDay(day);
    setEditExerciseIndex(exerciseIndex);
    setEditIsCardio(exercise.isCardio || false);

    if (exercise.isCardio) {
      setEditDurationMinutes(String(Math.round((exercise.durationSeconds || 0) / 60) || 20));
      setEditSets('1');
      setEditSetDetails([]);
    } else {
      const numSets = exercise.sets || 3;
      setEditSets(String(numSets));

    // Priority for per-set data: 1) backend setDetailsJson, 2) today's log, 3) previous log, 4) flat values
    let parsedSetDetails = null;
    try {
      if (exercise.setDetailsJson) {
        parsedSetDetails = JSON.parse(exercise.setDetailsJson);
      }
    } catch (e) { /* ignore */ }

    const prev = findPreviousLog(day, exerciseIndex);
    const todayLog = exerciseLogs[getLocalDateString()]?.[day]?.[exerciseIndex];
    const latestLog = todayLog || prev?.log;

    let details;
    if (parsedSetDetails && parsedSetDetails.length > 0) {
      // Use backend stored per-set details
      details = Array.from({ length: numSets }, (_, i) => {
        const sd = parsedSetDetails[i];
        return {
          reps: String(sd?.reps || exercise.reps || 12),
          weight: sd?.weight ? String(sd.weight) : (exercise.weight ? String(exercise.weight) : ''),
        };
      });
    } else if (latestLog?.sets && latestLog.sets.length > 0) {
      // Use latest logged per-set values
      details = Array.from({ length: numSets }, (_, i) => {
        const loggedSet = latestLog.sets[i];
        return {
          reps: String(loggedSet?.reps || exercise.reps || 12),
          weight: loggedSet?.weight ? String(loggedSet.weight) : (exercise.weight ? String(exercise.weight) : ''),
        };
      });
    } else {
      // Fall back to exercise definition values
      details = Array.from({ length: numSets }, () => ({
        reps: String(exercise.reps || 12),
        weight: exercise.weight ? String(exercise.weight) : '',
      }));
    }

    setEditSetDetails(details);
    }

    setEditRestSeconds(String(exercise.restTimeSeconds || 60));
    const prev2 = findPreviousLog(day, exerciseIndex);
    setEditPreviousLog(prev2);

    setShowEditModal(true);
  };

  // Save edited exercise details
  const saveEditExercise = async () => {
    if (!userPlan?.workoutPlan?.exercises) return;

    const dayExercises = allExercises.filter(e => e.dayOfWeek === editDay);
    const exercise = dayExercises[editExerciseIndex];
    if (!exercise) return;

    setEditSaving(true);

    let updateRequest;

    if (editIsCardio) {
      const durationSec = (parseInt(editDurationMinutes) || 20) * 60;
      updateRequest = { durationSeconds: durationSec };
    } else {
      const newSetsCount = parseInt(editSets) || exercise.sets;
      const parsedSetDetails = editSetDetails.slice(0, newSetsCount).map(s => ({
        reps: parseInt(s.reps) || 0,
        weight: s.weight ? parseFloat(s.weight) : null,
      }));
      const primaryReps = parsedSetDetails[0]?.reps || exercise.reps;
      const primaryWeight = parsedSetDetails[0]?.weight || exercise.weight;

      updateRequest = {
        sets: newSetsCount,
        reps: primaryReps,
        weight: primaryWeight,
        restTimeSeconds: parseInt(editRestSeconds) || exercise.restTimeSeconds,
        setDetailsJson: JSON.stringify(parsedSetDetails),
      };
    }

    try {
      // Update the exercise in-place — backend also appends to log history automatically
      await workoutService.updateExercise(exercise.id, updateRequest);


      setShowEditModal(false);
      await fetchPlan(); // refresh to get latest from backend
      await loadExerciseLogs(); // refresh logs for progress data
      const msg = 'Exercise updated successfully!';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Updated! ✅', msg);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to update exercise';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setEditSaving(false);
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

  if (!userPlan) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Workout</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyText}>No workout plan found</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('WorkoutChoice')}>
            <Text style={styles.createBtnText}>Create Workout Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderExerciseCard = (ex, idx, day, isToday) => {
    const logged = isExerciseLogged(day, idx);

    return (
      <View key={idx} style={[styles.exerciseCard, logged && styles.exerciseCardDone]}>
        <TouchableOpacity
          style={styles.exerciseRow}
          onPress={() => isToday ? openLogModal(day, idx) : null}
          activeOpacity={isToday ? 0.7 : 1}
        >
          <Text style={styles.exerciseIcon}>
            {ex.isCardio ? '❤️' : (MUSCLE_ICONS[ex.muscleGroup] || '💪')}
          </Text>
          <View style={styles.exerciseInfo}>
            <Text style={[styles.exerciseName, logged && styles.exerciseNameDone]}>
              {ex.exerciseName}
            </Text>
            <Text style={styles.exerciseDetail}>
              {ex.isCardio
                ? `${Math.round((ex.durationSeconds || 0) / 60)} min`
                : (() => {
                    // Parse per-set details from backend JSON
                    let parsedSetDetails = null;
                    try {
                      if (ex.setDetailsJson) {
                        parsedSetDetails = JSON.parse(ex.setDetailsJson);
                      }
                    } catch (e) { /* ignore */ }

                    if (parsedSetDetails && parsedSetDetails.length > 0) {
                      const allSameReps = parsedSetDetails.every(s => s.reps === parsedSetDetails[0].reps);
                      const allSameWeight = parsedSetDetails.every(s => s.weight === parsedSetDetails[0].weight);
                      const repsText = allSameReps
                        ? `${ex.sets} sets × ${parsedSetDetails[0].reps} reps`
                        : `${ex.sets} sets (${parsedSetDetails.map(s => s.reps).join('/')}) reps`;
                      const hasWeight = parsedSetDetails.some(s => s.weight);
                      const weightText = hasWeight
                        ? allSameWeight
                          ? ` • ${parsedSetDetails[0].weight} kg`
                          : ` • ${parsedSetDetails.map(s => s.weight || 0).join('/')} kg`
                        : '';
                      return repsText + weightText + ` • Rest ${ex.restTimeSeconds}s`;
                    }
                    return `${ex.sets} sets × ${ex.reps} reps${ex.weight ? ` • ${ex.weight} kg` : ''} • Rest ${ex.restTimeSeconds}s`;
                  })()}
            </Text>

            {/* Show per-set breakdown from backend or latest log */}
            {!ex.isCardio && (() => {
              // Try backend setDetailsJson first
              let parsedSetDetails = null;
              try {
                if (ex.setDetailsJson) {
                  parsedSetDetails = JSON.parse(ex.setDetailsJson);
                }
              } catch (e) { /* ignore */ }

              // If no backend data, fall back to logs
              if (!parsedSetDetails || parsedSetDetails.length === 0) {
                const todayLog = exerciseLogs[getLocalDateString()]?.[day]?.[idx];
                const prevLogData = findPreviousLog(day, idx);
                const latestLog = todayLog || prevLogData?.log;
                if (latestLog?.sets && latestLog.sets.length > 0) {
                  parsedSetDetails = latestLog.sets;
                }
              }

              if (parsedSetDetails && parsedSetDetails.length > 0) {
                // Always show per-set breakdown
                return (
                  <View style={styles.perSetBreakdown}>
                    {parsedSetDetails.map((s, si) => (
                      <Text key={si} style={styles.perSetBreakdownText}>
                        Set {si + 1}: {s.reps} reps{s.weight > 0 ? ` × ${s.weight} kg` : ''}
                      </Text>
                    ))}
                  </View>
                );
              }
              return null;
            })()}

          </View>

          <TouchableOpacity
            style={styles.editExBtn}
            onPress={() => openEditExercise(day, idx)}
          >
            <Text style={styles.editExBtnText}>⚙️</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

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
            {isCustomPlan && (
              <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                <Text style={styles.badgeText}>📝 Custom Plan</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.badgeText}>{userPlan?.workoutPlan?.daysPerWeek || 0} days/week</Text>
            </View>
          </View>
        </View>


        {/* Check Your Progress */}
        <TouchableOpacity
          style={styles.progressBtn}
          onPress={() => navigation.navigate('ExerciseProgress', { exerciseLogs, allExercises })}
        >
          <Text style={styles.progressBtnIcon}>📈</Text>
          <View style={styles.progressBtnContent}>
            <Text style={styles.progressBtnTitle}>Check Your Progress</Text>
            <Text style={styles.progressBtnDesc}>View exercise history, track improvements</Text>
          </View>
          <Text style={styles.progressBtnArrow}>→</Text>
        </TouchableOpacity>

        {/* Weekly Overview */}
        <Text style={styles.sectionTitle}>Weekly Overview</Text>
        {ORDERED_DAYS.map(day => {
          const dayData = getExercisesForDay(day);
          const dayExercises = dayData.exercises;
          const isToday = day === todayDay;
          const isExpanded = expandedDays[day] || false;
          const hasExercises = dayExercises.length > 0;
          const isRest = dayData.isRest || (day === planRestDay);
          const isCycled = dayData.sourceDay != null;
          const effectiveDay = isCycled ? dayData.sourceDay : day;

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
                <Text style={[styles.weekDayExercises, isCycled && { color: colors.info || colors.primary }]}>
                  {isRest
                    ? 'Rest Day 😴'
                    : hasExercises
                      ? isCycled
                        ? `${dayExercises.length} exercises (${formatLabel(dayData.sourceDay)}'s plan)`
                        : `${dayExercises.length} exercises`
                      : 'Rest Day 😴'}
                </Text>
              </TouchableOpacity>

              {isExpanded && hasExercises && (
                <View style={styles.expandedExercises}>
                  {isCycled && (
                    <View style={styles.cycleNotice}>
                      <Text style={styles.cycleNoticeText}>
                        🔄 Following {formatLabel(dayData.sourceDay)}'s workout
                      </Text>
                    </View>
                  )}
                  {dayExercises
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((ex, idx) => renderExerciseCard(ex, idx, effectiveDay, isToday))}
                </View>
              )}
            </View>
          );
        })}


        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Log Exercise Modal */}
      <Modal visible={showLogModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>📝 Log Exercise</Text>

              {logDay && logExerciseIndex !== null && (() => {
                const exercise = allExercises.filter(e => e.dayOfWeek === logDay)[logExerciseIndex];
                return exercise ? (
                  <View style={styles.logExerciseHeader}>
                    <Text style={styles.logExerciseName}>
                      {MUSCLE_ICONS[exercise.muscleGroup] || '💪'} {exercise.exerciseName}
                    </Text>
                    <Text style={styles.logExerciseTarget}>
                      Target: {exercise.sets} sets × {exercise.reps} reps
                    </Text>
                  </View>
                ) : null;
              })()}

              {/* Previous Session */}
              {previousLog && (
                <View style={styles.prevSessionCard}>
                  <Text style={styles.prevSessionTitle}>📊 Last Session ({previousLog.date})</Text>
                  {previousLog.log.sets?.map((s, i) => (
                    <Text key={i} style={styles.prevSessionSet}>
                      Set {i + 1}: {s.reps} reps{s.weight > 0 ? ` × ${s.weight} kg` : ''}
                    </Text>
                  ))}
                </View>
              )}

              {/* Current Sets */}
              <Text style={styles.logSectionTitle}>Today's Performance</Text>
              {logSets.map((set, i) => (
                <View key={i} style={styles.setRow}>
                  <Text style={styles.setLabel}>Set {i + 1}</Text>
                  <View style={styles.setInputs}>
                    <View style={styles.setInputGroup}>
                      <Text style={styles.setInputLabel}>Reps</Text>
                      <TextInput
                        style={styles.setInput}
                        value={set.reps}
                        onChangeText={v => updateSetLog(i, 'reps', v)}
                        keyboardType="numeric"
                        placeholder="12"
                      />
                    </View>
                    <View style={styles.setInputGroup}>
                      <Text style={styles.setInputLabel}>Weight (kg)</Text>
                      <TextInput
                        style={styles.setInput}
                        value={set.weight}
                        onChangeText={v => updateSetLog(i, 'weight', v)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    {logSets.length > 1 && (
                      <TouchableOpacity onPress={() => removeSet(i)} style={styles.removeSetBtn}>
                        <Text style={styles.removeSetBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Comparison with previous */}
                  {previousLog?.log?.sets?.[i] && (
                    <Text style={styles.comparisonText}>
                      {(() => {
                        const prevReps = previousLog.log.sets[i].reps || 0;
                        const prevWeight = previousLog.log.sets[i].weight || 0;
                        const currReps = parseInt(set.reps) || 0;
                        const currWeight = parseFloat(set.weight) || 0;
                        const parts = [];
                        if (currReps > prevReps) parts.push(`+${currReps - prevReps} reps ⬆️`);
                        else if (currReps < prevReps) parts.push(`${currReps - prevReps} reps ⬇️`);
                        if (currWeight > prevWeight) parts.push(`+${(currWeight - prevWeight).toFixed(1)} kg ⬆️`);
                        else if (currWeight < prevWeight) parts.push(`${(currWeight - prevWeight).toFixed(1)} kg ⬇️`);
                        return parts.length > 0 ? `vs last: ${parts.join(', ')}` : 'Same as last session';
                      })()}
                    </Text>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
                <Text style={styles.addSetBtnText}>+ Add Set</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLogModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={saveSetLog}>
                  <Text style={styles.modalSaveText}>Save Log</Text>
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
              <Text style={styles.modalTitle}>⚙️ Edit Exercise</Text>

              {editDay && editExerciseIndex !== null && (() => {
                const exercise = allExercises.filter(e => e.dayOfWeek === editDay)[editExerciseIndex];
                return exercise ? (
                  <View style={styles.logExerciseHeader}>
                    <Text style={styles.logExerciseName}>
                      {exercise.isCardio ? '❤️' : (MUSCLE_ICONS[exercise.muscleGroup] || '💪')} {exercise.exerciseName}
                    </Text>
                    <Text style={styles.logExerciseTarget}>
                      {exercise.isCardio
                        ? `Current: ${Math.round((exercise.durationSeconds || 0) / 60)} minutes`
                        : `Current: ${exercise.sets} sets × ${exercise.reps} reps${exercise.weight ? ` • ${exercise.weight} kg` : ''}`}
                    </Text>
                  </View>
                ) : null;
              })()}

              {/* Previous Performance Reference — only for strength */}
              {editPreviousLog && !editIsCardio && (
                <View style={styles.prevSessionCard}>
                  <Text style={styles.prevSessionTitle}>📊 Last Performance ({editPreviousLog.date})</Text>
                  {editPreviousLog.log.sets?.map((s, i) => (
                    <Text key={i} style={styles.prevSessionSet}>
                      Set {i + 1}: {s.reps} reps{s.weight > 0 ? ` × ${s.weight} kg` : ''}
                    </Text>
                  ))}
                  <Text style={[styles.prevSessionSet, { fontStyle: 'italic', marginTop: 4 }]}>
                    Use this as reference to adjust your plan
                  </Text>
                </View>
              )}

              {editIsCardio ? (
                <>
                  <Text style={styles.logSectionTitle}>⏱️ Duration</Text>
                  <View style={styles.setRow}>
                    <Text style={styles.setLabel}>Duration (minutes)</Text>
                    <TextInput
                      style={styles.setInput}
                      value={editDurationMinutes}
                      onChangeText={v => setEditDurationMinutes(filterInteger(v))}
                      keyboardType="numeric"
                      placeholder="20"
                    />
                  </View>
                </>
              ) : (
                <>
              {/* Number of Sets (read-only after assignment) */}
              <View style={styles.setRow}>
                <Text style={styles.setLabel}>Number of Sets</Text>
                <View style={[styles.setInput, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ textAlign: 'center', color: colors.text.secondary, fontWeight: '600' }}>
                    {editSets}
                  </Text>
                </View>
              </View>

              {/* Per-set Reps & Weight */}
              <Text style={styles.logSectionTitle}>Sets Details</Text>
              {editSetDetails.slice(0, parseInt(editSets) || 0).map((setItem, si) => (
                <View key={si} style={styles.setRow}>
                  <Text style={styles.setLabel}>Set {si + 1}</Text>
                  <View style={styles.setInputs}>
                    <View style={styles.setInputGroup}>
                      <Text style={styles.setInputLabel}>Reps</Text>
                      <TextInput
                        style={styles.setInput}
                        value={setItem.reps}
                        onChangeText={v => {
                          const filtered = filterInteger(v);
                          setEditSetDetails(prev => {
                            const updated = [...prev];
                            updated[si] = { ...updated[si], reps: filtered };
                            return updated;
                          });
                        }}
                        keyboardType="numeric"
                        placeholder="12"
                      />
                    </View>
                    <View style={styles.setInputGroup}>
                      <Text style={styles.setInputLabel}>Weight (kg)</Text>
                      <TextInput
                        style={styles.setInput}
                        value={setItem.weight}
                        onChangeText={v => {
                          const filtered = filterDecimal(v);
                          setEditSetDetails(prev => {
                            const updated = [...prev];
                            updated[si] = { ...updated[si], weight: filtered };
                            return updated;
                          });
                        }}
                        keyboardType="numeric"
                        placeholder="Optional"
                      />
                    </View>
                  </View>
                </View>
              ))}
                </>
              )}

              {/* Rest Time — only for strength exercises */}
              {!editIsCardio && (
              <View style={styles.setRow}>
                <Text style={styles.setLabel}>Rest Between Sets (seconds)</Text>
                <TextInput
                  style={styles.setInput}
                  value={editRestSeconds}
                  onChangeText={v => setEditRestSeconds(filterInteger(v))}
                  keyboardType="numeric"
                  placeholder="60"
                />
              </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSave, editSaving && { opacity: 0.6 }]}
                  onPress={saveEditExercise}
                  disabled={editSaving}
                >
                  <Text style={styles.modalSaveText}>
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyText: { ...typography.h3, color: colors.text.secondary, marginBottom: spacing.lg },
  createBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  createBtnText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  planSummary: { marginBottom: spacing.md },
  planName: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  badgeText: { ...typography.bodySmall, fontWeight: '600' },
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
  exerciseCardDone: { opacity: 0.85 },
  exerciseRow: { flexDirection: 'row', alignItems: 'flex-start' },
  exerciseIcon: { fontSize: 24, marginRight: spacing.sm, marginTop: 2 },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  exerciseNameDone: { color: colors.success },
  exerciseDetail: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  perSetBreakdown: {
    marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 0.5,
    borderTopColor: colors.border + '60' || '#e0e0e060',
  },
  perSetBreakdownText: { ...typography.caption, color: colors.text.secondary, fontSize: 11, lineHeight: 16 },
  logBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  logBtnDone: { backgroundColor: colors.success + '15' },
  logBtnText: { fontSize: 16 },
  logBtnTextDone: {},
  exerciseActionBtns: { flexDirection: 'column', gap: 6, alignItems: 'center' },
  editExBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  editExBtnText: { fontSize: 16 },
  progressBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary + '30', ...shadows.sm,
  },
  progressBtnIcon: { fontSize: 28, marginRight: spacing.md },
  progressBtnContent: { flex: 1 },
  progressBtnTitle: { ...typography.body, fontWeight: '700', color: colors.primary },
  progressBtnDesc: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  progressBtnArrow: { fontSize: 20, color: colors.primary, fontWeight: '600' },
  tipCard: {
    backgroundColor: colors.accent + '15', borderRadius: borderRadius.md, padding: spacing.md,
    marginTop: spacing.sm,
  },
  tipText: { ...typography.caption, color: colors.text.secondary, lineHeight: 18 },
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
    marginBottom: spacing.sm, marginLeft: spacing.sm,
    borderLeftWidth: 2, borderLeftColor: colors.primary + '40', paddingLeft: spacing.sm,
  },
  cycleNotice: {
    backgroundColor: (colors.info || colors.primary) + '12',
    borderRadius: borderRadius.sm, padding: spacing.sm,
    marginBottom: spacing.sm, borderLeftWidth: 3,
    borderLeftColor: colors.info || colors.primary,
  },
  cycleNoticeText: {
    ...typography.caption, color: colors.info || colors.primary, fontWeight: '600',
  },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, maxHeight: '85%',
  },
  modalTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },
  logExerciseHeader: { marginBottom: spacing.lg },
  logExerciseName: { ...typography.h3, color: colors.text.primary },
  logExerciseTarget: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 4 },
  prevSessionCard: {
    backgroundColor: colors.info + '10', borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.info || colors.secondary,
  },
  prevSessionTitle: { ...typography.bodySmall, fontWeight: '700', color: colors.info || colors.secondary, marginBottom: spacing.xs },
  prevSessionSet: { ...typography.caption, color: colors.text.secondary, marginLeft: spacing.sm },
  logSectionTitle: { ...typography.body, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.md },
  setRow: {
    backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.sm,
  },
  setLabel: { ...typography.bodySmall, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  setInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  setInputGroup: { flex: 1 },
  setInputLabel: { ...typography.caption, color: colors.text.secondary, marginBottom: 4 },
  setInput: {
    backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.sm,
    ...typography.body, color: colors.text.primary, borderWidth: 1, borderColor: colors.border || '#e0e0e0',
    textAlign: 'center',
  },
  removeSetBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.error + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  removeSetBtnText: { color: colors.error, fontWeight: '700', fontSize: 14 },
  comparisonText: { ...typography.caption, color: colors.text.secondary, fontStyle: 'italic', marginTop: 4 },
  addSetBtn: {
    borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
    borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', marginBottom: spacing.lg,
  },
  addSetBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
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
});

export default FreeWorkoutViewScreen;

