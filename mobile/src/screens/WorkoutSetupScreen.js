import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import workoutService from '../services/workoutService';
import subscriptionService from '../services/subscriptionService';
import { useTranslation } from '../i18n';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const SPLIT_TYPES = [
  {
    key: 'SINGLE_MUSCLE',
    label: '🎯 Single Muscle',
    desc: 'One muscle group per day (e.g., Chest Day, Back Day)',
    example: 'Mon: Chest • Tue: Back • Wed: Legs • Thu: Shoulders • Fri: Arms',
  },
  {
    key: 'DOUBLE_MUSCLE',
    label: '💪 Double Muscle',
    desc: 'Two muscle groups per day for efficient training',
    example: 'Mon: Chest+Triceps • Tue: Back+Biceps • Wed: Legs+Shoulders',
  },
  {
    key: 'PUSH_PULL_LEGS',
    label: '🔄 Push / Pull / Legs',
    desc: 'Classic PPL split for balanced strength',
    example: 'Push: Chest+Shoulders+Triceps • Pull: Back+Biceps • Legs: Full lower body',
  },
  {
    key: 'UPPER_LOWER',
    label: '⬆️⬇️ Upper / Lower',
    desc: 'Alternate upper and lower body days',
    example: 'Mon: Upper • Tue: Lower • Thu: Upper • Fri: Lower',
  },
  {
    key: 'FULL_BODY',
    label: '🏋️ Full Body',
    desc: 'Hit all major muscles every session',
    example: 'Each day: Compound movements covering all muscle groups',
  },
];

const TIME_OPTIONS = [
  '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
  '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM',
  '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
];

const ALL_GOALS = [
  { key: 'MUSCLE_BUILDING', label: '💪 Muscle Building' },
  { key: 'SLIMMING', label: '🔥 Slimming' },
  { key: 'SLIMMING_PLUS_MUSCLE', label: '⚡ Slim + Muscle' },
];

const DIFFICULTIES = [
  { key: 'BEGINNER', label: '🟢 Beginner' },
  { key: 'INTERMEDIATE', label: '🟡 Intermediate' },
  { key: 'ADVANCED', label: '🔴 Advanced' },
];

const formatLabel = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const WorkoutSetupScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useSelector(state => state.auth);

  const [planName, setPlanName] = useState('My AI Workout');
  const [goal, setGoal] = useState('MUSCLE_BUILDING');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [selectedDays, setSelectedDays] = useState(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const [splitType, setSplitType] = useState('PUSH_PULL_LEGS');
  const [loading, setLoading] = useState(false);
  const [exerciseTime, setExerciseTime] = useState('6:00 AM');
  const [validationErrors, setValidationErrors] = useState({});

  const toggleDay = (day) => {
    setSelectedDays(prev => {
      const updated = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      return updated;
    });
    if (validationErrors.days) {
      setValidationErrors(prev => ({ ...prev, days: null }));
    }
  };

  const getWeeklyCyclePreview = () => {
    const sortedWorkoutDays = selectedDays.slice().sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
    const preview = {};
    let cycleIndex = 0;
    DAYS.forEach(day => {
      if (selectedDays.includes(day)) {
        preview[day] = { type: 'workout', source: day };
      } else {
        preview[day] = { type: 'cycle', source: sortedWorkoutDays[cycleIndex % sortedWorkoutDays.length] };
        cycleIndex++;
      }
    });
    return preview;
  };

  const handleGenerate = async () => {
    setValidationErrors({});
    const errors = {};

    const trimmedName = planName.trim();
    if (!trimmedName) {
      errors.planName = 'Please enter a plan name';
    } else if (trimmedName.length > 100) {
      errors.planName = 'Plan name must be 100 characters or less';
    }

    if (selectedDays.length === 0) {
      errors.days = 'Please select at least one workout day';
    }

    if (!exerciseTime || !exerciseTime.trim()) {
      errors.exerciseTime = 'Please select your preferred workout time';
    }

    if (!splitType) {
      errors.splitType = 'Please select a workout split type';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const request = {
        planName: trimmedName,
        daysPerWeek: selectedDays.length,
        exerciseTime: exerciseTime,
        goal: goal,
        difficulty: difficulty,
        workoutDays: selectedDays,
        splitType: splitType,
      };

      // Add plan generation limit info from subscription
      try {
        const subResp = await subscriptionService.getActiveSubscription();
        const sub = subResp?.data || subResp;
        if (sub && sub.startDate) {
          request.maxPlanGenerations = sub.maxPlanGenerations || sub.durationMonths || 3;
          request.subscriptionStartDate = sub.startDate;
        }
      } catch (e) { /* ignore */ }

      const plan = await workoutService.generateWorkoutPlan(request);
      navigation.navigate('GeneratedWorkoutPlanView', { plan, exerciseTime });
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to generate workout plan';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('workoutSetup.generatingPlan')}</Text>
        <Text style={styles.loadingSubText}>{t('workoutSetup.aiCreatingPlan')}</Text>
      </View>
    );
  }

  const selectedSplit = SPLIT_TYPES.find(s => s.key === splitType);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('workoutSetup.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Premium Badge */}
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeIcon}>🤖</Text>
          <View style={styles.aiBadgeContent}>
            <Text style={styles.aiBadgeTitle}>AI-Powered Plan</Text>
            <Text style={styles.aiBadgeDesc}>
              Choose your preferences and our AI will generate the perfect workout plan with exercises tailored for you
            </Text>
          </View>
        </View>

        {/* Plan Name */}
        <Text style={styles.sectionTitle}>📝 Plan Name</Text>
        <TextInput
          style={[styles.nameInput, validationErrors.planName && styles.inputError]}
          value={planName}
          onChangeText={(text) => {
            setPlanName(text);
            if (validationErrors.planName) {
              setValidationErrors(prev => ({ ...prev, planName: null }));
            }
          }}
          placeholder="My AI Workout"
          maxLength={100}
          placeholderTextColor={colors.text.light}
        />
        {validationErrors.planName && (
          <Text style={styles.errorText}>⚠️ {validationErrors.planName}</Text>
        )}

        {/* Your Goal */}
        <Text style={styles.sectionTitle}>🎯 {t('workoutSetup.yourGoal') || 'Your Goal'}</Text>
        <View style={styles.radioGroup}>
          {ALL_GOALS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.radioItem, goal === item.key && styles.radioItemSelected]}
              onPress={() => setGoal(item.key)}
            >
              <Text style={[styles.radioLabel, goal === item.key && styles.radioLabelSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Difficulty Level */}
        <Text style={styles.sectionTitle}>📊 {t('workoutSetup.difficultyLevel') || 'Difficulty Level'}</Text>
        <View style={styles.radioGroup}>
          {DIFFICULTIES.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.radioItem, difficulty === item.key && styles.radioItemSelected]}
              onPress={() => setDifficulty(item.key)}
            >
              <Text style={[styles.radioLabel, difficulty === item.key && styles.radioLabelSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Workout Split Type */}
        <Text style={styles.sectionTitle}>🏋️ Workout Split</Text>
        <Text style={styles.sectionHint}>How would you like to split your exercises across days?</Text>
        {validationErrors.splitType && (
          <Text style={styles.errorText}>⚠️ {validationErrors.splitType}</Text>
        )}
        {SPLIT_TYPES.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.splitCard, splitType === item.key && styles.splitCardSelected]}
            onPress={() => {
              setSplitType(item.key);
              if (validationErrors.splitType) {
                setValidationErrors(prev => ({ ...prev, splitType: null }));
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.splitCardHeader}>
              <View style={[styles.splitRadio, splitType === item.key && styles.splitRadioSelected]}>
                {splitType === item.key && <View style={styles.splitRadioDot} />}
              </View>
              <Text style={[styles.splitLabel, splitType === item.key && styles.splitLabelSelected]}>
                {item.label}
              </Text>
            </View>
            <Text style={styles.splitDesc}>{item.desc}</Text>
            <View style={styles.splitExampleBox}>
              <Text style={styles.splitExampleText}>💡 {item.example}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Day Selection */}
        <Text style={styles.sectionTitle}>📅 {t('freeWorkoutBuilder.selectDays') || 'Workout Days'}</Text>
        {validationErrors.days && (
          <Text style={styles.errorText}>⚠️ {validationErrors.days}</Text>
        )}
        <View style={styles.dayRow}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, selectedDays.includes(day) && styles.dayChipSelected]}
              onPress={() => toggleDay(day)}
            >
              <Text style={[styles.dayChipText, selectedDays.includes(day) && styles.dayChipTextSelected]}>
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Cycle Preview */}
        {selectedDays.length > 0 && selectedDays.length < 7 && (
          <View style={styles.cyclePreview}>
            <Text style={styles.cyclePreviewTitle}>📆 Weekly Schedule Preview</Text>
            {DAYS.map(day => {
              const info = getWeeklyCyclePreview()[day];
              return (
                <View key={day} style={styles.cycleRow}>
                  <Text style={styles.cycleDayName}>{formatLabel(day)}</Text>
                  {info.type === 'workout' ? (
                    <Text style={[styles.cycleSource, { color: colors.primary, fontWeight: '700' }]}>
                      🏋️ Workout Day
                    </Text>
                  ) : (
                    <Text style={[styles.cycleSource, { color: colors.text.secondary }]}>
                      🔄 Same as {formatLabel(info.source)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Exercise Time */}
        <Text style={styles.sectionTitle}>🕐 {t('workoutSetup.workoutTime') || 'Exercise Time'} *</Text>
        <Text style={styles.sectionHint}>When do you prefer to workout?</Text>
        {validationErrors.exerciseTime && (
          <Text style={styles.errorText}>⚠️ {validationErrors.exerciseTime}</Text>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRow}>
          {TIME_OPTIONS.map(time => (
            <TouchableOpacity
              key={time}
              style={[styles.timeChip, exerciseTime === time && styles.timeChipSelected]}
              onPress={() => {
                setExerciseTime(time);
                if (validationErrors.exerciseTime) {
                  setValidationErrors(prev => ({ ...prev, exerciseTime: null }));
                }
              }}
            >
              <Text style={[styles.timeChipText, exerciseTime === time && styles.timeChipTextSelected]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* AI-generated exercises info */}
        <View style={styles.aiExerciseInfo}>
          <Text style={styles.aiExerciseInfoIcon}>✨</Text>
          <View style={styles.aiExerciseInfoContent}>
            <Text style={styles.aiExerciseInfoTitle}>Exercises Generated by AI</Text>
            <Text style={styles.aiExerciseInfoDesc}>
              Based on your {selectedSplit?.label || 'selected'} split, our AI will automatically generate the best exercises for each workout day — including sets, reps, rest times, and calorie estimates.
            </Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Plan Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Workout days</Text>
            <Text style={styles.summaryValue}>{selectedDays.length} days/week</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Exercise time</Text>
            <Text style={styles.summaryValue}>🕐 {exerciseTime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Goal</Text>
            <Text style={styles.summaryValue}>{formatLabel(goal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Difficulty</Text>
            <Text style={styles.summaryValue}>{formatLabel(difficulty)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Workout split</Text>
            <Text style={styles.summaryValue}>{selectedSplit?.label || '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Exercises</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>🤖 AI Generated</Text>
          </View>
        </View>

        {/* Generate Plan Button */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleGenerate}
        >
          <Text style={styles.generateBtnText}>🚀 {t('workoutSetup.generateWorkoutPlan')}</Text>
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
  backText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  content: { flex: 1, padding: spacing.lg },
  aiBadge: {
    flexDirection: 'row', backgroundColor: colors.primary + '10', borderRadius: borderRadius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.primary + '30', alignItems: 'center',
  },
  aiBadgeIcon: { fontSize: 32, marginRight: spacing.md },
  aiBadgeContent: { flex: 1 },
  aiBadgeTitle: { ...typography.body, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  aiBadgeDesc: { ...typography.caption, color: colors.text.secondary, lineHeight: 18 },
  sectionTitle: { ...typography.h3, color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionHint: { ...typography.caption, color: colors.text.light, marginBottom: spacing.sm },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  radioItem: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    minWidth: '30%', flex: 1, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', ...shadows.sm,
  },
  radioItemSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  radioLabel: { ...typography.body, fontWeight: '600', color: colors.text.primary, textAlign: 'center' },
  radioLabelSelected: { color: colors.primary },
  nameInput: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    ...typography.body, color: colors.text.primary, borderWidth: 1, borderColor: colors.border || '#e0e0e0',
  },
  // Workout Split
  splitCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 2, borderColor: 'transparent', ...shadows.sm,
  },
  splitCardSelected: {
    borderColor: colors.primary, backgroundColor: colors.primary + '08',
  },
  splitCardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs,
  },
  splitRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: colors.text.light, marginRight: spacing.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  splitRadioSelected: {
    borderColor: colors.primary,
  },
  splitRadioDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary,
  },
  splitLabel: {
    ...typography.body, fontWeight: '700', color: colors.text.primary,
  },
  splitLabelSelected: {
    color: colors.primary,
  },
  splitDesc: {
    ...typography.bodySmall, color: colors.text.secondary, marginLeft: 34, marginBottom: spacing.xs,
  },
  splitExampleBox: {
    backgroundColor: colors.background, borderRadius: borderRadius.sm, padding: spacing.sm,
    marginLeft: 34,
  },
  splitExampleText: {
    ...typography.caption, color: colors.text.light, fontStyle: 'italic', lineHeight: 18,
  },
  // Day selection
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dayChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full || 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border || '#e0e0e0',
  },
  dayChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '600' },
  dayChipTextSelected: { color: colors.text.inverse },
  // Weekly cycle preview
  cyclePreview: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginTop: spacing.lg, ...shadows.sm, borderWidth: 1, borderColor: colors.border || '#e0e0e0',
  },
  cyclePreviewTitle: { ...typography.body, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.md },
  cycleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border || '#e0e0e0',
  },
  cycleDayName: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary, width: 90 },
  cycleSource: { ...typography.bodySmall, flex: 1, textAlign: 'right' },
  // Time
  timeRow: { marginBottom: spacing.md, maxHeight: 44 },
  timeChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border || '#e0e0e0',
    marginRight: spacing.sm,
  },
  timeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeChipText: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '600' },
  timeChipTextSelected: { color: colors.text.inverse, fontWeight: '700' },
  // AI Exercise Info
  aiExerciseInfo: {
    flexDirection: 'row', backgroundColor: colors.success + '10', borderRadius: borderRadius.lg,
    padding: spacing.md, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.success + '30',
    alignItems: 'center',
  },
  aiExerciseInfoIcon: { fontSize: 28, marginRight: spacing.md },
  aiExerciseInfoContent: { flex: 1 },
  aiExerciseInfoTitle: { ...typography.body, fontWeight: '700', color: colors.success, marginBottom: 2 },
  aiExerciseInfoDesc: { ...typography.caption, color: colors.text.secondary, lineHeight: 18 },
  // Summary
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginTop: spacing.xl, ...shadows.sm,
  },
  summaryTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs,
    borderBottomWidth: 0.5, borderBottomColor: colors.border || '#e0e0e0',
  },
  summaryLabel: { ...typography.bodySmall, color: colors.text.secondary },
  summaryValue: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '600' },
  // Generate button
  generateBtn: {
    backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg,
    alignItems: 'center', marginTop: spacing.xl, ...shadows.md,
  },
  generateBtnText: { ...typography.h3, color: colors.text.inverse },
  // Validation
  errorText: {
    ...typography.bodySmall,
    color: '#EF4444',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
});

export default WorkoutSetupScreen;

