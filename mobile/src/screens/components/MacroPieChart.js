import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from '../../config/theme';

const MACRO_COLORS = {
  protein: '#3B82F6', // Blue
  carbs: '#F59E0B',   // Amber
  fat: '#EF4444',     // Red
};

/**
 * Macro pie chart for each meal.
 *
 * On web: uses CSS conic-gradient for a true pie/donut chart.
 * On native: uses a horizontal stacked bar (equally readable, fully compatible).
 *
 * Props: protein, carbs, fat (in grams), size (diameter, default 64), stroke (ring width, default 7)
 */
const MacroPieChart = ({ protein = 0, carbs = 0, fat = 0, size = 64, stroke = 7 }) => {
  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatCal = fat * 9;
  const totalCal = proteinCal + carbsCal + fatCal;
  if (totalCal === 0) return null;

  const proteinPct = Math.round((proteinCal / totalCal) * 100);
  const carbsPct = Math.round((carbsCal / totalCal) * 100);
  const fatPct = 100 - proteinPct - carbsPct; // ensure exactly 100

  const innerSize = size - stroke * 2;

  const legend = (
    <View style={pieStyles.legend}>
      <View style={pieStyles.legendItem}>
        <View style={[pieStyles.legendDot, { backgroundColor: MACRO_COLORS.protein }]} />
        <Text style={pieStyles.legendLabel}>P {proteinPct}%</Text>
      </View>
      <View style={pieStyles.legendItem}>
        <View style={[pieStyles.legendDot, { backgroundColor: MACRO_COLORS.carbs }]} />
        <Text style={pieStyles.legendLabel}>C {carbsPct}%</Text>
      </View>
      <View style={pieStyles.legendItem}>
        <View style={[pieStyles.legendDot, { backgroundColor: MACRO_COLORS.fat }]} />
        <Text style={pieStyles.legendLabel}>F {fatPct}%</Text>
      </View>
    </View>
  );

  // ── Web: conic-gradient donut ──
  if (Platform.OS === 'web') {
    const pDeg = (proteinCal / totalCal) * 360;
    const cDeg = (carbsCal / totalCal) * 360;
    const gradient = `conic-gradient(${MACRO_COLORS.protein} 0deg ${pDeg}deg, ${MACRO_COLORS.carbs} ${pDeg}deg ${pDeg + cDeg}deg, ${MACRO_COLORS.fat} ${pDeg + cDeg}deg 360deg)`;

    return (
      <View style={pieStyles.wrapper}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundImage: gradient,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: colors.surface || '#FFF',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={pieStyles.centerText}>{Math.round(totalCal)}</Text>
            <Text style={pieStyles.centerUnit}>cal</Text>
          </View>
        </View>
        {legend}
      </View>
    );
  }

  // ── Native: horizontal stacked bar ──
  return (
    <View style={pieStyles.wrapper}>
      <View style={pieStyles.nativeChart}>
        <View style={pieStyles.barContainer}>
          {proteinPct > 0 && (
            <View
              style={[
                pieStyles.barSegment,
                {
                  flex: proteinPct,
                  backgroundColor: MACRO_COLORS.protein,
                  borderTopLeftRadius: 5,
                  borderBottomLeftRadius: 5,
                  ...(carbsPct === 0 && fatPct === 0 ? { borderTopRightRadius: 5, borderBottomRightRadius: 5 } : {}),
                },
              ]}
            />
          )}
          {carbsPct > 0 && (
            <View
              style={[
                pieStyles.barSegment,
                {
                  flex: carbsPct,
                  backgroundColor: MACRO_COLORS.carbs,
                  ...(proteinPct === 0 ? { borderTopLeftRadius: 5, borderBottomLeftRadius: 5 } : {}),
                  ...(fatPct === 0 ? { borderTopRightRadius: 5, borderBottomRightRadius: 5 } : {}),
                },
              ]}
            />
          )}
          {fatPct > 0 && (
            <View
              style={[
                pieStyles.barSegment,
                {
                  flex: fatPct,
                  backgroundColor: MACRO_COLORS.fat,
                  borderTopRightRadius: 5,
                  borderBottomRightRadius: 5,
                  ...(proteinPct === 0 && carbsPct === 0 ? { borderTopLeftRadius: 5, borderBottomLeftRadius: 5 } : {}),
                },
              ]}
            />
          )}
        </View>
        <Text style={pieStyles.barCalText}>{Math.round(totalCal)} cal</Text>
      </View>
      {legend}
    </View>
  );
};

const pieStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: (colors.border || '#E5E7EB') + '60',
    marginTop: spacing.xs,
  },
  // ── Web donut center ──
  centerText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text?.primary || '#111827',
    lineHeight: 12,
  },
  centerUnit: {
    fontSize: 7,
    color: colors.text?.secondary || '#6B7280',
    fontWeight: '600',
    lineHeight: 9,
  },
  // ── Native stacked bar ──
  nativeChart: {
    width: 64,
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  barCalText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text?.secondary || '#6B7280',
    marginTop: 2,
  },
  // ── Legend ──
  legend: {
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendLabel: {
    fontSize: 10,
    color: colors.text?.secondary || '#6B7280',
    fontWeight: '600',
  },
});

export default MacroPieChart;

