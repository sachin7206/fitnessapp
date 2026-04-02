import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';

const FEATURES = [
  { icon: '🏋️', text: 'New workout & nutrition plan every month (3 total)' },
  { icon: '🍽️', text: 'Modify up to 10 meals per month' },
  { icon: '🔄', text: 'Regenerate workout plan 2 times per month' },
  { icon: '📞', text: 'Direct Contact Trainer support' },
];

const PremiumSubscriptionBanner = ({ onSubscribe }) => {
  return (
    <View style={styles.banner}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>PREMIUM ✨</Text>
        </View>
      </View>

      <Text style={styles.planName}>Quarterly Transformation</Text>
      <Text style={styles.planTagline}>3 months of AI-powered fitness & nutrition</Text>

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹899</Text>
        <Text style={styles.priceDuration}> / 3 months</Text>
        <View style={styles.perMonthBadge}>
          <Text style={styles.perMonthText}>≈ ₹300/mo</Text>
        </View>
      </View>

      {/* Features */}
      <View style={styles.featuresList}>
        {FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      {/* CTA Button */}
      <TouchableOpacity style={styles.ctaButton} onPress={onSubscribe} activeOpacity={0.85}>
        <Text style={styles.ctaButtonText}>Upgrade to Premium →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: '#F59E0B',
    ...shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  premiumBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  premiumBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planName: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '800',
    marginBottom: 2,
  },
  planTagline: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text.primary,
  },
  priceDuration: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  perMonthBadge: {
    backgroundColor: colors.success + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  perMonthText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  featuresList: {
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 22,
    textAlign: 'center',
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default PremiumSubscriptionBanner;

