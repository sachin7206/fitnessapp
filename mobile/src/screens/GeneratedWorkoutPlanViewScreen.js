import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
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

const GeneratedWorkoutPlanViewScreen = ({ navigation, route }) => {
  const { plan, exerciseTime } = route.params || {};
  const [assigning, setAssigning] = useState(false);

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

  // Group exercises by day
  const exercisesByDay = {};
  (plan.exercises || []).forEach(ex => {
    const day = ex.dayOfWeek || 'MONDAY';
    if (!exercisesByDay[day]) exercisesByDay[day] = [];
    exercisesByDay[day].push(ex);
  });

  const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const sortedDays = Object.keys(exercisesByDay).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  const totalCalories = (plan.exercises || []).reduce((s, e) => s + (e.caloriesBurned || 0), 0);
  const avgCalPerSession = sortedDays.length > 0 ? Math.round(totalCalories / sortedDays.length) : 0;

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Workout Plan</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <View style={[styles.badge, { backgroundColor: colors.info + '20' }]}>
              <Text style={styles.badgeText}>📅 {plan.daysPerWeek} days/week</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
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
            <Text style={styles.statValue}>{plan.exercises?.length || 0}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatLabel(plan.difficulty)}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Cardio Summary */}
        {plan.cardioCalories > 0 && (
          <View style={styles.cardioSummary}>
            <Text style={styles.cardioTitle}>❤️ Cardio</Text>
            <Text style={styles.cardioDetail}>
              {formatLabel(plan.cardioType)} • {plan.cardioDurationMinutes} min
              {plan.cardioSteps > 0 ? ` • ${plan.cardioSteps} steps` : ''}
              {' • ~'}{plan.cardioCalories} cal burned
            </Text>
          </View>
        )}

        {/* Exercises by Day */}
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        {sortedDays.map(day => {
          const dayExercises = exercisesByDay[day];
          const dayCalories = dayExercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
          return (
            <View key={day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{formatLabel(day)}</Text>
                <Text style={styles.dayCal}>~{dayCalories} cal</Text>
              </View>
              {dayExercises
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((ex, idx) => (
                  <View key={idx} style={styles.exerciseRow}>
                    <Text style={styles.exerciseIcon}>
                      {ex.isCardio ? '❤️' : (MUSCLE_ICONS[ex.muscleGroup] || '💪')}
                    </Text>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                      <Text style={styles.exerciseDetail}>
                        {ex.isCardio
                          ? `${Math.round((ex.durationSeconds || 0) / 60)} min${ex.steps > 0 ? ` • ${ex.steps} steps` : ''}`
                          : `${ex.sets} sets × ${ex.reps} reps • Rest ${ex.restTimeSeconds}s`}
                      </Text>
                      {ex.muscleGroup && !ex.isCardio && (
                        <Text style={styles.exerciseMuscle}>{formatLabel(ex.muscleGroup)}</Text>
                      )}
                    </View>
                    <Text style={styles.exerciseCal}>{ex.caloriesBurned || 0} cal</Text>
                  </View>
                ))}
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Assign Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.assignBtn} onPress={handleAssign} disabled={assigning}>
          {assigning ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.assignBtnText}>🚀 Assign Workout ({plan.durationWeeks} weeks)</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...typography.body, color: colors.text.secondary },
  header: {
    backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  content: { flex: 1, padding: spacing.lg },
  overview: { marginBottom: spacing.lg },
  planName: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  badgeText: { ...typography.bodySmall, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.lg, ...shadows.sm,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.text.secondary },
  cardioSummary: {
    backgroundColor: '#FEF2F2', borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: '#374151',
  },
  cardioTitle: { ...typography.body, fontWeight: '700', color: '#374151', marginBottom: 4 },
  cardioDetail: { ...typography.bodySmall, color: colors.text.secondary },
  sectionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },
  dayCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.md, ...shadows.sm,
  },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dayName: { ...typography.h3, color: colors.primary },
  dayCal: { ...typography.bodySmall, color: colors.text.secondary, fontWeight: '600' },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm,
    borderBottomWidth: 0.5, borderBottomColor: colors.border + '40',
  },
  exerciseIcon: { fontSize: 20, marginRight: spacing.sm },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  exerciseDetail: { ...typography.caption, color: colors.text.secondary },
  exerciseMuscle: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  exerciseCal: { ...typography.bodySmall, color: colors.warning, fontWeight: '600' },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, ...shadows.lg },
  assignBtn: {
    backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  assignBtnText: { ...typography.h3, color: colors.text.inverse },
});

export default GeneratedWorkoutPlanViewScreen;

