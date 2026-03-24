import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from '../../config/theme';

const varianceText = (val, unit) => {
  if (val === 0) return { text: `0 ${unit}`, color: colors.text.secondary };
  const sign = val > 0 ? '+' : '';
  const rounded = unit === 'kcal' ? Math.round(val) : Math.round(val * 10) / 10;
  const text = `${sign}${rounded} ${unit}`;
  if (unit === 'kcal') {
    return { text, color: val > 0 ? colors.error : colors.success };
  }
  // For protein, being over is often good
  if (unit === 'g protein' || unit === 'g P') {
    return { text, color: val >= 0 ? colors.success : colors.error };
  }
  // Carbs/fat - over is a warning
  if (unit === 'g C' || unit === 'g F') {
    return { text, color: val > 0 ? colors.warning : colors.success };
  }
  return { text, color: val > 0 ? colors.warning : colors.success };
};

const inlineVariance = (val, unit) => {
  if (val == null || val === 0) return { text: '(0)', color: colors.text.light };
  const sign = val > 0 ? '+' : '';
  const rounded = unit === 'kcal' ? Math.round(val) : Math.round(val * 10) / 10;
  const text = `(${sign}${rounded})`;
  if (unit === 'kcal') {
    return { text, color: val > 0 ? '#EF4444' : '#22C55E' };
  }
  if (unit === 'g P') {
    return { text, color: val >= 0 ? '#22C55E' : '#EF4444' };
  }
  return { text, color: val > 0 ? '#9CA3AF' : '#22C55E' };
};

const DietReportTable = ({ report }) => {
  if (!report) return null;

  const {
    startDate, endDate, totalTrackedDays,
    targets = {}, dailyBreakdown = [], averages = {},
  } = report;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>🥗 Diet Report</Text>
        <Text style={styles.cardSubtitle}>{startDate} → {endDate}</Text>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalTrackedDays}</Text>
          <Text style={styles.summaryLabel}>Days Tracked</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{averages.avgCalories || 0}</Text>
          <Text style={styles.summaryLabel}>Avg Calories</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{averages.avgProtein || 0}g</Text>
          <Text style={styles.summaryLabel}>Avg Protein</Text>
        </View>
      </View>

      {/* Targets */}
      {targets.targetCalories > 0 && (
        <View style={styles.targetSection}>
          <Text style={styles.targetTitle}>🎯 Daily Targets</Text>
          <View style={styles.targetRow}>
            <View style={styles.targetChip}>
              <Text style={styles.targetChipValue}>{targets.targetCalories}</Text>
              <Text style={styles.targetChipLabel}>kcal</Text>
            </View>
            <View style={styles.targetChip}>
              <Text style={styles.targetChipValue}>{targets.targetProtein}g</Text>
              <Text style={styles.targetChipLabel}>Protein</Text>
            </View>
            <View style={styles.targetChip}>
              <Text style={styles.targetChipValue}>{targets.targetCarbs}g</Text>
              <Text style={styles.targetChipLabel}>Carbs</Text>
            </View>
            <View style={styles.targetChip}>
              <Text style={styles.targetChipValue}>{targets.targetFat}g</Text>
              <Text style={styles.targetChipLabel}>Fat</Text>
            </View>
          </View>
        </View>
      )}

      {/* Daily Breakdown */}
      {dailyBreakdown.length > 0 && (
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>📅 Daily Breakdown</Text>

          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 1 }]}>Date</Text>
            <Text style={[styles.headerCell, { flex: 0.9, textAlign: 'center' }]}>Calories</Text>
            <Text style={[styles.headerCell, { flex: 0.8, textAlign: 'center' }]}>Protein</Text>
            <Text style={[styles.headerCell, { flex: 0.8, textAlign: 'center' }]}>Carbs</Text>
            <Text style={[styles.headerCell, { flex: 0.8, textAlign: 'center' }]}>Fat</Text>
            <Text style={[styles.headerCell, { flex: 1.1, textAlign: 'center' }]}>Macros %</Text>
          </View>

          {dailyBreakdown.map((day, idx) => {
            const calV = inlineVariance(day.calorieVariance, 'kcal');
            const proV = inlineVariance(day.proteinVariance, 'g P');
            const carbV = inlineVariance(day.carbsVariance, 'g C');
            const fatV = inlineVariance(day.fatVariance, 'g F');
            const isOverCal = day.calorieVariance > 0;

            // Compute macro calorie percentages
            const dayP = day.protein || 0;
            const dayC = day.carbs || 0;
            const dayF = day.fat || 0;
            const dayTotalMacroCals = dayP * 4 + dayC * 4 + dayF * 9;
            const dayPPct = dayTotalMacroCals > 0 ? Math.round((dayP * 4 / dayTotalMacroCals) * 100) : 0;
            const dayCPct = dayTotalMacroCals > 0 ? Math.round((dayC * 4 / dayTotalMacroCals) * 100) : 0;
            const dayFPct = dayTotalMacroCals > 0 ? 100 - dayPPct - dayCPct : 0;

            return (
              <View
                key={day.date}
                style={[
                  styles.tableRow,
                  idx % 2 === 0 && styles.tableRowAlt,
                  isOverCal && styles.tableRowOverCal,
                ]}
              >
                <Text style={[styles.cell, { flex: 1, fontSize: 11 }]}>{day.date}</Text>
                <View style={[styles.cellCol, { flex: 0.9 }]}>
                  <Text style={styles.cellValue}>{day.calories}</Text>
                  <Text style={[styles.cellVariance, { color: calV.color }]}>{calV.text}</Text>
                </View>
                <View style={[styles.cellCol, { flex: 0.8 }]}>
                  <Text style={styles.cellValue}>{Math.round(day.protein * 10) / 10}g</Text>
                  <Text style={[styles.cellVariance, { color: proV.color }]}>{proV.text}</Text>
                </View>
                <View style={[styles.cellCol, { flex: 0.8 }]}>
                  <Text style={styles.cellValue}>{Math.round(day.carbs * 10) / 10}g</Text>
                  <Text style={[styles.cellVariance, { color: carbV.color }]}>{carbV.text}</Text>
                </View>
                <View style={[styles.cellCol, { flex: 0.8 }]}>
                  <Text style={styles.cellValue}>{Math.round(day.fat * 10) / 10}g</Text>
                  <Text style={[styles.cellVariance, { color: fatV.color }]}>{fatV.text}</Text>
                </View>
                {/* Macros % Donut Column */}
                <View style={[styles.cellCol, { flex: 1.1 }]}>
                  <View style={styles.miniDonutRow}>
                    <View style={styles.miniDonutCircle}>
                      <View style={styles.miniDonutSegments}>
                        <View style={[styles.miniDonutSeg, { flex: Math.max(dayPPct, 1), backgroundColor: '#111827' }]} />
                        <View style={[styles.miniDonutSeg, { flex: Math.max(dayCPct, 1), backgroundColor: '#4B5563' }]} />
                        <View style={[styles.miniDonutSeg, { flex: Math.max(dayFPct, 1), backgroundColor: '#374151' }]} />
                      </View>
                      <View style={styles.miniDonutHole} />
                    </View>
                    <View style={styles.miniPctLabels}>
                      <Text style={[styles.miniPctText, { color: '#111827' }]}>P:{dayPPct}%</Text>
                      <Text style={[styles.miniPctText, { color: '#4B5563' }]}>C:{dayCPct}%</Text>
                      <Text style={[styles.miniPctText, { color: '#374151' }]}>F:{dayFPct}%</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Macro Variance Summary */}
      {dailyBreakdown.length > 0 && targets.targetCalories > 0 && (
        <View style={styles.varianceSection}>
          <Text style={styles.tableTitle}>⚖️ Average Variance vs Target</Text>
          <View style={styles.varianceGrid}>
            {[
              { label: 'Calories', val: (averages.avgCalories || 0) - targets.targetCalories, unit: 'kcal' },
              { label: 'Protein', val: (averages.avgProtein || 0) - targets.targetProtein, unit: 'g P' },
              { label: 'Carbs', val: (averages.avgCarbs || 0) - targets.targetCarbs, unit: 'g C' },
              { label: 'Fat', val: (averages.avgFat || 0) - targets.targetFat, unit: 'g F' },
            ].map((item) => {
              const v = varianceText(item.val, item.unit);
              return (
                <View key={item.label} style={[styles.varianceCard, { borderLeftColor: v.color }]}>
                  <Text style={styles.varianceLabel}>{item.label}</Text>
                  <Text style={[styles.varianceValue, { color: v.color }]}>{v.text}</Text>
                  <Text style={styles.varianceSub}>
                    {item.val > 0 ? 'over target' : item.val < 0 ? 'under target' : 'on target'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {dailyBreakdown.length === 0 && (
        <View style={styles.emptyInner}>
          <Text style={styles.emptyText}>No nutrition data logged in this period.</Text>
        </View>
      )}
    </View>
  );
};

export default DietReportTable;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  cardHeader: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cardSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#22C55E' },
  summaryLabel: { fontSize: 11, color: colors.text.secondary, marginTop: 2, fontWeight: '600' },

  targetSection: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  targetTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  targetRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  targetChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  targetChipValue: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  targetChipLabel: { fontSize: 10, color: colors.text.secondary },

  tableSection: { padding: spacing.md },
  tableTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },

  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  headerCell: { fontSize: 10, fontWeight: '700', color: colors.text.secondary, textTransform: 'uppercase' },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  tableRowAlt: { backgroundColor: '#F9FAFB' },
  tableRowOverCal: { backgroundColor: 'rgba(239,71,111,0.04)' },
  cell: { fontSize: 12, color: colors.text.primary },
  cellCol: { alignItems: 'center', justifyContent: 'center' },
  cellValue: { fontSize: 12, fontWeight: '600', color: colors.text.primary },
  cellVariance: { fontSize: 9, fontWeight: '700', marginTop: 1 },

  // Mini Donut for Macros % column
  miniDonutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDonutCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    marginRight: 4,
  },
  miniDonutSegments: {
    flexDirection: 'row',
    flex: 1,
  },
  miniDonutSeg: {
    height: '100%',
  },
  miniDonutHole: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  miniPctLabels: {
    alignItems: 'flex-start',
  },
  miniPctText: {
    fontSize: 7,
    fontWeight: '800',
    lineHeight: 10,
  },

  varianceSection: { padding: spacing.md, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  varianceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  varianceCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
  },
  varianceLabel: { fontSize: 11, color: colors.text.secondary, fontWeight: '600' },
  varianceValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  varianceSub: { fontSize: 10, color: colors.text.light, marginTop: 2 },

  emptyInner: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.text.secondary, fontSize: 14 },
});






