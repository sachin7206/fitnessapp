import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import progressService from '../services/progressService';

const WeeklyReportScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [plateauData, setPlateauData] = useState(null);
  const [achievements, setAchievements] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportRes, plateauRes, achievementsRes] = await Promise.all([
        progressService.getWeeklyReport().catch(() => null),
        progressService.getPlateauAnalysis(30).catch(() => null),
        progressService.getAchievements().catch(() => null),
      ]);
      setReport(reportRes);
      setPlateauData(plateauRes);
      setAchievements(achievementsRes);
    } catch (error) {
      
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#FF9800';
    return '#EF4444';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generating your weekly report...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Weekly Report</Text>
        {report?.weekStartDate && (
          <Text style={styles.subtitle}>Week of {report.weekStartDate}</Text>
        )}
      </View>

      {/* Overall Score */}
      {report && (
        <View style={styles.scoreCard}>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(report.overallScore) }]}>
            <Text style={styles.scoreValue}>{report.overallScore}</Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
          <Text style={styles.scoreSummary}>{report.summary}</Text>
          {report.fromAi && <Text style={styles.aiTag}>🤖 AI Generated</Text>}
        </View>
      )}

      {/* Highlights */}
      {report?.highlights?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Highlights</Text>
          {report.highlights.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listIcon}>💪</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Concerns */}
      {report?.concerns?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Areas to Improve</Text>
          {report.concerns.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listIcon}>🔸</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {report?.recommendations?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Recommendations</Text>
          {report.recommendations.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listIcon}>✅</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Plateau Detection */}
      {plateauData && (
        <View style={[styles.section, styles.plateauSection]}>
          <Text style={styles.sectionTitle}>📈 Plateau Analysis</Text>
          <View style={[styles.plateauBadge, { backgroundColor: plateauData.isPlateauDetected ? '#FEF3C7' : '#F0FDF4' }]}>
            <Text style={styles.plateauStatus}>
              {plateauData.isPlateauDetected ? '⚠️ Plateau Detected' : '✅ No Plateau Detected'}
            </Text>
          </View>
          <Text style={styles.plateauAnalysis}>{plateauData.analysis}</Text>
          {plateauData.suggestions?.map((s, idx) => (
            <Text key={idx} style={styles.suggestionItem}>• {s}</Text>
          ))}
        </View>
      )}

      {/* Achievements */}
      {achievements?.achievements?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>
          {achievements.achievements.map((ach, idx) => (
            <View key={idx} style={[styles.achievementCard, !ach.earned && styles.achievementLocked]}>
              <Text style={styles.achievementIcon}>{ach.icon}</Text>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementName}>{ach.name}</Text>
                <Text style={styles.achievementDesc}>{ach.description}</Text>
                {!ach.earned && (
                  <View style={styles.achievementProgress}>
                    <View style={[styles.achievementBar, { width: `${ach.progress}%` }]} />
                  </View>
                )}
              </View>
              {ach.earned && <Text style={styles.earnedBadge}>✅</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Streaks */}
      {achievements?.streaks?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Streaks</Text>
          {achievements.streaks.map((streak, idx) => (
            <View key={idx} style={styles.streakCard}>
              <Text style={styles.streakType}>{streak.type}</Text>
              <Text style={styles.streakCount}>{streak.currentCount} days</Text>
              <Text style={styles.streakBest}>Best: {streak.longestCount} days</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  header: { padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg, backgroundColor: colors.primary, flexDirection: 'row', flexWrap: 'wrap' },
  backText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600', width: '100%', marginBottom: spacing.xs },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text.inverse, width: '100%' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, width: '100%' },
  scoreCard: { margin: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', ...shadows.md },
  scoreBadge: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontSize: 28, fontWeight: 'bold', color: colors.text.inverse },
  scoreLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  scoreSummary: { fontSize: 15, textAlign: 'center', color: colors.text.secondary, marginTop: spacing.md, lineHeight: 22 },
  aiTag: { fontSize: 11, color: colors.primary, marginTop: spacing.sm, backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  section: { margin: spacing.lg, marginTop: 0, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.md },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  listIcon: { fontSize: 14, marginRight: 8, marginTop: 2 },
  listText: { fontSize: 14, color: colors.text.secondary, flex: 1, lineHeight: 20 },
  plateauSection: {},
  plateauBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: spacing.sm },
  plateauStatus: { fontSize: 14, fontWeight: '600' },
  plateauAnalysis: { fontSize: 14, color: colors.text.secondary, marginBottom: spacing.sm, lineHeight: 20 },
  suggestionItem: { fontSize: 13, color: colors.text.secondary, marginBottom: 4 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  achievementLocked: { opacity: 0.6 },
  achievementIcon: { fontSize: 28, marginRight: spacing.md },
  achievementInfo: { flex: 1 },
  achievementName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  achievementDesc: { fontSize: 12, color: colors.text.secondary },
  achievementProgress: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 4 },
  achievementBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  earnedBadge: { fontSize: 20 },
  streakCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  streakType: { fontSize: 14, fontWeight: '600', flex: 1, color: colors.text.primary },
  streakCount: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  streakBest: { fontSize: 12, color: colors.text.secondary, marginLeft: spacing.md },
});

export default WeeklyReportScreen;

