import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { fetchActiveSubscription } from '../store/slices/subscriptionSlice';
import { colors, spacing } from '../config/theme';

const PaymentSuccessScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { payment, plan, subscription } = route.params;

  useEffect(() => {
    // Refresh active subscription
    dispatch(fetchActiveSubscription());
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>🎉</Text>
        </View>

        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>Your subscription has been activated</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan</Text>
            <Text style={styles.detailValue}>{plan?.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {plan?.durationMonths} month{plan?.durationMonths > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.detailValue}>₹{payment?.amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={[styles.detailValue, { fontSize: 12 }]}>{payment?.transactionRef}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>✓ {payment?.status}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.workoutButton}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
            setTimeout(() => navigation.navigate('WorkoutChoice'), 100);
          }}
        >
          <Text style={styles.workoutButtonText}>Start Working Out 💪</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          }}
        >
          <Text style={styles.homeButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  successIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
  },
  successEmoji: { fontSize: 50 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text.primary, marginBottom: spacing.sm },
  subtitle: { fontSize: 16, color: colors.text.secondary, marginBottom: spacing.xl },
  detailsCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, width: '100%',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  detailLabel: { fontSize: 14, color: colors.text.secondary },
  detailValue: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  successBadge: {
    backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
  },
  successBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  workoutButton: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12,
    width: '100%', alignItems: 'center', marginBottom: spacing.md,
  },
  workoutButtonText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  homeButton: {
    paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary,
  },
  homeButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});

export default PaymentSuccessScreen;

