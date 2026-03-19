import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlans, fetchActiveSubscription, createSubscription } from '../store/slices/subscriptionSlice';
import { colors, spacing } from '../config/theme';

const { width } = Dimensions.get('window');

// Built-in free plan — maps to the existing FreeWorkoutBuilder flow
const FREE_PLAN = {
  id: 'free',
  name: 'Free Plan',
  description: 'Build your own custom workout. Add exercises, set reps & weights, track your progress — all for free, forever.',
  durationMonths: null,
  price: 0,
  currency: 'INR',
  features: '["Build Your Own Plan","Track Sets, Reps & Weight","View Last Session Performance","Edit & Adjust Anytime","Exercise Progress Charts"]',
};

const SubscriptionPlansScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { plans, activeSubscription, loading } = useSelector((state) => state.subscription);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    dispatch(fetchPlans());
    dispatch(fetchActiveSubscription());
  }, []);

  // Auto-select the recommended (3-month) paid plan by default
  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      const recommended = plans.find((p) => p.durationMonths === 3) || plans[0];
      setSelectedPlan(recommended.id);
    }
  }, [plans]);

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert('Select a Plan', 'Please select a subscription plan to continue.');
      return;
    }

    // Free plan → go directly to FreeWorkoutBuilder (no subscription/payment needed)
    if (selectedPlan === 'free') {
      navigation.navigate('FreeWorkoutBuilder');
      return;
    }

    // Paid plan → create subscription → go to payment
    setSubscribing(true);
    try {
      const plan = plans.find((p) => p.id === selectedPlan);
      const result = await dispatch(createSubscription(selectedPlan)).unwrap();
      navigation.navigate('Payment', {
        subscription: result,
        plan,
      });
    } catch (error) {
      Alert.alert('Error', error || 'Failed to create subscription. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const parseFeatures = (featuresStr) => {
    try {
      return JSON.parse(featuresStr);
    } catch {
      return [];
    }
  };

  if (loading && plans.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  // Combine: hardcoded Free plan first, then paid plans from backend (filter out any backend free plans to avoid duplicates)
  const paidPlans = plans.filter((p) => p.price > 0);
  const allPlans = [FREE_PLAN, ...paidPlans];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeSubscription && (
          <View style={styles.currentPlanBanner}>
            <View style={styles.currentPlanBadge}>
              <Text style={styles.currentPlanBadgeText}>CURRENT PLAN</Text>
            </View>
            <View style={styles.currentPlanRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.currentPlanName}>{activeSubscription.planName || 'Free Plan'}</Text>
                {activeSubscription.planPrice > 0 && activeSubscription.startDate ? (
                  <Text style={styles.currentPlanDates}>
                    {activeSubscription.startDate + ' — ' + activeSubscription.endDate}
                  </Text>
                ) : (
                  <Text style={styles.currentPlanDates}>No expiry — free forever</Text>
                )}
              </View>
              <View style={styles.currentPlanStatusBadge}>
                <Text style={styles.currentPlanStatusText}>Active</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.subtitle}>
          {activeSubscription
            ? 'Upgrade your plan for more features and AI-powered workouts!'
            : 'Unlock personalized AI workout plans, nutrition guidance, and more!'}
        </Text>

        {allPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isFree = plan.id === 'free';
          const isRecommended = !isFree && plan.durationMonths === 3 && plan.price > 0;
          const features = parseFeatures(plan.features);
          const isCurrentPlan = activeSubscription && (
            (isFree && (activeSubscription.planName || '').toLowerCase().includes('free')) ||
            (!isFree && activeSubscription.planId === plan.id)
          );

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isSelected && !isCurrentPlan && styles.planCardSelected,
                isRecommended && styles.planCardRecommended,
                isFree && !isCurrentPlan && styles.planCardFree,
                isCurrentPlan && styles.planCardCurrent,
              ]}
              onPress={() => { if (!isCurrentPlan) setSelectedPlan(plan.id); }}
              activeOpacity={isCurrentPlan ? 1 : 0.7}
            >
              {isFree && !isCurrentPlan && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE FOREVER</Text>
                </View>
              )}
              {isCurrentPlan && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>YOUR CURRENT PLAN</Text>
                </View>
              )}
              {isRecommended && !isCurrentPlan && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, isSelected && !isCurrentPlan && styles.planNameSelected]}>
                    {plan.name}
                  </Text>
                  <Text style={styles.planDuration}>
                    {isFree ? 'No expiry — use forever' : plan.durationMonths + ' month' + (plan.durationMonths > 1 ? 's' : '')}
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  {isFree ? (
                    <Text style={[styles.planPrice, { color: colors.success }]}>FREE</Text>
                  ) : (
                    <>
                      <Text style={[styles.planPrice, isSelected && !isCurrentPlan && styles.planPriceSelected]}>
                        {'₹' + plan.price}
                      </Text>
                      {plan.durationMonths > 1 && (
                        <Text style={styles.perMonth}>{'₹' + Math.round(plan.price / plan.durationMonths) + '/mo'}</Text>
                      )}
                    </>
                  )}
                </View>
              </View>

              <Text style={styles.planDescription}>{plan.description}</Text>

              {features.length > 0 && (
                <View style={styles.featuresList}>
                  {features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Text style={styles.featureCheck}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}

              {isSelected && !isCurrentPlan && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>● Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            subscribing && styles.subscribeButtonDisabled,
            selectedPlan === 'free' && styles.subscribeButtonFree,
          ]}
          onPress={handleSubscribe}
          disabled={subscribing || !selectedPlan}
        >
          {subscribing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.subscribeButtonText}>
              {selectedPlan === 'free'
                ? 'Start Free — Build Your Plan'
                : activeSubscription ? 'Upgrade Plan' : 'Continue to Payment'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: 50, paddingBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  backButton: { padding: spacing.sm },
  backButtonText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text.inverse },
  content: { flex: 1, paddingHorizontal: spacing.md },
  subtitle: { fontSize: 15, color: colors.text.secondary, textAlign: 'center', marginVertical: spacing.md, lineHeight: 22 },
  currentPlanBanner: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: spacing.md, marginTop: spacing.md, borderWidth: 1.5, borderColor: colors.success },
  currentPlanBadge: { backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: spacing.sm },
  currentPlanBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  currentPlanRow: { flexDirection: 'row', alignItems: 'center' },
  currentPlanName: { fontSize: 17, fontWeight: 'bold', color: colors.text.primary },
  currentPlanDates: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  currentPlanStatusBadge: { backgroundColor: '#06D6A020', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currentPlanStatusText: { fontSize: 12, fontWeight: '600', color: colors.success },
  planCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 2, borderColor: '#E9ECEF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  planCardSelected: { borderColor: colors.primary, backgroundColor: '#FFF5F0' },
  planCardRecommended: { borderColor: colors.accent },
  planCardFree: { borderColor: colors.success },
  planCardCurrent: { borderColor: colors.success, backgroundColor: '#F0FAF0', opacity: 0.7 },
  freeBadge: { backgroundColor: colors.success, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: spacing.sm },
  freeBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  currentBadge: { backgroundColor: colors.success, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: spacing.sm },
  currentBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  recommendedBadge: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: spacing.sm },
  recommendedBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  planName: { fontSize: 20, fontWeight: 'bold', color: colors.text.primary },
  planNameSelected: { color: colors.primary },
  planDuration: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  planPrice: { fontSize: 28, fontWeight: 'bold', color: colors.text.primary },
  planPriceSelected: { color: colors.primary },
  perMonth: { fontSize: 12, color: colors.success, fontWeight: '600', marginTop: 2 },
  planDescription: { fontSize: 13, color: colors.text.secondary, lineHeight: 20, marginBottom: spacing.md },
  featuresList: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: spacing.sm },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  featureCheck: { color: colors.success, fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  featureText: { fontSize: 13, color: colors.text.primary },
  selectedIndicator: { marginTop: spacing.sm, alignItems: 'center' },
  selectedIndicatorText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.md, paddingBottom: 34, borderTopWidth: 1, borderTopColor: '#E9ECEF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 },
  subscribeButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subscribeButtonDisabled: { opacity: 0.6 },
  subscribeButtonFree: { backgroundColor: colors.success },
  subscribeButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default SubscriptionPlansScreen;



