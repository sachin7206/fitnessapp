import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../config/theme';
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
      console.log('Failed to load report:', error);
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
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
          <View style={[styles.plateauBadge, { backgroundColor: plateauData.isPlateauDetected ? '#FFF3E0' : '#E8F5E9' }]}>
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
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  header: { padding: spacing.lg, paddingTop: 50, backgroundColor: '#673AB7' },
  backText: { color: '#fff', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scoreCard: { margin: spacing.lg, backgroundColor: '#fff', borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  scoreBadge: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  scoreLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  scoreSummary: { fontSize: 15, textAlign: 'center', color: colors.text.secondary, marginTop: spacing.md, lineHeight: 22 },
  aiTag: { fontSize: 11, color: colors.primary, marginTop: spacing.sm, backgroundColor: '#E8EAF6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  section: { margin: spacing.lg, marginTop: 0, backgroundColor: '#fff', borderRadius: borderRadius.md, padding: spacing.lg, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text.primary, marginBottom: spacing.md },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  listIcon: { fontSize: 14, marginRight: 8, marginTop: 2 },
  listText: { fontSize: 14, color: colors.text.secondary, flex: 1, lineHeight: 20 },
  plateauSection: {},
  plateauBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: spacing.sm },
  plateauStatus: { fontSize: 14, fontWeight: '600' },
  plateauAnalysis: { fontSize: 14, color: colors.text.secondary, marginBottom: spacing.sm, lineHeight: 20 },
  suggestionItem: { fontSize: 13, color: colors.text.secondary, marginBottom: 4 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  achievementLocked: { opacity: 0.6 },
  achievementIcon: { fontSize: 28, marginRight: spacing.md },
  achievementInfo: { flex: 1 },
  achievementName: { fontSize: 15, fontWeight: '600' },
  achievementDesc: { fontSize: 12, color: colors.text.secondary },
  achievementProgress: { height: 4, backgroundColor: '#eee', borderRadius: 2, marginTop: 4 },
  achievementBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  earnedBadge: { fontSize: 20 },
  streakCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  streakType: { fontSize: 14, fontWeight: '600', flex: 1 },
  streakCount: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  streakBest: { fontSize: 12, color: colors.text.secondary, marginLeft: spacing.md },
});

export default WeeklyReportScreen;

