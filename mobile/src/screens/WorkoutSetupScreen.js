import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import workoutService from '../services/workoutService';
import userService from '../services/userService';
import { updateUser } from '../store/slices/authSlice';

const PREFS_KEY = '@workout_setup_prefs';

const EXERCISE_TYPES = [
  { key: 'GYM', label: '🏋️ Gym', desc: 'Weights & machines' },
  { key: 'OUTDOOR', label: '🌳 Outdoor', desc: 'Bodyweight outdoors' },
  { key: 'RUNNING', label: '🏃 Running', desc: 'Running & jogging' },
  { key: 'YOGA', label: '🧘 Yoga', desc: 'Yoga & stretching' },
  { key: 'HOME', label: '🏠 Home', desc: 'Home workouts' },
];

const ALL_GOALS = [
  { key: 'MUSCLE_BUILDING', label: '💪 Muscle Building', duration: '12 weeks' },
  { key: 'SLIMMING', label: '🔥 Slimming', duration: '8 weeks' },
  { key: 'SLIMMING_PLUS_MUSCLE', label: '⚡ Slim + Muscle', duration: '12 weeks' },
];

// Running and Yoga can only slim — no muscle building
const CARDIO_ONLY_TYPES = ['RUNNING', 'YOGA'];
const CARDIO_GOALS = [
  { key: 'SLIMMING', label: '🔥 Slimming', duration: '8 weeks' },
];

const DIFFICULTIES = [
  { key: 'BEGINNER', label: '🟢 Beginner' },
  { key: 'INTERMEDIATE', label: '🟡 Intermediate' },
  { key: 'ADVANCED', label: '🔴 Advanced' },
];

const CARDIO_TYPES = [
  { key: 'RUNNING', label: '🏃 Running' },
  { key: 'WALKING', label: '🚶 Walking' },
  { key: 'CYCLING', label: '🚴 Cycling' },
  { key: 'SKIPPING', label: '⏩ Skipping' },
];

const GENDERS = [
  { key: 'MALE', label: '👨 Male' },
  { key: 'FEMALE', label: '👩 Female' },
  { key: 'OTHER', label: '⚧ Other' },
];

const TIME_OPTIONS = [
  '5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
];

const WorkoutSetupScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const profileGender = user?.profile?.gender;

  const [exerciseType, setExerciseType] = useState(null);
  const [goal, setGoal] = useState(null);
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [exerciseTime, setExerciseTime] = useState('6:00 AM');
  const [includeCardio, setIncludeCardio] = useState(false);
  const [cardioType, setCardioType] = useState('RUNNING');
  const [cardioDuration, setCardioDuration] = useState(20);
  const [cardioSteps, setCardioSteps] = useState(0);
  const [gender, setGender] = useState(profileGender || '');
  const [loading, setLoading] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Determine whether gender is missing from profile
  const needsGender = !profileGender;

  // Load previous preferences
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        if (raw) {
          const prefs = JSON.parse(raw);
          if (prefs.exerciseType) setExerciseType(prefs.exerciseType);
          if (prefs.goal) setGoal(prefs.goal);
          if (prefs.difficulty) setDifficulty(prefs.difficulty);
          if (prefs.daysPerWeek) setDaysPerWeek(prefs.daysPerWeek);
          if (prefs.durationMinutes) setDurationMinutes(prefs.durationMinutes);
          if (prefs.exerciseTime) setExerciseTime(prefs.exerciseTime);
          if (prefs.includeCardio !== undefined) setIncludeCardio(prefs.includeCardio);
          if (prefs.cardioType) setCardioType(prefs.cardioType);
          if (prefs.cardioDuration) setCardioDuration(prefs.cardioDuration);
          if (prefs.cardioSteps !== undefined) setCardioSteps(prefs.cardioSteps);
        }
      } catch (e) { /* ignore */ }
      setPrefsLoaded(true);
    })();
  }, []);

  // When exercise type changes, reset goal if it becomes invalid
  useEffect(() => {
    if (CARDIO_ONLY_TYPES.includes(exerciseType)) {
      if (goal && goal !== 'SLIMMING') {
        setGoal('SLIMMING');
      }
    }
  }, [exerciseType]);

  const availableGoals = CARDIO_ONLY_TYPES.includes(exerciseType) ? CARDIO_GOALS : ALL_GOALS;

  // Persist preferences to AsyncStorage
  const savePrefs = async () => {
    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({
        exerciseType, goal, difficulty, daysPerWeek, durationMinutes,
        exerciseTime, includeCardio, cardioType, cardioDuration, cardioSteps,
      }));
    } catch (e) { /* ignore */ }
  };

  const handleGenerate = async () => {
    // Validate exercise type
    if (!exerciseType) {
      const msg = 'Please select an exercise type';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }
    // Validate goal
    if (!goal) {
      const msg = 'Please select a fitness goal';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }
    // Validate difficulty
    if (!difficulty) {
      const msg = 'Please select a difficulty level';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }
    // Validate days per week
    if (daysPerWeek < 1 || daysPerWeek > 6) {
      const msg = 'Days per week must be between 1 and 6';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Input', msg);
      return;
    }
    // Validate duration
    if (durationMinutes < 15 || durationMinutes > 120) {
      const msg = 'Workout duration must be between 15 and 120 minutes';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Input', msg);
      return;
    }
    // Validate exercise time
    if (!exerciseTime) {
      const msg = 'Please select a workout time';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }
    // Validate cardio settings if included
    if (includeCardio) {
      if (!cardioType) {
        const msg = 'Please select a cardio type';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
        return;
      }
      if (cardioDuration < 5 || cardioDuration > 60) {
        const msg = 'Cardio duration must be between 5 and 60 minutes';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Input', msg);
        return;
      }
      if ((cardioType === 'RUNNING' || cardioType === 'WALKING') && cardioSteps < 0) {
        const msg = 'Cardio steps cannot be negative';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Invalid Input', msg);
        return;
      }
    }
    // Validate gender if needed
    if (needsGender && !gender) {
      const msg = 'Please select your gender to personalize your plan';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }

    setLoading(true);
    try {
      // Save gender to profile if it was missing
      if (needsGender && gender) {
        try {
          const updatedProfile = await userService.updateProfile({
            ...user?.profile,
            gender,
          });
          // Update local user state
          dispatch(updateUser({ ...user, profile: { ...user?.profile, gender } }));
        } catch (e) {
          console.log('Failed to save gender to profile:', e.message);
        }
      }

      // Save preferences for next time
      await savePrefs();

      const request = {
        daysPerWeek,
        exerciseType,
        exerciseTime,
        durationMinutes,
        goal,
        difficulty,
        includeCardio,
        cardioType: includeCardio ? cardioType : null,
        cardioDurationMinutes: includeCardio ? cardioDuration : null,
        cardioSteps: includeCardio ? cardioSteps : null,
      };
      const plan = await workoutService.generateWorkoutPlan(request);
      navigation.navigate('GeneratedWorkoutPlanView', { plan, exerciseTime });
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to generate workout plan';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderRadioGroup = (items, selected, onSelect) => (
    <View style={styles.radioGroup}>
      {items.map(item => (
        <TouchableOpacity
          key={item.key}
          style={[styles.radioItem, selected === item.key && styles.radioItemSelected]}
          onPress={() => onSelect(item.key)}
        >
          <Text style={[styles.radioLabel, selected === item.key && styles.radioLabelSelected]}>
            {item.label}
          </Text>
          {item.desc && <Text style={styles.radioDesc}>{item.desc}</Text>}
          {item.duration && <Text style={styles.radioDuration}>{item.duration}</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderNumberPicker = (label, value, onChange, min, max, step = 1) => (
    <View style={styles.numberPicker}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerControls}>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Text style={styles.pickerBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.pickerValue}>{value}</Text>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => onChange(Math.min(max, value + step))}
        >
          <Text style={styles.pickerBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generating your workout plan...</Text>
        <Text style={styles.loadingSubText}>Using AI to create the perfect plan for you</Text>
      </View>
    );
  }

  const canGenerate = exerciseType && goal && (!needsGender || gender);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Setup</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gender — only show if not set in profile */}
        {needsGender && (
          <>
            <Text style={styles.sectionTitle}>👤 Your Gender</Text>
            <Text style={styles.sectionHint}>Required to personalize your workout plan</Text>
            {renderRadioGroup(GENDERS, gender, setGender)}
          </>
        )}

        {/* Exercise Type */}
        <Text style={styles.sectionTitle}>🏋️ Exercise Type</Text>
        {renderRadioGroup(EXERCISE_TYPES, exerciseType, setExerciseType)}

        {/* Goal — filtered based on exercise type */}
        <Text style={styles.sectionTitle}>🎯 Your Goal</Text>
        {CARDIO_ONLY_TYPES.includes(exerciseType) && (
          <Text style={styles.sectionHint}>
            Running & Yoga focus on slimming and flexibility
          </Text>
        )}
        {renderRadioGroup(availableGoals, goal, setGoal)}

        {/* Difficulty */}
        <Text style={styles.sectionTitle}>📊 Difficulty Level</Text>
        {renderRadioGroup(DIFFICULTIES, difficulty, setDifficulty)}

        {/* Days per week */}
        {renderNumberPicker('📅 Days Per Week', daysPerWeek, setDaysPerWeek, 1, 6)}

        {/* Duration */}
        {renderNumberPicker('⏱️ Duration (minutes)', durationMinutes, setDurationMinutes, 15, 120, 15)}

        {/* Exercise Time — extended to 10:30 PM */}
        <View style={styles.timeSection}>
          <Text style={styles.sectionTitle}>🕐 Workout Time</Text>
          <View style={styles.timeOptions}>
            {TIME_OPTIONS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, exerciseTime === t && styles.timeChipSelected]}
                onPress={() => setExerciseTime(t)}
              >
                <Text style={[styles.timeChipText, exerciseTime === t && styles.timeChipTextSelected]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Include Cardio */}
        <TouchableOpacity
          style={[styles.cardioToggle, includeCardio && styles.cardioToggleActive]}
          onPress={() => setIncludeCardio(!includeCardio)}
        >
          <Text style={styles.cardioToggleText}>
            {includeCardio ? '✅' : '⬜'} Include Cardio
          </Text>
        </TouchableOpacity>

        {includeCardio && (
          <View style={styles.cardioSection}>
            <Text style={styles.sectionSubtitle}>Cardio Type</Text>
            {renderRadioGroup(CARDIO_TYPES, cardioType, setCardioType)}
            {renderNumberPicker('Cardio Duration (min)', cardioDuration, setCardioDuration, 5, 60, 5)}
            {(cardioType === 'RUNNING' || cardioType === 'WALKING') && (
              renderNumberPicker('Target Steps', cardioSteps, setCardioSteps, 0, 20000, 1000)
            )}
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={!canGenerate}
        >
          <Text style={styles.generateBtnText}>🚀 Generate Workout Plan</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { ...typography.h3, color: colors.text.primary, marginTop: spacing.lg },
  loadingSubText: { ...typography.body, color: colors.text.secondary, marginTop: spacing.sm },
  header: {
    backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backButton: { padding: spacing.xs },
  backButtonText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  content: { flex: 1, padding: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionHint: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  sectionSubtitle: { ...typography.body, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.sm },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  radioItem: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    minWidth: '30%', flex: 1, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', ...shadows.sm,
  },
  radioItemSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  radioLabel: { ...typography.body, fontWeight: '600', color: colors.text.primary, textAlign: 'center' },
  radioLabelSelected: { color: colors.primary },
  radioDesc: { ...typography.caption, color: colors.text.secondary, textAlign: 'center', marginTop: 2 },
  radioDuration: { ...typography.caption, color: colors.primary, fontWeight: '600', marginTop: 2 },
  numberPicker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md, ...shadows.sm,
  },
  pickerLabel: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  pickerControls: { flexDirection: 'row', alignItems: 'center' },
  pickerBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  pickerBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  pickerValue: { ...typography.h3, color: colors.primary, marginHorizontal: spacing.lg },
  timeSection: { marginBottom: spacing.md },
  timeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full || 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  timeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeChipText: { ...typography.bodySmall, color: colors.text.primary },
  timeChipTextSelected: { color: colors.text.inverse, fontWeight: '600' },
  cardioToggle: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, marginTop: spacing.lg, ...shadows.sm,
  },
  cardioToggleActive: { backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary },
  cardioToggleText: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  cardioSection: { marginLeft: spacing.md },
  generateBtn: {
    backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg,
    alignItems: 'center', marginTop: spacing.xl, ...shadows.md,
  },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { ...typography.h3, color: colors.text.inverse },
});

export default WorkoutSetupScreen;

