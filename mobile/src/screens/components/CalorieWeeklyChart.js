import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import nutritionService from '../../services/nutritionService';

/**
 * Weekly Calorie Target vs Actual chart.
 * Uses existing getDietReport API to get last 7 days of calorie data.
 * Renders a simple grouped bar chart using pure RN Views.
 */

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CalorieWeeklyChart = () => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [targetCalories, setTargetCalories] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      const fmt = (d) => d.toISOString().split('T')[0];
      const report = await nutritionService.getDietReport(fmt(startDate), fmt(endDate));

      if (!report) { setError('No data'); return; }

      const target = report?.targets?.targetCalories || report?.targetCalories || 0;
      setTargetCalories(target);

      // Build 7-day data array
      const dailyBreakdown = report?.dailyBreakdown || [];
      const dataMap = {};
      dailyBreakdown.forEach(day => {
        if (day.date) dataMap[day.date] = day.calories || day.totalCalories || 0;
      });

      const data = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dateStr = fmt(d);
        const dayIdx = (d.getDay() + 6) % 7; // Mon=0
        data.push({
          label: DAY_LABELS[dayIdx],
          date: dateStr,
          actual: dataMap[dateStr] || 0,
          target: target,
          isToday: dateStr === fmt(new Date()),
        });
      }
      setChartData(data);
    } catch (e) {
      setError('Could not load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📊 Calorie Target vs Actual</Text>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || chartData.length === 0) return null;

  const maxVal = Math.max(...chartData.map(d => Math.max(d.actual, d.target)), 1);
  const CHART_HEIGHT = 120;
  const BAR_AREA_HEIGHT = CHART_HEIGHT - 4; // leave small padding

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Weekly Calories</Text>
      {targetCalories > 0 && (
        <Text style={styles.subtitle}>Target: {targetCalories} kcal/day</Text>
      )}

      <View style={styles.chartArea}>
        {chartData.map((day, i) => {
          const targetH = Math.max(2, (day.target / maxVal) * BAR_AREA_HEIGHT);
          const actualH = Math.max(2, (day.actual / maxVal) * BAR_AREA_HEIGHT);
          const isOver = day.actual > day.target;

          return (
            <View key={i} style={styles.barGroup}>
              <View style={styles.barsContainer}>
                {/* Target bar */}
                <View style={[styles.bar, styles.targetBar, { height: targetH }]} />
                {/* Actual bar */}
                <View style={[styles.bar, styles.actualBar, {
                  height: day.actual === 0 ? 2 : actualH,
                  backgroundColor: day.actual === 0 ? '#E5E7EB' : isOver ? '#EF4444' : '#22C55E',
                }]} />
              </View>
              <Text style={[styles.barLabel, day.isToday && styles.barLabelToday]}>{day.label}</Text>
              {day.actual > 0 && (
                <Text style={styles.barValue}>{day.actual}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
          <Text style={styles.legendText}>Target</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendText}>On Track</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Over</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  title: { ...typography.body, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  subtitle: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.sm },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: spacing.sm,
    paddingHorizontal: 2,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 116,
    gap: 2,
  },
  bar: {
    width: 12,
    borderRadius: 4,
    minHeight: 2,
  },
  targetBar: {
    backgroundColor: '#D1D5DB',
  },
  actualBar: {
    backgroundColor: '#22C55E',
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 4,
  },
  barLabelToday: {
    color: colors.primary,
    fontWeight: '800',
  },
  barValue: {
    fontSize: 8,
    color: colors.text.secondary,
    marginTop: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.border + '40',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.text.secondary },
});

export default CalorieWeeklyChart;

