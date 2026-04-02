import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/core';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import subscriptionService from '../services/subscriptionService';
import workoutService from '../services/workoutService';
import PremiumSubscriptionBanner from './components/PremiumSubscriptionBanner';
import { useTranslation } from '../i18n';

const WorkoutChoiceScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [remainingPlans, setRemainingPlans] = useState(null);
  const [maxPlans, setMaxPlans] = useState(null);

  // Re-check subscription every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkSubscription();
    }, [])
  );

  const checkSubscription = async () => {
    try {
      const response = await subscriptionService.getActiveSubscription();
      // Handle ApiResponse wrapper: { status, data: { id, status, ... } }
      const sub = response?.data || response;
      const isActive = !!(sub && (sub.status === 'ACTIVE' || sub.planName));
      setHasSubscription(isActive);

      if (isActive && sub) {
        const maxGen = sub.maxPlanGenerations || sub.durationMonths || 3;
        setMaxPlans(maxGen);
        if (sub.startDate) {
          try {
            const countResp = await workoutService.getAiPlanCount(sub.startDate);
            const count = countResp?.count ?? 0;
            setRemainingPlans(Math.max(0, maxGen - count));
          } catch (err) {
            setRemainingPlans(maxGen);
          }
        } else {
          setRemainingPlans(maxGen);
        }
      }
    } catch (e) {
      setHasSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('workout.title')}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('workout.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('workout.chooseStyle')}</Text>
        <Text style={styles.subtitle}>{t('workout.pickOption')}</Text>

        {/* Premium Subscription Banner — shown only when NOT subscribed */}
        {!hasSubscription && (
          <PremiumSubscriptionBanner
            onSubscribe={() => navigation.navigate('SubscriptionPlans')}
          />
        )}

        {/* AI Generated Workout — shown only when subscribed AND has remaining plans */}
        {hasSubscription && remainingPlans !== null && remainingPlans > 0 && (
          <TouchableOpacity
            style={[styles.optionCard, styles.subscribedCard]}
            onPress={() => navigation.navigate('WorkoutSetup')}
            activeOpacity={0.85}
          >
            <View style={[styles.optionIconContainer, styles.subscribedIconContainer]}>
              <Text style={styles.optionIcon}>🚀</Text>
            </View>
            <View style={styles.optionContent}>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{t('nutrition.premiumActive')} ✅</Text>
              </View>
              <Text style={styles.optionTitle}>{t('workout.generateAiWorkout')}</Text>
              <Text style={styles.optionDescription}>
                {t('workout.aiWorkoutDesc')}
              </Text>
              <View style={styles.remainingBadge}>
                <Text style={styles.remainingBadgeText}>
                  {remainingPlans} of {maxPlans} plan{maxPlans !== 1 ? 's' : ''} remaining
                </Text>
              </View>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>✅ {t('workout.aiPowered')}</Text>
                <Text style={styles.featureItem}>✅ {t('workout.customSchedule')}</Text>
                <Text style={styles.featureItem}>✅ {t('workout.restDayPlanning')}</Text>
              </View>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Show exhausted message when subscribed but no remaining plans */}
        {hasSubscription && remainingPlans !== null && remainingPlans <= 0 && (
          <View style={[styles.optionCard, styles.exhaustedCard]}>
            <View style={[styles.optionIconContainer, { backgroundColor: colors.text.secondary + '15' }]}>
              <Text style={styles.optionIcon}>🔒</Text>
            </View>
            <View style={styles.optionContent}>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{t('nutrition.premiumActive')} ✅</Text>
              </View>
              <Text style={styles.optionTitle}>{t('workout.aiWorkoutPlans')}</Text>
              <Text style={styles.optionDescription}>
                {t('workout.usedAllWorkouts', { max: maxPlans })}
              </Text>
              <View style={styles.exhaustedBadge}>
                <Text style={styles.exhaustedBadgeText}>0 of {maxPlans} plans remaining</Text>
              </View>
            </View>
          </View>
        )}

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
            <Text style={styles.optionTitle}>{t('nutrition.freeService')}</Text>
            <Text style={styles.optionDescription}>
              {t('workout.freeServiceDesc')}
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✅ {t('workout.buildOwnWorkout')}</Text>
              <Text style={styles.featureItem}>✅ {t('workout.addCustomExercises')}</Text>
              <Text style={styles.featureItem}>✅ {t('workout.setSetsReps')}</Text>
              <Text style={styles.featureItem}>✅ {t('workout.fullControlWorkout')}</Text>
            </View>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>{t('common.free')}</Text>
            </View>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: spacing.lg }} />
      </ScrollView>
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
  subscribedCard: { borderColor: colors.success, backgroundColor: colors.success + '06' },
  exhaustedCard: { borderColor: colors.text.secondary + '30', backgroundColor: colors.surface, opacity: 0.7 },
  freeCard: { borderColor: colors.success + '30' },
  optionIconContainer: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  subscribedIconContainer: { backgroundColor: colors.success + '15' },
  freeIconContainer: { backgroundColor: colors.success + '15' },
  optionIcon: { fontSize: 28 },
  optionContent: { flex: 1 },
  optionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.xs },
  optionDescription: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.sm, lineHeight: 20 },
  featureList: { marginTop: spacing.xs },
  featureItem: { ...typography.caption, color: colors.text.secondary, marginBottom: 3, lineHeight: 18 },
  activeBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.success, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 3, marginBottom: spacing.sm,
  },
  activeBadgeText: { ...typography.caption, color: '#FFF', fontWeight: '700' },
  premiumBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: spacing.sm,
  },
  premiumBadgeText: { ...typography.caption, color: '#FFF', fontWeight: '700' },
  freeBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.success, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: spacing.sm,
  },
  freeBadgeText: { ...typography.caption, color: '#FFF', fontWeight: '700' },
  remainingBadge: {
    alignSelf: 'flex-start', backgroundColor: '#2563EB', borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 3, marginTop: spacing.xs, marginBottom: spacing.xs,
  },
  remainingBadgeText: { ...typography.caption, color: '#FFF', fontWeight: '700' },
  exhaustedBadge: {
    alignSelf: 'flex-start', backgroundColor: '#EF4444', borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 3, marginTop: spacing.xs,
  },
  exhaustedBadgeText: { ...typography.caption, color: '#FFF', fontWeight: '700' },
  arrowContainer: { justifyContent: 'center', paddingLeft: spacing.sm },
  arrow: { fontSize: 20, color: colors.text.secondary },
});

export default WorkoutChoiceScreen;

