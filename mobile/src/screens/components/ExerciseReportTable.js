import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../config/theme';

const ExerciseReportTable = ({ report }) => {
  if (!report) return null;

  const {
    startDate, endDate, totalWorkoutDays, totalExercisesLogged = 0,
    totalVolumeLifted = 0,
    exerciseFrequency = {}, personalBests = [], volumeProgression = [],
    exerciseHistories = [],
  } = report;

  const [expandedExercise, setExpandedExercise] = useState(null);

  const toggleExercise = (name) => {
    setExpandedExercise(prev => prev === name ? null : name);
  };

  const formatVolume = (v) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return Math.round(v).toLocaleString();
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>🏋️ Exercise Report</Text>
        <Text style={styles.cardSubtitle}>{startDate} → {endDate}</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalWorkoutDays}</Text>
          <Text style={styles.summaryLabel}>Workout Days</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{Object.keys(exerciseFrequency).length}</Text>
          <Text style={styles.summaryLabel}>Exercises</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{personalBests.length}</Text>
          <Text style={styles.summaryLabel}>Personal Bests</Text>
        </View>
      </View>
      <View style={styles.summaryRow2}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue2}>{totalExercisesLogged}</Text>
          <Text style={styles.summaryLabel}>Total Logs</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue2}>{formatVolume(totalVolumeLifted)}</Text>
          <Text style={styles.summaryLabel}>Total Volume (kg)</Text>
        </View>
      </View>

      {/* ─── Frequency Table ─── */}
      {Object.keys(exerciseFrequency).length > 0 && (
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>📊 Exercise Frequency</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Exercise</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Edits</Text>
          </View>
          {Object.entries(exerciseFrequency)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count], idx) => (
              <View key={name} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{name}</Text>
                <Text style={[styles.tableCell, styles.tableCellCenter, { flex: 1 }]}>
                  {count}×
                </Text>
              </View>
            ))}
        </View>
      )}

      {/* ─── Personal Bests ─── */}
      {personalBests.length > 0 && (
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>🏆 Personal Bests</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Exercise</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Best Weight</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Reps</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Date</Text>
          </View>
          {[...personalBests]
            .sort((a, b) => b.bestWeight - a.bestWeight)
            .map((pb, idx) => (
              <View key={pb.exerciseName + idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{pb.exerciseName}</Text>
                <View style={[{ flex: 1, alignItems: 'center' }]}>
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>{pb.bestWeight} kg</Text>
                  </View>
                </View>
                <Text style={[styles.tableCell, styles.tableCellCenter, { flex: 1 }]}>{pb.reps}</Text>
                <Text style={[styles.tableCell, styles.tableCellCenter, { flex: 1, fontSize: 11 }]}>{pb.date}</Text>
              </View>
            ))}
        </View>
      )}

      {/* ─── Per-Exercise Edit History ─── */}
      {exerciseHistories.length > 0 && (
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>📋 Exercise Details & History</Text>
          {exerciseHistories.map((exHist, idx) => (
            <View key={exHist.exerciseName + idx} style={styles.exerciseHistoryCard}>
              <TouchableOpacity
                style={styles.exerciseHistoryHeader}
                onPress={() => toggleExercise(exHist.exerciseName)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseHistoryName}>{exHist.exerciseName}</Text>
                  <Text style={styles.exerciseHistoryMeta}>
                    {exHist.totalEdits} edits · Avg {exHist.avgWeight} kg × {exHist.avgReps} reps · Max {exHist.maxWeight} kg
                  </Text>
                </View>
                <Text style={styles.expandIcon}>{expandedExercise === exHist.exerciseName ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {expandedExercise === exHist.exerciseName && exHist.edits && (
                <View style={styles.editsContainer}>
                  {exHist.edits.map((edit, eIdx) => {
                    const prevEdit = eIdx > 0 ? exHist.edits[eIdx - 1] : null;
                    const currMaxWeight = edit.sets ? Math.max(...edit.sets.map(s => s.weight || 0)) : 0;
                    const prevMaxWeight = prevEdit?.sets ? Math.max(...prevEdit.sets.map(s => s.weight || 0)) : 0;
                    const weightDiff = prevEdit ? currMaxWeight - prevMaxWeight : 0;
                    const dateStr = edit.loggedAt ? edit.loggedAt.substring(0, 16).replace('T', ' ') : '';
                    return (
                      <View key={eIdx} style={styles.editRow}>
                        <View style={styles.editHeader}>
                          <Text style={styles.editDate}>{dateStr}</Text>
                          <Text style={styles.editLabel}>Edit {eIdx + 1}{eIdx === exHist.edits.length - 1 ? ' (Latest)' : ''}</Text>
                        </View>
                        {edit.sets && edit.sets.map((set, sIdx) => (
                          <Text key={sIdx} style={styles.editSetText}>
                            Set {sIdx + 1}: {set.reps} reps × {set.weight} kg
                          </Text>
                        ))}
                        <Text style={styles.editVolumeText}>Volume: {Math.round(edit.totalVolume || 0)}</Text>
                        {prevEdit && weightDiff !== 0 && (
                          <Text style={[styles.editDiffText, { color: weightDiff > 0 ? '#22C55E' : '#EF4444' }]}>
                            vs previous: {weightDiff > 0 ? '+' : ''}{weightDiff} kg
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* ─── Volume Progression ─── */}
      {volumeProgression.length > 0 && (
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>📈 Volume Progression</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Date</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Total Volume</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Exercises</Text>
          </View>
          {volumeProgression.map((dv, idx) => {
            const maxVol = Math.max(...volumeProgression.map(v => v.totalVolume), 1);
            const intensity = dv.totalVolume / maxVol;
            const barColor = intensity > 0.7 ? colors.success : intensity > 0.4 ? colors.warning : colors.text.light;
            return (
              <View key={dv.date} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, { flex: 1 }]}>{dv.date}</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={[styles.volumeBar, { width: `${Math.max(intensity * 100, 8)}%`, backgroundColor: barColor }]} />
                  <Text style={[styles.tableCell, { marginLeft: 6, fontSize: 12 }]}>
                    {formatVolume(dv.totalVolume)}
                  </Text>
                </View>
                <Text style={[styles.tableCell, styles.tableCellCenter, { flex: 1 }]}>{dv.exerciseCount}</Text>
              </View>
            );
          })}
        </View>
      )}

      {Object.keys(exerciseFrequency).length === 0 && (
        <View style={styles.emptyInner}>
          <Text style={styles.emptyText}>No exercise data logged in this period.</Text>
        </View>
      )}
    </View>
  );
};

export default ExerciseReportTable;

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
      default: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  cardHeader: {
    backgroundColor: '#111827',
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
  summaryRow2: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  summaryValue2: { fontSize: 18, fontWeight: '700', color: '#111827' },
  summaryLabel: { fontSize: 11, color: colors.text.secondary, marginTop: 2, fontWeight: '600' },

  tableSection: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tableTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },

  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: colors.text.secondary, textTransform: 'uppercase' },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  tableRowAlt: { backgroundColor: '#F9FAFB' },
  tableCell: { fontSize: 13, color: colors.text.primary },
  tableCellCenter: { textAlign: 'center' },

  bestBadge: {
    backgroundColor: 'rgba(247,184,1,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bestBadgeText: { fontSize: 12, fontWeight: '700', color: '#92400E' },

  volumeBar: {
    height: 8,
    borderRadius: 4,
    minWidth: 4,
  },

  // Exercise history styles
  exerciseHistoryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  exerciseHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  exerciseHistoryName: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  exerciseHistoryMeta: { fontSize: 11, color: colors.text.secondary, marginTop: 2 },
  expandIcon: { fontSize: 12, color: colors.text.secondary, marginLeft: 8 },

  editsContainer: { paddingHorizontal: 12, paddingBottom: 12 },
  editRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#111827',
  },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  editDate: { fontSize: 11, color: colors.text.secondary },
  editLabel: { fontSize: 11, fontWeight: '600', color: '#111827' },
  editSetText: { fontSize: 12, color: colors.text.primary, marginLeft: 4 },
  editVolumeText: { fontSize: 11, color: colors.text.secondary, marginTop: 4, fontStyle: 'italic' },
  editDiffText: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  emptyInner: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.text.secondary, fontSize: 14 },
});

