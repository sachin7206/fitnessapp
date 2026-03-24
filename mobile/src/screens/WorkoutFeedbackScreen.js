import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../config/theme';
import workoutService from '../services/workoutService';

const WorkoutFeedbackScreen = ({ navigation }) => {
  const [difficulty, setDifficulty] = useState(null);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [completionPct, setCompletionPct] = useState(100);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [adjustResult, setAdjustResult] = useState(null);
  const [showAdjust, setShowAdjust] = useState(false);

  const difficulties = [
    { value: 'TOO_EASY', label: '😎 Too Easy', color: '#22C55E' },
    { value: 'JUST_RIGHT', label: '💪 Just Right', color: '#374151' },
    { value: 'TOO_HARD', label: '😰 Too Hard', color: '#EF4444' },
  ];

  const submitFeedback = async () => {
    if (!difficulty) {
      Alert.alert('Required', 'Please select workout difficulty');
      return;
    }
    if (energyLevel < 1 || energyLevel > 10) {
      Alert.alert('Invalid Input', 'Energy level must be between 1 and 10');
      return;
    }
    if (completionPct < 0 || completionPct > 100) {
      Alert.alert('Invalid Input', 'Completion percentage must be between 0 and 100');
      return;
    }
    if (notes.length > 1000) {
      Alert.alert('Too Long', 'Notes must be 1000 characters or less');
      return;
    }
    setLoading(true);
    try {
      await workoutService.submitWorkoutFeedback({
        difficulty,
        energyLevel,
        completionPercentage: completionPct,
        notes,
      });
      Alert.alert('Success', 'Feedback recorded! This helps optimize your future workouts.');
      setDifficulty(null);
      setNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    }
    setLoading(false);
  };

  const getAdjustment = async () => {
    setShowAdjust(true);
    setLoading(true);
    try {
      const result = await workoutService.adjustWorkoutProgression();
      setAdjustResult(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to get workout adjustment');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>💪 Workout Feedback</Text>
        <Text style={styles.subtitle}>Help us optimize your workout</Text>
      </View>

      {/* Difficulty */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How was your workout?</Text>
        <View style={styles.difficultyRow}>
          {difficulties.map(d => (
            <TouchableOpacity
              key={d.value}
              style={[styles.difficultyBtn, difficulty === d.value && { backgroundColor: d.color, borderColor: d.color }]}
              onPress={() => setDifficulty(d.value)}
            >
              <Text style={[styles.difficultyText, difficulty === d.value && styles.difficultyTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Energy Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Energy Level: {energyLevel}/10</Text>
        <View style={styles.sliderRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.energyDot, energyLevel >= n && styles.energyDotActive]}
              onPress={() => setEnergyLevel(n)}
            >
              <Text style={[styles.energyText, energyLevel >= n && styles.energyTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Completion */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Completion: {completionPct}%</Text>
        <View style={styles.completionRow}>
          {[25, 50, 75, 100].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.completionBtn, completionPct === p && styles.completionBtnActive]}
              onPress={() => setCompletionPct(p)}
            >
              <Text style={[styles.completionText, completionPct === p && styles.completionTextActive]}>
                {p}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any specific exercise felt too hard? Joint pain?"
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={1000}
          placeholderTextColor={colors.text.secondary}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.disabledBtn]}
        onPress={submitFeedback}
        disabled={loading}
      >
        {loading && !showAdjust ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>📝 Submit Feedback</Text>
        )}
      </TouchableOpacity>

      {/* AI Adjustment */}
      <TouchableOpacity style={styles.adjustBtn} onPress={getAdjustment}>
        <Text style={styles.adjustBtnText}>🤖 Get AI Workout Adjustment</Text>
      </TouchableOpacity>

      {showAdjust && adjustResult && (
        <View style={styles.adjustCard}>
          <Text style={styles.adjustTitle}>AI Recommendation</Text>
          <Text style={styles.adjustReasoning}>{adjustResult.reasoning}</Text>
          {adjustResult.adjustedExercises?.map((ex, idx) => (
            <View key={idx} style={styles.adjustExercise}>
              <Text style={styles.adjustExName}>{ex.exerciseName}</Text>
              <Text style={styles.adjustChange}>
                {ex.previousSets}×{ex.previousReps} → {ex.newSets}×{ex.newReps}
              </Text>
              <Text style={styles.adjustReason}>{ex.changeReason}</Text>
            </View>
          ))}
          {adjustResult.fromAi && <Text style={styles.aiTag}>🤖 AI Powered</Text>}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingTop: 50, backgroundColor: '#FF5722' },
  backText: { color: '#fff', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  section: { margin: spacing.lg, marginBottom: 0, backgroundColor: '#fff', borderRadius: borderRadius.md, padding: spacing.lg, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  difficultyRow: { flexDirection: 'row', gap: 10 },
  difficultyBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center' },
  difficultyText: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },
  difficultyTextActive: { color: '#fff' },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  energyDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  energyDotActive: { backgroundColor: colors.primary },
  energyText: { fontSize: 11, color: colors.text.secondary },
  energyTextActive: { color: '#fff', fontWeight: 'bold' },
  completionRow: { flexDirection: 'row', gap: 10 },
  completionBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  completionBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  completionText: { fontWeight: '600', color: colors.text.secondary },
  completionTextActive: { color: '#fff' },
  notesInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: borderRadius.sm, padding: spacing.md, minHeight: 60, textAlignVertical: 'top' },
  submitBtn: { marginHorizontal: spacing.lg, marginTop: spacing.lg, backgroundColor: '#FF5722', paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  adjustBtn: { marginHorizontal: spacing.lg, marginTop: spacing.md, paddingVertical: 14, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center' },
  adjustBtnText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  adjustCard: { margin: spacing.lg, backgroundColor: '#fff', borderRadius: borderRadius.md, padding: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.primary, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  adjustTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.sm },
  adjustReasoning: { fontSize: 14, color: colors.text.secondary, marginBottom: spacing.md, lineHeight: 20 },
  adjustExercise: { paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  adjustExName: { fontWeight: '600', fontSize: 14 },
  adjustChange: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 2 },
  adjustReason: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  aiTag: { fontSize: 11, color: colors.primary, marginTop: spacing.sm, alignSelf: 'flex-end' },
});

export default WorkoutFeedbackScreen;

