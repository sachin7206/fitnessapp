import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import workoutService from '../services/workoutService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_GRAPH_POINTS = 20;

const MUSCLE_ICONS = {
  'CHEST': '🫁', 'BACK': '🏋️‍♂️', 'LEGS': '🦵', 'SHOULDERS': '💪',
  'ARMS': '💪', 'FULL_BODY': '🏋️', 'CARDIO': '❤️', 'CORE': '🎯',
};

const formatLabel = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch {
    return dateStr;
  }
};

const formatDateFull = (dateStr) => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr, timeStr) => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    if (timeStr) {
      const t = new Date(timeStr);
      if (!isNaN(t.getTime())) {
        let hours = t.getHours();
        const minutes = t.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const timePart = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
        return `${datePart}, ${timePart}`;
      }
    }
    return datePart;
  } catch {
    return dateStr;
  }
};

// ─── Simple Line Graph Component ───
const SimpleLineGraph = ({ data, label, unit, color, onPointPress, selectedIndex }) => {
  if (!data || data.length === 0) return null;

  const GRAPH_HEIGHT = 160;
  const GRAPH_PADDING_LEFT = 45;
  const GRAPH_PADDING_RIGHT = 20;
  const GRAPH_PADDING_TOP = 20;
  const GRAPH_PADDING_BOTTOM = 35;
  const graphWidth = SCREEN_WIDTH - spacing.lg * 2 - 16; // card padding
  const plotWidth = graphWidth - GRAPH_PADDING_LEFT - GRAPH_PADDING_RIGHT;
  const plotHeight = GRAPH_HEIGHT - GRAPH_PADDING_TOP - GRAPH_PADDING_BOTTOM;

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  // Calculate points
  const points = data.map((d, i) => ({
    x: GRAPH_PADDING_LEFT + (data.length > 1 ? (i / (data.length - 1)) * plotWidth : plotWidth / 2),
    y: GRAPH_PADDING_TOP + plotHeight - ((d.value - minVal) / range) * plotHeight,
    ...d,
  }));

  // Build SVG-like path using line segments
  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) =>
    minVal + (range / gridLines) * i
  );

  return (
    <View style={graphStyles.container}>
      <Text style={[graphStyles.title, { color }]}>{label}</Text>
      <View style={[graphStyles.graphArea, { height: GRAPH_HEIGHT, width: graphWidth }]}>
        {/* Y-axis labels & grid lines */}
        {gridValues.map((val, i) => {
          const y = GRAPH_PADDING_TOP + plotHeight - ((val - minVal) / range) * plotHeight;
          return (
            <View key={i} style={{ position: 'absolute', top: y - 6, left: 0, right: 0, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={graphStyles.yLabel}>{Math.round(val)}</Text>
              <View style={[graphStyles.gridLine, { left: GRAPH_PADDING_LEFT, right: GRAPH_PADDING_RIGHT }]} />
            </View>
          );
        })}

        {/* Line segments */}
        {points.length > 1 && points.slice(0, -1).map((p1, i) => {
          const p2 = points[i + 1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`line-${i}`}
              style={{
                position: 'absolute',
                left: p1.x,
                top: p1.y,
                width: length,
                height: 2,
                backgroundColor: color,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: 'left center',
              }}
            />
          );
        })}

        {/* Data points (touchable) */}
        {points.map((p, i) => (
          <TouchableOpacity
            key={`point-${i}`}
            style={{
              position: 'absolute',
              left: p.x - 12,
              top: p.y - 12,
              width: 24,
              height: 24,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
            }}
            onPress={() => onPointPress?.(i)}
            activeOpacity={0.6}
          >
            <View style={[
              graphStyles.point,
              { backgroundColor: selectedIndex === i ? color : '#fff', borderColor: color },
            ]} />
          </TouchableOpacity>
        ))}

        {/* Tooltip */}
        {selectedIndex !== null && selectedIndex !== undefined && points[selectedIndex] && (
          <View style={[
            graphStyles.tooltip,
            {
              left: Math.max(5, Math.min(points[selectedIndex].x - 50, graphWidth - 110)),
              top: Math.max(0, points[selectedIndex].y - 45),
            },
          ]}>
            <Text style={graphStyles.tooltipDate}>{formatDateFull(points[selectedIndex].date)}</Text>
            <Text style={graphStyles.tooltipValue}>
              {points[selectedIndex].value} {unit}
            </Text>
          </View>
        )}

        {/* X-axis date labels */}
        {points.map((p, i) => {
          // Show max 6 labels to avoid overlap
          const showLabel = data.length <= 6 || i === 0 || i === data.length - 1 ||
            i % Math.ceil(data.length / 5) === 0;
          if (!showLabel) return null;
          return (
            <Text
              key={`xlabel-${i}`}
              style={[graphStyles.xLabel, { left: p.x - 20, top: GRAPH_HEIGHT - GRAPH_PADDING_BOTTOM + 5 }]}
            >
              {formatDate(p.date)}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const ExerciseProgressScreen = ({ navigation, route }) => {
  const { exerciseLogs: passedLogs, allExercises: passedExercises } = route.params || {};
  const [exerciseLogs, setExerciseLogs] = useState(passedLogs || {});
  const [allExercises, setAllExercises] = useState(passedExercises || []);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repsTooltipIdx, setRepsTooltipIdx] = useState(null);
  const [weightTooltipIdx, setWeightTooltipIdx] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load from backend DB (source of truth)
    try {
      const backendLogs = await workoutService.getCustomWorkoutLogs(90);
      if (backendLogs && backendLogs.length > 0) {
        const logData = {};
        backendLogs.forEach(log => {
          const date = log.logDate;
          if (!logData[date]) logData[date] = {};
          if (!logData[date][log.dayOfWeek]) logData[date][log.dayOfWeek] = {};
          try {
            const parsed = JSON.parse(log.setsData || '[]');
            logData[date][log.dayOfWeek][log.exerciseIndex] = parsed;
          } catch (e) { /* ignore */ }
        });
        setExerciseLogs(logData);
      }
    } catch (e) { /* ignore backend fetch failure */ }

    // Load exercises from active plan
    try {
      const response = await workoutService.getActiveWorkoutPlan();
      if (response?.workoutPlan?.exercises) {
        setAllExercises(response.workoutPlan.exercises);
      }
    } catch (e) { /* ignore */ }

    setLoading(false);
  };

  // Build exercise progress data — only exercises that have been edited/logged
  const getUniqueExercises = () => {
    const exerciseMap = {};
    allExercises.forEach(ex => {
      const key = `${ex.exerciseName}_${ex.dayOfWeek}`;
      if (!exerciseMap[key]) {
        exerciseMap[key] = {
          name: ex.exerciseName,
          dayOfWeek: ex.dayOfWeek,
          muscleGroup: ex.muscleGroup,
          targetSets: ex.sets,
          targetReps: ex.reps,
          restTimeSeconds: ex.restTimeSeconds,
          isCardio: ex.isCardio,
          durationSeconds: ex.durationSeconds,
        };
      }
    });
    // Only include exercises that have log history
    return Object.values(exerciseMap).filter(ex => {
      const history = getExerciseHistory(ex.name, ex.dayOfWeek);
      return history.length > 0;
    });
  };

  // Get history for a specific exercise from DB log data
  // DB setsData format: [ { sets: [{reps, weight}, ...], loggedAt: "..." }, ... ]
  // Each entry in the array = one edit/session
  const getExerciseHistory = (exerciseName, dayOfWeek) => {
    const history = [];
    const dates = Object.keys(exerciseLogs).sort();

    const dayExercises = allExercises.filter(e => e.dayOfWeek === dayOfWeek);
    const exerciseIndex = dayExercises.findIndex(e => e.exerciseName === exerciseName);
    if (exerciseIndex === -1) return [];

    dates.forEach(date => {
      const dayLog = exerciseLogs[date]?.[dayOfWeek]?.[exerciseIndex];
      if (!dayLog) return;

      // Backend format: array of entries [ { sets: [...], loggedAt }, ... ]
      if (Array.isArray(dayLog)) {
        dayLog.forEach((entry, entryIdx) => {
          const sets = entry.sets || [];
          if (sets.length === 0) return;

          // Check if this is a cardio entry (has durationSeconds/durationMinutes in sets)
          const isCardioEntry = sets.length === 1 && (sets[0].durationSeconds != null || sets[0].durationMinutes != null);
          const durationMinutes = isCardioEntry
            ? (sets[0].durationMinutes || Math.round((sets[0].durationSeconds || 0) / 60))
            : 0;

          // Total reps = sum of all sets reps
          const totalReps = sets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0);
          // Max weight across all sets
          const maxWeight = Math.max(...sets.map(s => Number(s.weight) || 0));
          // Avg reps per set
          const avgRepsPerSet = sets.length > 0 ? Math.round(totalReps / sets.length) : 0;
          // Total volume = sum of (reps × weight) for each set
          const totalVolume = sets.reduce((sum, s) => sum + ((Number(s.reps) || 0) * (Number(s.weight) || 0)), 0);

          history.push({
            date,
            editedAt: entry.loggedAt,
            sets,
            setsCount: sets.length,
            totalReps,
            avgRepsPerSet,
            maxWeight,
            totalVolume,
            editNumber: entryIdx + 1,
            isCardioEntry,
            durationMinutes,
          });
        });
      }
      // Fallback: old local format with edits array
      else if (dayLog.edits && Array.isArray(dayLog.edits)) {
        dayLog.edits.forEach((edit, editIdx) => {
          const sets = edit.sets || [];
          if (sets.length === 0) return;
          const totalReps = sets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0);
          const maxWeight = Math.max(...sets.map(s => Number(s.weight) || 0));
          const avgRepsPerSet = sets.length > 0 ? Math.round(totalReps / sets.length) : 0;
          const totalVolume = sets.reduce((sum, s) => sum + ((Number(s.reps) || 0) * (Number(s.weight) || 0)), 0);

          history.push({
            date,
            editedAt: edit.editedAt,
            sets,
            setsCount: sets.length,
            totalReps,
            avgRepsPerSet,
            maxWeight,
            totalVolume,
            editNumber: editIdx + 1,
          });
        });
      }
    });

    return history.slice(-MAX_GRAPH_POINTS);
  };

  // Get summary stats for an exercise
  const getExerciseStats = (history) => {
    if (history.length === 0) return null;

    const isCardioHistory = history.some(h => h.isCardioEntry);

    if (isCardioHistory) {
      const allDurations = history.map(h => h.durationMinutes || 0);
      const bestDuration = Math.max(...allDurations);
      const avgDuration = Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length);

      return {
        totalSessions: history.length,
        isCardio: true,
        bestDuration,
        avgDuration,
        progression: history.length >= 2 ? {
          durationChange: (history[history.length - 1].durationMinutes || 0) - (history[history.length - 2].durationMinutes || 0),
        } : null,
      };
    }

    // Strength exercise stats
    const allWeights = history.flatMap(h => h.sets.map(s => Number(s.weight) || 0));
    const bestWeight = allWeights.length > 0 ? Math.max(...allWeights) : 0;

    const allTotalReps = history.map(h => h.totalReps);
    const highestTotalReps = Math.max(...allTotalReps);

    const allVolumes = history.map(h => h.totalVolume).filter(v => v > 0);
    const bestVolume = allVolumes.length > 0 ? Math.max(...allVolumes) : 0;

    return {
      totalSessions: history.length,
      isCardio: false,
      bestWeight,
      highestTotalReps,
      bestVolume,
      progression: history.length >= 2 ? {
        weightChange: history[history.length - 1].maxWeight - history[history.length - 2].maxWeight,
        repsChange: history[history.length - 1].totalReps - history[history.length - 2].totalReps,
      } : null,
    };
  };

  // Build graph data (chronological order, capped at MAX_GRAPH_POINTS)
  const buildRepsGraphData = (history) => {
    return history.slice(-MAX_GRAPH_POINTS).map((h, i) => ({
      date: h.date,
      value: h.totalReps,
      label: h.editNumber ? `Edit ${h.editNumber}` : undefined,
    }));
  };

  const buildWeightGraphData = (history) => {
    return history.slice(-MAX_GRAPH_POINTS).map((h, i) => ({
      date: h.date,
      value: h.maxWeight,
      label: h.editNumber ? `Edit ${h.editNumber}` : undefined,
    }));
  };

  const buildTimeGraphData = (history) => {
    return history.slice(-MAX_GRAPH_POINTS).map((h, i) => ({
      date: h.date,
      value: h.durationMinutes || 0,
      label: h.editNumber ? `Edit ${h.editNumber}` : undefined,
    }));
  };

  const uniqueExercises = getUniqueExercises();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading progress data...</Text>
      </View>
    );
  }

  // Detail view for a selected exercise
  if (selectedExercise) {
    const history = getExerciseHistory(selectedExercise.name, selectedExercise.dayOfWeek);
    const stats = getExerciseStats(history);
    const repsData = buildRepsGraphData(history);
    const weightData = buildWeightGraphData(history);
    const hasWeightData = weightData.some(d => d.value > 0);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setSelectedExercise(null); setRepsTooltipIdx(null); setWeightTooltipIdx(null); }} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercise Progress</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Exercise Info */}
          <View style={styles.exerciseInfoCard}>
            <Text style={styles.exerciseInfoIcon}>
              {MUSCLE_ICONS[selectedExercise.muscleGroup] || '💪'}
            </Text>
            <Text style={styles.exerciseInfoName}>{selectedExercise.name}</Text>
            <Text style={styles.exerciseInfoDay}>
              {formatLabel(selectedExercise.dayOfWeek)} • {formatLabel(selectedExercise.muscleGroup)}
            </Text>
            <Text style={styles.exerciseInfoTarget}>
              {selectedExercise.isCardio
                ? `Cardio Exercise`
                : `Target: ${selectedExercise.targetSets} sets × ${selectedExercise.targetReps} reps${selectedExercise.restTimeSeconds ? ` • Rest ${selectedExercise.restTimeSeconds}s` : ''}`}
            </Text>
          </View>

          {/* Summary Stats */}
          {stats && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>📊 Summary Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalSessions}</Text>
                  <Text style={styles.statLabel}>Edits</Text>
                </View>
                {stats.isCardio ? (
                  <>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.bestDuration} min</Text>
                      <Text style={styles.statLabel}>Best Duration</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.avgDuration} min</Text>
                      <Text style={styles.statLabel}>Avg Duration</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.bestWeight > 0 ? `${stats.bestWeight} kg` : 'N/A'}</Text>
                      <Text style={styles.statLabel}>Best Weight</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.highestTotalReps}</Text>
                      <Text style={styles.statLabel}>Highest Total Reps</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.bestVolume > 0 ? stats.bestVolume : 'N/A'}</Text>
                      <Text style={styles.statLabel}>Best Volume</Text>
                    </View>
                  </>
                )}
              </View>

              {stats.progression && (
                <View style={styles.progressionRow}>
                  <Text style={styles.progressionTitle}>Latest vs Previous:</Text>
                  <Text style={styles.progressionText}>
                    {stats.isCardio
                      ? (stats.progression.durationChange !== 0
                          ? `${stats.progression.durationChange > 0 ? '+' : ''}${stats.progression.durationChange} min`
                          : 'Same as last session')
                      : (() => {
                          const parts = [];
                          if (stats.progression.weightChange !== 0) parts.push(`${stats.progression.weightChange > 0 ? '+' : ''}${stats.progression.weightChange} kg`);
                          if (stats.progression.repsChange !== 0) parts.push(`${stats.progression.repsChange > 0 ? '+' : ''}${stats.progression.repsChange} reps`);
                          return parts.length > 0 ? parts.join(' • ') : 'Same as last session';
                        })()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Graphs — cardio shows duration, strength shows reps + weight */}
          {selectedExercise.isCardio ? (
            <>
              {(() => {
                const timeData = buildTimeGraphData(history);
                return timeData.length >= 2 ? (
                  <View style={styles.graphCard}>
                    <SimpleLineGraph
                      data={timeData}
                      label="⏱️ Duration Over Time"
                      unit="min"
                      color={colors.primary}
                      selectedIndex={repsTooltipIdx}
                      onPointPress={(i) => {
                        setRepsTooltipIdx(prev => prev === i ? null : i);
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.graphPlaceholder}>
                    <Text style={styles.graphPlaceholderIcon}>📊</Text>
                    <Text style={styles.graphPlaceholderText}>
                      Graphs will appear after 2+ sessions are logged
                    </Text>
                  </View>
                );
              })()}
            </>
          ) : (
            <>
          {/* Reps Over Time Graph */}
          {repsData.length >= 2 && (
            <View style={styles.graphCard}>
              <SimpleLineGraph
                data={repsData}
                label="📈 Reps Over Time"
                unit="reps"
                color={colors.primary}
                selectedIndex={repsTooltipIdx}
                onPointPress={(i) => {
                  setRepsTooltipIdx(prev => prev === i ? null : i);
                  setWeightTooltipIdx(null);
                }}
              />
            </View>
          )}

          {/* Weight Over Time Graph */}
          {hasWeightData && weightData.length >= 2 && (
            <View style={styles.graphCard}>
              <SimpleLineGraph
                data={weightData}
                label="🏋️ Weight Over Time"
                unit="kg"
                color={colors.success}
                selectedIndex={weightTooltipIdx}
                onPointPress={(i) => {
                  setWeightTooltipIdx(prev => prev === i ? null : i);
                  setRepsTooltipIdx(null);
                }}
              />
            </View>
          )}

          {repsData.length < 2 && (
            <View style={styles.graphPlaceholder}>
              <Text style={styles.graphPlaceholderIcon}>📊</Text>
              <Text style={styles.graphPlaceholderText}>
                Graphs will appear after 2+ sessions are logged
              </Text>
            </View>
          )}
            </>
          )}

          {/* Session History */}
          <Text style={styles.sectionTitle}>📅 Session History</Text>

          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryIcon}>📭</Text>
              <Text style={styles.emptyHistoryText}>No sessions logged yet</Text>
              <Text style={styles.emptyHistoryHint}>Edit an exercise on My Workout to see progress here</Text>
            </View>
          ) : (
            [...history].reverse().map((session, renderIdx) => {
              // originalIdx = position in chronological (ascending) history array
              const originalIdx = history.length - 1 - renderIdx;

              return (
              <View key={`${session.date}-${session.editedAt || renderIdx}`} style={[styles.sessionCard, renderIdx === 0 && styles.sessionCardLatest]}>
                <View style={styles.sessionHeader}>
                  <View>
                    <Text style={styles.sessionDate}>{formatDateTime(session.date, session.editedAt)}</Text>
                    {session.editNumber && (
                      <Text style={styles.sessionEditLabel}>Edit {session.editNumber}</Text>
                    )}
                  </View>
                  {renderIdx === 0 && (
                    <View style={styles.latestBadge}>
                      <Text style={styles.latestBadgeText}>Latest</Text>
                    </View>
                  )}
                </View>

                {/* Per-set details */}
                {session.isCardioEntry ? (
                  <View style={styles.sessionSetRow}>
                    <Text style={styles.sessionSetLabel}>⏱️ Duration</Text>
                    <Text style={styles.sessionSetDetail}>{session.durationMinutes} minutes</Text>
                  </View>
                ) : (
                  session.sets.map((set, setIdx) => (
                    <View key={setIdx} style={styles.sessionSetRow}>
                      <Text style={styles.sessionSetLabel}>Set {setIdx + 1}</Text>
                      <Text style={styles.sessionSetDetail}>
                        {set.reps} reps{set.weight > 0 ? ` × ${set.weight} kg` : ''}
                      </Text>
                    </View>
                  ))
                )}

                {/* Session summary */}
                <View style={styles.sessionSummary}>
                  <Text style={styles.sessionSummaryText}>
                    {session.isCardioEntry
                      ? `Duration: ${session.durationMinutes} min`
                      : `${session.setsCount} sets • ${session.totalReps} total reps${session.maxWeight > 0 ? ` • Max ${session.maxWeight} kg` : ''}${session.totalVolume > 0 ? ` • Volume ${session.totalVolume}` : ''}`}
                  </Text>
                </View>

                {/* Compare with chronologically previous edit (the one right before this in time) */}
                {originalIdx > 0 && (() => {
                  const prevSession = history[originalIdx - 1];
                  if (session.isCardioEntry) {
                    const durDiff = (session.durationMinutes || 0) - (prevSession.durationMinutes || 0);
                    return durDiff !== 0 ? (
                      <View style={styles.sessionComparison}>
                        <Text style={styles.sessionComparisonText}>
                          vs previous: {durDiff > 0 ? '+' : ''}{durDiff} min
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.sessionComparison}>
                        <Text style={styles.sessionComparisonText}>Same as previous edit</Text>
                      </View>
                    );
                  }
                  const weightDiff = session.maxWeight - prevSession.maxWeight;
                  const repsDiff = session.totalReps - prevSession.totalReps;
                  const parts = [];
                  if (weightDiff !== 0) parts.push(`${weightDiff > 0 ? '+' : ''}${weightDiff} kg`);
                  if (repsDiff !== 0) parts.push(`${repsDiff > 0 ? '+' : ''}${repsDiff} reps`);
                  return parts.length > 0 ? (
                    <View style={styles.sessionComparison}>
                      <Text style={styles.sessionComparisonText}>
                        vs previous: {parts.join(', ')}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.sessionComparison}>
                      <Text style={styles.sessionComparisonText}>Same as previous edit</Text>
                    </View>
                  );
                })()}
              </View>
              );
            })
          )}

          <View style={{ height: spacing.xxl * 2 }} />
        </ScrollView>
      </View>
    );
  }

  // Exercise list view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Progress</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>📈 Check Your Progress</Text>
        <Text style={styles.pageSubtitle}>
          Select an exercise to view your historical performance data
        </Text>

        {uniqueExercises.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryIcon}>🏋️</Text>
            <Text style={styles.emptyHistoryText}>No exercises edited yet</Text>
            <Text style={styles.emptyHistoryHint}>Edit an exercise on My Workout to track your progress here</Text>
          </View>
        ) : (
          uniqueExercises.map((ex, idx) => {
            const history = getExerciseHistory(ex.name, ex.dayOfWeek);
            const stats = getExerciseStats(history);

            return (
              <TouchableOpacity
                key={idx}
                style={styles.exerciseListCard}
                onPress={() => { setSelectedExercise(ex); setRepsTooltipIdx(null); setWeightTooltipIdx(null); }}
                activeOpacity={0.7}
              >
                <Text style={styles.exerciseListIcon}>
                  {ex.isCardio ? '❤️' : (MUSCLE_ICONS[ex.muscleGroup] || '💪')}
                </Text>
                <View style={styles.exerciseListInfo}>
                  <Text style={styles.exerciseListName}>{ex.name}</Text>
                  <Text style={styles.exerciseListMeta}>
                    {formatLabel(ex.dayOfWeek)} • {formatLabel(ex.muscleGroup)}
                  </Text>
                  {stats ? (
                    <Text style={styles.exerciseListStats}>
                      {stats.totalSessions} edit{stats.totalSessions !== 1 ? 's' : ''}
                      {stats.isCardio
                        ? (stats.bestDuration > 0 ? ` • Best: ${stats.bestDuration} min` : '')
                        : (stats.bestWeight > 0 ? ` • Best: ${stats.bestWeight} kg` : '')}
                    </Text>
                  ) : (
                    <Text style={styles.exerciseListStats}>No sessions logged</Text>
                  )}
                </View>
                <Text style={styles.exerciseListArrow}>→</Text>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
};

// ─── Graph Styles ───
const graphStyles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  title: { ...typography.body, fontWeight: '700', marginBottom: spacing.sm },
  graphArea: { position: 'relative', overflow: 'visible' },
  yLabel: {
    position: 'absolute', left: 0, width: 38, textAlign: 'right',
    ...typography.caption, color: colors.text.secondary, fontSize: 10,
  },
  gridLine: {
    position: 'absolute', height: 0.5, backgroundColor: colors.border + '60' || '#e0e0e060',
  },
  xLabel: {
    position: 'absolute', width: 40, textAlign: 'center',
    ...typography.caption, color: colors.text.secondary, fontSize: 9,
  },
  point: {
    width: 10, height: 10, borderRadius: 5, borderWidth: 2,
  },
  tooltip: {
    position: 'absolute', backgroundColor: colors.surface,
    borderRadius: borderRadius.sm, padding: spacing.xs,
    paddingHorizontal: spacing.sm, ...shadows.md,
    borderWidth: 1, borderColor: colors.border || '#e0e0e0',
    zIndex: 100, minWidth: 100,
  },
  tooltipDate: { ...typography.caption, color: colors.text.secondary, fontSize: 10 },
  tooltipValue: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { ...typography.body, color: colors.text.secondary, marginTop: spacing.md },
  header: {
    backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backButton: { padding: spacing.xs },
  backText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  content: { flex: 1, padding: spacing.lg },
  pageTitle: { ...typography.h2 || typography.h3, color: colors.text.primary, marginBottom: spacing.xs },
  pageSubtitle: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
  // Exercise List
  exerciseListCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm,
  },
  exerciseListIcon: { fontSize: 28, marginRight: spacing.md },
  exerciseListInfo: { flex: 1 },
  exerciseListName: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  exerciseListMeta: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  exerciseListStats: { ...typography.caption, color: colors.primary, fontWeight: '500', marginTop: 2 },
  exerciseListArrow: { fontSize: 18, color: colors.text.secondary, fontWeight: '600' },
  // Exercise Info Card
  exerciseInfoCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.lg, ...shadows.sm,
  },
  exerciseInfoIcon: { fontSize: 48, marginBottom: spacing.sm },
  exerciseInfoName: { ...typography.h3, color: colors.text.primary, textAlign: 'center' },
  exerciseInfoDay: { ...typography.body, color: colors.text.secondary, marginTop: 4 },
  exerciseInfoTarget: { ...typography.caption, color: colors.primary, fontWeight: '600', marginTop: spacing.sm },
  // Stats Card
  statsCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, ...shadows.sm,
  },
  statsTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statItem: { width: '50%', alignItems: 'center', paddingVertical: spacing.sm },
  statValue: { ...typography.h3, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  progressionRow: {
    marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 0.5,
    borderTopColor: colors.border || '#e0e0e0',
  },
  progressionTitle: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary },
  progressionText: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 4 },
  // Graph Card
  graphCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.md, ...shadows.sm,
  },
  graphPlaceholder: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.lg, ...shadows.sm,
  },
  graphPlaceholderIcon: { fontSize: 36, marginBottom: spacing.sm },
  graphPlaceholderText: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'center' },
  sectionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md, marginTop: spacing.sm },
  // Empty state
  emptyHistory: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl,
    alignItems: 'center', ...shadows.sm,
  },
  emptyHistoryIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyHistoryText: { ...typography.body, color: colors.text.secondary, fontWeight: '600' },
  emptyHistoryHint: { ...typography.caption, color: colors.text.light, marginTop: spacing.xs },
  // Session Card
  sessionCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.sm, ...shadows.sm,
  },
  sessionCardLatest: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sessionDate: { ...typography.body, fontWeight: '700', color: colors.text.primary },
  sessionEditLabel: { ...typography.caption, color: colors.primary, fontWeight: '500', marginTop: 2 },
  latestBadge: {
    backgroundColor: colors.primary + '20', borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  latestBadgeText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  sessionSetRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4,
    paddingHorizontal: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: (colors.border || '#e0e0e0') + '40',
  },
  sessionSetLabel: { ...typography.bodySmall, color: colors.text.secondary, fontWeight: '600' },
  sessionSetDetail: { ...typography.bodySmall, color: colors.text.primary },
  sessionSummary: {
    marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 0.5,
    borderTopColor: colors.border || '#e0e0e0',
  },
  sessionSummaryText: { ...typography.caption, color: colors.text.secondary, fontWeight: '500' },
  sessionComparison: {
    marginTop: spacing.xs, backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.sm, padding: spacing.xs,
  },
  sessionComparisonText: { ...typography.caption, color: colors.text.secondary, fontStyle: 'italic' },
});

export default ExerciseProgressScreen;

