import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlans, fetchActiveSubscription, createSubscription } from '../store/slices/subscriptionSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import { useTranslation } from '../i18n';

const SubscriptionPlansScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { plans, activeSubscription, loading } = useSelector((state) => state.subscription);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    dispatch(fetchPlans());
    dispatch(fetchActiveSubscription());
  }, []);

  // Find the 3-month ₹899 plan from backend
  const quarterlyPlan = plans.find((p) => p.durationMonths === 3 && p.price > 0) || plans.find((p) => p.price > 0);
  const planPrice = quarterlyPlan?.price || 899;
  const planName = quarterlyPlan?.name || t('subscriptionScreen.quarterlyTransformation');

  const isAlreadySubscribed = activeSubscription && activeSubscription.status === 'ACTIVE';

  const PLAN_FEATURES = [
    { icon: '🏋️', title: t('subscriptionScreen.monthlyWorkoutPlan'), desc: t('subscriptionScreen.monthlyWorkoutDesc') },
    { icon: '🥗', title: t('subscriptionScreen.monthlyNutritionPlan'), desc: t('subscriptionScreen.monthlyNutritionDesc') },
    { icon: '🍽️', title: t('subscriptionScreen.mealModifications'), desc: t('subscriptionScreen.mealModDesc') },
    { icon: '🔄', title: t('subscriptionScreen.workoutRegeneration'), desc: t('subscriptionScreen.workoutRegenDesc') },
    { icon: '📞', title: t('subscriptionScreen.contactTrainer'), desc: t('subscriptionScreen.contactTrainerDesc') },
    { icon: '🤖', title: t('subscriptionScreen.aiPoweredPlans'), desc: t('subscriptionScreen.aiPoweredDesc') },
  ];

  const handleSubscribe = async () => {
    if (!quarterlyPlan) {
      Alert.alert(t('common.error'), t('subscriptionScreen.planNotAvailable'));
      return;
    }

    setSubscribing(true);
    try {
      const result = await dispatch(createSubscription(quarterlyPlan.id)).unwrap();
      navigation.navigate('Payment', {
        subscription: result,
        plan: quarterlyPlan,
      });
    } catch (error) {
      Alert.alert(t('common.error'), error || t('common.failed'));
    } finally {
      setSubscribing(false);
    }
  };

  if (loading && plans.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('subscriptionScreen.loadingPlan')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('subscriptionScreen.premiumPlan')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Already subscribed banner */}
        {isAlreadySubscribed && (
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerEmoji}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeBannerTitle}>{t('subscriptionScreen.premiumMember')}</Text>
              <Text style={styles.activeBannerDates}>
                {activeSubscription.startDate} — {activeSubscription.endDate}
              </Text>
            </View>
          </View>
        )}

        {/* Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PREMIUM ✨</Text>
          </View>

          <Text style={styles.planName}>{planName}</Text>
          <Text style={styles.planTagline}>{t('subscriptionScreen.threeMonthsAiPowered')}</Text>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{planPrice}</Text>
              <Text style={styles.pricePeriod}> {t('subscriptionScreen.threeMonths')}</Text>
            </View>
            <View style={styles.perMonthBadge}>
              <Text style={styles.perMonthText}>≈ ₹{Math.round(planPrice / 3)}{t('subscriptionScreen.perMonth')}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Features */}
          <Text style={styles.featuresTitle}>{t('subscriptionScreen.whatYouGet')}</Text>
          {PLAN_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Comparison: Free vs Premium */}
        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>{t('subscriptionScreen.freeVsPremium')}</Text>
          <View style={styles.comparisonHeader}>
            <Text style={[styles.comparisonCol, { flex: 2 }]}>{t('subscriptionScreen.feature')}</Text>
            <Text style={[styles.comparisonCol, styles.comparisonCenter]}>{t('subscription.free')}</Text>
            <Text style={[styles.comparisonCol, styles.comparisonCenter, { color: '#F59E0B' }]}>{t('subscription.premium')}</Text>
          </View>
          {[
            { feature: t('subscriptionScreen.buildOwnWorkout'), free: '✅', premium: '✅' },
            { feature: t('subscriptionScreen.buildOwnNutrition'), free: '✅', premium: '✅' },
            { feature: t('subscriptionScreen.aiWorkoutPlans'), free: '❌', premium: '✅' },
            { feature: t('subscriptionScreen.aiNutritionPlans'), free: '❌', premium: '✅' },
            { feature: t('subscriptionScreen.monthlyPlanRefresh'), free: '❌', premium: '✅' },
            { feature: t('subscriptionScreen.mealModifications'), free: '❌', premium: '10/mo' },
            { feature: t('subscriptionScreen.planRegeneration'), free: '❌', premium: '2/mo' },
            { feature: t('subscriptionScreen.contactTrainer'), free: '❌', premium: '✅' },
          ].map((row, idx) => (
            <View key={idx} style={[styles.comparisonRow, idx % 2 === 0 && styles.comparisonRowAlt]}>
              <Text style={[styles.comparisonCell, { flex: 2 }]}>{row.feature}</Text>
              <Text style={[styles.comparisonCell, styles.comparisonCenter]}>{row.free}</Text>
              <Text style={[styles.comparisonCell, styles.comparisonCenter]}>{row.premium}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      {!isAlreadySubscribed && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.subscribeButton, subscribing && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            disabled={subscribing || !quarterlyPlan}
          >
            {subscribing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.subscribeButtonText}>{t('subscription.subscribe')} ₹{planPrice} →</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.bottomHint}>{t('subscriptionScreen.oneTimePayment')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.xxl + spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  backButton: { padding: spacing.sm },
  backButtonText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  content: { flex: 1, paddingHorizontal: spacing.md },

  // Active subscription banner
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '15',
    borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.md,
    borderWidth: 1.5, borderColor: colors.success,
  },
  activeBannerEmoji: { fontSize: 28, marginRight: spacing.md },
  activeBannerTitle: { ...typography.body, fontWeight: 'bold', color: colors.text.primary },
  activeBannerDates: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },

  // Plan card
  planCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginTop: spacing.md, borderWidth: 2, borderColor: '#F59E0B', ...shadows.md,
  },
  premiumBadge: {
    backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: borderRadius.sm, alignSelf: 'flex-start', marginBottom: spacing.sm,
  },
  premiumBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  planName: { ...typography.h2, color: colors.text.primary, fontWeight: '800', marginBottom: 2 },
  planTagline: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.md },

  // Price
  priceSection: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 36, fontWeight: '900', color: colors.text.primary },
  pricePeriod: { ...typography.body, color: colors.text.secondary, fontWeight: '500' },
  perMonthBadge: {
    backgroundColor: colors.success + '18', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: borderRadius.sm, marginLeft: spacing.sm,
  },
  perMonthText: { ...typography.caption, color: colors.success, fontWeight: '700' },

  // Divider
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },

  // Features
  featuresTitle: { ...typography.body, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  featureIcon: { fontSize: 20, marginRight: 12, width: 26, textAlign: 'center', marginTop: 1 },
  featureContent: { flex: 1 },
  featureTitle: { ...typography.body, fontWeight: '700', color: colors.text.primary, marginBottom: 2 },
  featureDesc: { ...typography.caption, color: colors.text.secondary, lineHeight: 18 },

  // Comparison card
  comparisonCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginTop: spacing.md, ...shadows.sm,
  },
  comparisonTitle: { ...typography.h3, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.md },
  comparisonHeader: { flexDirection: 'row', paddingBottom: spacing.sm, borderBottomWidth: 2, borderBottomColor: colors.border },
  comparisonCol: { ...typography.caption, fontWeight: '800', color: colors.text.primary, flex: 1 },
  comparisonCenter: { textAlign: 'center' },
  comparisonRow: { flexDirection: 'row', paddingVertical: 8 },
  comparisonRowAlt: { backgroundColor: colors.background, marginHorizontal: -spacing.sm, paddingHorizontal: spacing.sm, borderRadius: 4 },
  comparisonCell: { ...typography.caption, color: colors.text.primary, flex: 1, lineHeight: 18 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: colors.border, ...shadows.md,
  },
  subscribeButton: {
    backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center', ...shadows.sm,
  },
  subscribeButtonDisabled: { opacity: 0.6 },
  subscribeButtonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  bottomHint: { ...typography.caption, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
});

export default SubscriptionPlansScreen;

