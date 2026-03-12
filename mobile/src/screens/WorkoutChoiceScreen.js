import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';

const WorkoutChoiceScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Plan</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Workout Style</Text>
        <Text style={styles.subtitle}>Pick the option that works best for you</Text>

        {/* Subscribe Now - AI Generated */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('WorkoutSetup')}
          activeOpacity={0.85}
        >
          <View style={styles.optionIconContainer}>
            <Text style={styles.optionIcon}>🤖</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Subscribe Now</Text>
            <Text style={styles.optionDescription}>
              Get a personalized AI-generated workout plan tailored to your goals, fitness level, and preferences.
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✅ AI-powered personalization</Text>
              <Text style={styles.featureItem}>✅ Auto-generated sets & reps</Text>
              <Text style={styles.featureItem}>✅ Smart progression & adjustment</Text>
              <Text style={styles.featureItem}>✅ Motivational quotes & tracking</Text>
            </View>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Free Service - Manual Workout */}
        <TouchableOpacity
          style={[styles.optionCard, styles.freeCard]}
          onPress={() => navigation.navigate('FreeWorkoutBuilder')}
          activeOpacity={0.85}
        >
          <View style={[styles.optionIconContainer, styles.freeIconContainer]}>
            <Text style={styles.optionIcon}>📝</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Free Service</Text>
            <Text style={styles.optionDescription}>
              Create your own custom workout plan. Add exercises, set your reps & weights, and track your performance over time.
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✅ Build your own plan</Text>
              <Text style={styles.featureItem}>✅ Track sets, reps & weight</Text>
              <Text style={styles.featureItem}>✅ View last session performance</Text>
              <Text style={styles.featureItem}>✅ Edit & adjust anytime</Text>
            </View>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backButton: { padding: spacing.xs },
  backText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  content: { flex: 1, padding: spacing.lg },
  title: { ...typography.h2, color: colors.text.primary, textAlign: 'center', marginTop: spacing.lg },
  subtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl },
  optionCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 2, borderColor: colors.primary + '30', ...shadows.md,
  },
  freeCard: { borderColor: colors.success + '30' },
  optionIconContainer: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  freeIconContainer: { backgroundColor: colors.success + '15' },
  optionIcon: { fontSize: 28 },
  optionContent: { flex: 1 },
  optionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.xs },
  optionDescription: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.sm, lineHeight: 20 },
  featureList: { marginTop: spacing.xs },
  featureItem: { ...typography.caption, color: colors.text.secondary, marginBottom: 3, lineHeight: 18 },
  freeBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.success, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: spacing.sm,
  },
  freeBadgeText: { ...typography.caption, color: '#FFF', fontWeight: '700' },
  arrowContainer: { justifyContent: 'center', paddingLeft: spacing.sm },
  arrow: { fontSize: 20, color: colors.text.secondary },
});

export default WorkoutChoiceScreen;

