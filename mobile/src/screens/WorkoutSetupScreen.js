import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, TextInput,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import workoutService from '../services/workoutService';

const EXERCISE_TYPES = [
  { key: 'GYM', label: '🏋️ Gym', desc: 'Weights & machines' },
  { key: 'OUTDOOR', label: '🌳 Outdoor', desc: 'Bodyweight outdoors' },
  { key: 'RUNNING', label: '🏃 Running', desc: 'Running & jogging' },
  { key: 'YOGA', label: '🧘 Yoga', desc: 'Yoga & stretching' },
  { key: 'HOME', label: '🏠 Home', desc: 'Home workouts' },
];

const GOALS = [
  { key: 'MUSCLE_BUILDING', label: '💪 Muscle Building', duration: '12 weeks' },
  { key: 'SLIMMING', label: '🔥 Slimming', duration: '8 weeks' },
  { key: 'SLIMMING_PLUS_MUSCLE', label: '⚡ Slim + Muscle', duration: '12 weeks' },
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

const WorkoutSetupScreen = ({ navigation }) => {
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
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!exerciseType || !goal) {
      const msg = 'Please select exercise type and goal';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }
    setLoading(true);
    try {
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
        {/* Exercise Type */}
        <Text style={styles.sectionTitle}>🏋️ Exercise Type</Text>
        {renderRadioGroup(EXERCISE_TYPES, exerciseType, setExerciseType)}

        {/* Goal */}
        <Text style={styles.sectionTitle}>🎯 Your Goal</Text>
        {renderRadioGroup(GOALS, goal, setGoal)}

        {/* Difficulty */}
        <Text style={styles.sectionTitle}>📊 Difficulty Level</Text>
        {renderRadioGroup(DIFFICULTIES, difficulty, setDifficulty)}

        {/* Days per week */}
        {renderNumberPicker('📅 Days Per Week', daysPerWeek, setDaysPerWeek, 1, 6)}

        {/* Duration */}
        {renderNumberPicker('⏱️ Duration (minutes)', durationMinutes, setDurationMinutes, 15, 120, 15)}

        {/* Exercise Time */}
        <View style={styles.timeSection}>
          <Text style={styles.sectionTitle}>🕐 Workout Time</Text>
          <View style={styles.timeOptions}>
            {['5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'].map(t => (
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
          style={[styles.generateBtn, (!exerciseType || !goal) && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={!exerciseType || !goal}
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

