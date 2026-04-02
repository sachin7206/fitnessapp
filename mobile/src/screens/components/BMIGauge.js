import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../config/theme';

/**
 * BMI Gauge with colored arc indicator.
 * Bands: Underweight (<18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese (30+)
 *
 * Uses pure RN Views – no SVG dependency needed. Draws a horizontal bar gauge.
 */

const BMI_BANDS = [
  { label: 'Underweight', min: 0, max: 18.5, color: '#3B82F6' },   // Blue
  { label: 'Normal', min: 18.5, max: 24.9, color: '#22C55E' },      // Green
  { label: 'Overweight', min: 25, max: 29.9, color: '#F59E0B' },     // Amber
  { label: 'Obese', min: 30, max: 50, color: '#EF4444' },            // Red
];

const GAUGE_MIN = 10;
const GAUGE_MAX = 45;

const BMIGauge = ({ bmi }) => {
  const clampedBmi = Math.min(GAUGE_MAX, Math.max(GAUGE_MIN, bmi));
  const percentage = ((clampedBmi - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100;

  const currentBand = useMemo(() => {
    if (bmi < 18.5) return BMI_BANDS[0];
    if (bmi < 25) return BMI_BANDS[1];
    if (bmi < 30) return BMI_BANDS[2];
    return BMI_BANDS[3];
  }, [bmi]);

  return (
    <View style={styles.container}>
      {/* BMI Value */}
      <Text style={[styles.bmiValue, { color: currentBand.color }]}>{bmi.toFixed(1)}</Text>
      <Text style={[styles.bmiCategory, { color: currentBand.color }]}>{currentBand.label}</Text>

      {/* Gauge bar */}
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeTrack}>
          {BMI_BANDS.map((band, i) => {
            const startPct = ((Math.max(band.min, GAUGE_MIN) - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100;
            const endPct = ((Math.min(band.max, GAUGE_MAX) - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100;
            return (
              <View
                key={i}
                style={[
                  styles.gaugeBand,
                  {
                    backgroundColor: band.color,
                    flex: endPct - startPct,
                    borderTopLeftRadius: i === 0 ? 6 : 0,
                    borderBottomLeftRadius: i === 0 ? 6 : 0,
                    borderTopRightRadius: i === BMI_BANDS.length - 1 ? 6 : 0,
                    borderBottomRightRadius: i === BMI_BANDS.length - 1 ? 6 : 0,
                  },
                ]}
              />
            );
          })}
        </View>
        {/* Needle */}
        <View style={[styles.needle, { left: `${percentage}%` }]}>
          <View style={styles.needleIndicator} />
        </View>
      </View>

      {/* Labels */}
      <View style={styles.labels}>
        <Text style={styles.labelText}>{GAUGE_MIN}</Text>
        <Text style={styles.labelText}>18.5</Text>
        <Text style={styles.labelText}>25</Text>
        <Text style={styles.labelText}>30</Text>
        <Text style={styles.labelText}>{GAUGE_MAX}</Text>
      </View>

      {/* Band legend */}
      <View style={styles.legend}>
        {BMI_BANDS.map((band, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: band.color }]} />
            <Text style={styles.legendText}>{band.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  bmiValue: {
    fontSize: 42,
    fontWeight: '800',
  },
  bmiCategory: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gaugeContainer: {
    width: '100%',
    height: 24,
    position: 'relative',
    marginVertical: spacing.sm,
  },
  gaugeTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 6,
  },
  gaugeBand: {
    height: '100%',
  },
  needle: {
    position: 'absolute',
    top: 0,
    marginLeft: -8,
  },
  needleIndicator: {
    width: 16,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.text.primary,
    borderWidth: 3,
    borderColor: '#fff',
    ...shadows.sm,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  labelText: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
});

export default BMIGauge;

