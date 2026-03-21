import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { mergeStepHistory, persistWorkoutTracking } from '../store/slices/workoutTrackingSlice';
import workoutService from '../services/workoutService';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 200;
const BAR_GAP = 8;

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDateString = (d) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const StepHistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { todaySteps: rawSteps, stepGoal: rawGoal, stepHistory: rawHistory } = useSelector(state => state.workoutTracking);
  // Sanitize values — guard against non-numeric data
  const todaySteps = (typeof rawSteps === 'number' && !isNaN(rawSteps)) ? rawSteps : 0;
  const stepGoal = (typeof rawGoal === 'number' && !isNaN(rawGoal)) ? rawGoal : 0;
  const stepHistory = Array.isArray(rawHistory) ? rawHistory.filter(h => h && typeof h.steps === 'number') : [];
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedBar, setSelectedBar] = useState(null);

  // Load step history from backend on mount
  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const historyData = await workoutService.getStepHistory(90);
        if (historyData && historyData.length > 0) {
          dispatch(mergeStepHistory(historyData.map(h => ({
            date: h.trackingDate,
            steps: h.steps,
            caloriesBurned: h.caloriesBurned || Math.round(h.steps * 0.04),
          }))));
          dispatch(persistWorkoutTracking());
        }
      } catch (e) {
        
      }
    };
    loadFromBackend();
  }, []);

  // Build the 7 days for the selected week
  const weekData = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    // Go to Monday of current week
    const dayOfWeek = today.getDay(); // 0=Sun
    const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(today.getDate() - diffToMon + (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = getDateString(d);
      const isToday = dateStr === getDateString(today);

      // Find from history or use today's steps
      let steps = 0;
      if (isToday) {
        steps = todaySteps || 0;
      } else {
        const entry = stepHistory.find(h => h.date === dateStr);
        steps = entry ? entry.steps : 0;
      }
      const caloriesBurned = Math.round(steps * 0.04);

      days.push({
        date: dateStr,
        dayLabel: DAY_SHORT[d.getDay()],
        dayNum: d.getDate(),
        month: d.toLocaleString('default', { month: 'short' }),
        steps,
        caloriesBurned,
        isToday,
      });
    }
    return days;
  }, [weekOffset, todaySteps, stepHistory]);

  const maxSteps = Math.max(...weekData.map(d => d.steps), 1000); // min 1000 for scale
  const weekTotalSteps = weekData.reduce((s, d) => s + d.steps, 0);
  const weekTotalCal = weekData.reduce((s, d) => s + d.caloriesBurned, 0);
  const weekAvgSteps = Math.round(weekTotalSteps / 7);

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    const d0 = weekData[0];
    const d6 = weekData[6];
    return `${d0.dayNum} ${d0.month} – ${d6.dayNum} ${d6.month}`;
  }, [weekOffset, weekData]);

  const todayCal = Math.round((todaySteps || 0) * 0.04);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Step Tracker</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's summary */}
        <View style={styles.todayCard}>
          <Text style={styles.todayIcon}>👟</Text>
          <Text style={styles.todaySteps}>{(todaySteps || 0).toLocaleString()}</Text>
          <Text style={styles.todayLabel}>Steps Today</Text>
          <View style={styles.todayMeta}>
            <View style={styles.todayMetaItem}>
              <Text style={styles.metaValue}>🔥 {todayCal}</Text>
              <Text style={styles.metaLabel}>Calories</Text>
            </View>
            <View style={styles.todayMetaItem}>
              <Text style={styles.metaValue}>📏 {((todaySteps || 0) * 0.0008).toFixed(1)}</Text>
              <Text style={styles.metaLabel}>km</Text>
            </View>
            {stepGoal > 0 && (
              <View style={styles.todayMetaItem}>
                <Text style={styles.metaValue}>🎯 {Math.min(100, Math.round(((todaySteps || 0) / stepGoal) * 100))}%</Text>
                <Text style={styles.metaLabel}>Goal</Text>
              </View>
            )}
          </View>

          {/* Step goal progress bar */}
          {stepGoal > 0 && (
            <View style={styles.goalProgress}>
              <View style={styles.goalBarBg}>
                <View style={[styles.goalBarFill, {
                  width: `${Math.min(100, ((todaySteps || 0) / stepGoal) * 100)}%`,
                  backgroundColor: (todaySteps || 0) >= stepGoal ? colors.success : colors.primary,
                }]} />
              </View>
              <Text style={styles.goalText}>
                {(todaySteps || 0).toLocaleString()} / {stepGoal.toLocaleString()} steps
              </Text>
            </View>
          )}
        </View>

        {/* Week navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={() => { setWeekOffset(w => w - 1); setSelectedBar(null); }} style={styles.weekNavBtn}>
            <Text style={styles.weekNavArrow}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.weekNavLabel}>{weekLabel}</Text>
          <TouchableOpacity
            onPress={() => { if (weekOffset < 0) { setWeekOffset(w => w + 1); setSelectedBar(null); } }}
            style={[styles.weekNavBtn, weekOffset >= 0 && styles.weekNavBtnDisabled]}
            disabled={weekOffset >= 0}
          >
            <Text style={[styles.weekNavArrow, weekOffset >= 0 && styles.weekNavArrowDisabled]}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Bar chart */}
        <View style={styles.chartContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            <Text style={styles.yLabel}>{maxSteps.toLocaleString()}</Text>
            <Text style={styles.yLabel}>{Math.round(maxSteps / 2).toLocaleString()}</Text>
            <Text style={styles.yLabel}>0</Text>
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            {/* Grid lines */}
            <View style={[styles.gridLine, { bottom: '100%' }]} />
            <View style={[styles.gridLine, { bottom: '50%' }]} />
            <View style={[styles.gridLine, { bottom: 0 }]} />

            {weekData.map((day, idx) => {
              const barHeight = Math.max(4, (day.steps / maxSteps) * CHART_HEIGHT);
              const isSelected = selectedBar === idx;
              const barColor = day.isToday
                ? colors.primary
                : day.steps > 0 ? colors.primary + '80' : colors.border;

              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.barColumn}
                  onPress={() => setSelectedBar(isSelected ? null : idx)}
                  activeOpacity={0.7}
                >
                  {/* Tooltip */}
                  {isSelected && day.steps > 0 && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipSteps}>{day.steps.toLocaleString()} steps</Text>
                      <Text style={styles.tooltipCal}>🔥 {day.caloriesBurned} cal</Text>
                    </View>
                  )}

                  <View style={styles.barWrapper}>
                    <View style={[styles.bar, {
                      height: barHeight,
                      backgroundColor: barColor,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: colors.primary,
                    }]} />
                  </View>

                  <Text style={[styles.barDayLabel, day.isToday && styles.barDayLabelToday]}>
                    {day.dayLabel}
                  </Text>
                  <Text style={styles.barDateLabel}>{day.dayNum}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Week summary */}
        <View style={styles.weekSummary}>
          <Text style={styles.summaryTitle}>Week Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{weekTotalSteps.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Total Steps</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{weekAvgSteps.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Daily Average</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{weekTotalCal.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Calories Burned</Text>
            </View>
          </View>
        </View>

        {/* Daily breakdown */}
        <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        {weekData.slice().reverse().map((day, idx) => (
          <View key={idx} style={[styles.dayRow, day.isToday && styles.dayRowToday]}>
            <View style={styles.dayRowLeft}>
              <Text style={[styles.dayRowDay, day.isToday && styles.dayRowDayToday]}>
                {day.dayLabel} {day.dayNum}
              </Text>
              {day.isToday && <Text style={styles.todayBadge}>Today</Text>}
            </View>
            <View style={styles.dayRowRight}>
              <Text style={styles.dayRowSteps}>{day.steps.toLocaleString()} steps</Text>
              <Text style={styles.dayRowCal}>🔥 {day.caloriesBurned} cal</Text>
            </View>
          </View>
        ))}

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </View>
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

  // Today card
  todayCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.lg, ...shadows.md,
  },
  todayIcon: { fontSize: 40, marginBottom: spacing.sm },
  todaySteps: { fontSize: 48, fontWeight: '800', color: colors.primary },
  todayLabel: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.md },
  todayMeta: { flexDirection: 'row', gap: spacing.xl },
  todayMetaItem: { alignItems: 'center' },
  metaValue: { ...typography.body, fontWeight: '700', color: colors.text.primary },
  metaLabel: { ...typography.caption, color: colors.text.secondary },
  goalProgress: { width: '100%', marginTop: spacing.md },
  goalBarBg: { height: 10, backgroundColor: colors.primary + '20', borderRadius: 5, overflow: 'hidden' },
  goalBarFill: { height: '100%', borderRadius: 5 },
  goalText: { ...typography.caption, color: colors.text.secondary, textAlign: 'center', marginTop: 4 },

  // Week navigation
  weekNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  weekNavBtn: { padding: spacing.sm },
  weekNavBtnDisabled: { opacity: 0.3 },
  weekNavArrow: { fontSize: 18, color: colors.primary },
  weekNavArrowDisabled: { color: colors.text.light },
  weekNavLabel: { ...typography.h3, color: colors.text.primary },

  // Chart
  chartContainer: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, paddingTop: spacing.lg, marginBottom: spacing.lg, ...shadows.sm,
    height: CHART_HEIGHT + 80,
  },
  yAxis: { width: 40, justifyContent: 'space-between', paddingBottom: 30 },
  yLabel: { ...typography.caption, color: colors.text.light, fontSize: 9, textAlign: 'right' },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 30, position: 'relative' },
  gridLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: colors.border + '40',
  },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barWrapper: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', height: CHART_HEIGHT },
  bar: {
    width: '55%', borderRadius: 4, minHeight: 4,
    maxWidth: 40,
  },
  barDayLabel: { ...typography.caption, color: colors.text.secondary, marginTop: 4, fontSize: 10 },
  barDayLabelToday: { color: colors.primary, fontWeight: '700' },
  barDateLabel: { ...typography.caption, color: colors.text.light, fontSize: 9 },

  // Tooltip
  tooltip: {
    position: 'absolute', top: -10, backgroundColor: colors.text.primary,
    borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4,
    zIndex: 10, alignItems: 'center', minWidth: 80,
  },
  tooltipSteps: { ...typography.caption, color: '#FFF', fontWeight: '700', fontSize: 10 },
  tooltipCal: { ...typography.caption, color: '#FFD700', fontSize: 9 },

  // Week summary
  weekSummary: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.lg, ...shadows.sm,
  },
  summaryTitle: { ...typography.body, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { ...typography.h3, color: colors.primary },
  summaryLabel: { ...typography.caption, color: colors.text.secondary },

  // Daily breakdown
  sectionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },
  dayRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md,
    marginBottom: spacing.xs, ...shadows.sm,
  },
  dayRowToday: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  dayRowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayRowDay: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  dayRowDayToday: { color: colors.primary },
  todayBadge: {
    ...typography.caption, color: colors.primary, fontWeight: '700',
    backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.sm, overflow: 'hidden',
  },
  dayRowRight: { alignItems: 'flex-end' },
  dayRowSteps: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  dayRowCal: { ...typography.caption, color: colors.warning },
});

export default StepHistoryScreen;

