import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, Modal, TextInput } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import wellnessService from '../services/wellnessService';

const formatLabel = (s) => s ? s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : '';

const WellnessHomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [dailyTip, setDailyTip] = useState(null);
  const [streak, setStreak] = useState(null);
  const [yogaPoses, setYogaPoses] = useState([]);
  const [meditations, setMeditations] = useState([]);
  const [breathings, setBreathings] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [planType, setPlanType] = useState('MIXED');
  const [planLevel, setPlanLevel] = useState('BEGINNER');
  const [planWeeks, setPlanWeeks] = useState(4);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(5);
  const [sessionDuration, setSessionDuration] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [poseModal, setPoseModal] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [plan, tip, str, poses, meds, breaths] = await Promise.all([
        wellnessService.getMyPlan().catch(() => null),
        wellnessService.getDailyTip().catch(() => null),
        wellnessService.getStreak().catch(() => null),
        wellnessService.getYogaPoses().catch(() => []),
        wellnessService.getMeditationSessions().catch(() => []),
        wellnessService.getBreathingExercises().catch(() => []),
      ]);
      setActivePlan(plan); setDailyTip(tip); setStreak(str);
      setYogaPoses(poses || []); setMeditations(meds || []); setBreathings(breaths || []);
    } catch (e) { console.log('Failed:', e.message); }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { const unsub = navigation.addListener('focus', loadData); return unsub; }, [navigation]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const plan = await wellnessService.generatePlan({ type: planType, level: planLevel, durationWeeks: planWeeks, sessionsPerWeek, sessionDurationMinutes: sessionDuration });
      setGeneratedPlan(plan); setShowSetup(false);
    } catch (e) { Platform.OS === 'web' ? window.alert('Failed to generate plan') : Alert.alert('Error', 'Failed to generate plan'); }
    setGenerating(false);
  };

  const handleAssign = async () => {
    if (!generatedPlan) return;
    setAssigning(true);
    try {
      const result = await wellnessService.assignPlan(generatedPlan.id);
      setActivePlan(result); setGeneratedPlan(null);
      const msg = result?.scheduledForTomorrow ? 'Your new wellness plan starts tomorrow! Your current plan stays active until midnight. 🌅' : 'Your wellness plan has been assigned! Namaste! 🧘';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert(result?.scheduledForTomorrow ? 'Plan Scheduled! 📅' : 'Plan Assigned! 🎉', msg);
      loadData();
    } catch (e) { Platform.OS === 'web' ? window.alert('Failed') : Alert.alert('Error', 'Failed to assign plan'); }
    setAssigning(false);
  };

  const handleComplete = async (sessionType, sessionId, duration) => {
    try {
      await wellnessService.completeSession({ sessionType, sessionId, durationMinutes: duration || 15 });
      Platform.OS === 'web' ? window.alert('Session completed! 🎉') : Alert.alert('Well done! 🎉', 'Session completed!');
      loadData();
    } catch (e) { Platform.OS === 'web' ? window.alert('Failed') : Alert.alert('Error', 'Failed to mark complete'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading wellness...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🧘 Yoga & Wellness</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
        {/* Daily Tip */}
        {dailyTip && (
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>🕊️ Daily Wellness Tip</Text>
            <Text style={styles.tipContent}>{dailyTip.content}</Text>
          </View>
        )}

        {/* Streak */}
        {streak && (
          <View style={styles.streakRow}>
            <View style={styles.streakItem}><Text style={styles.streakVal}>🔥 {streak.currentStreak}</Text><Text style={styles.streakLabel}>Day Streak</Text></View>
            <View style={styles.streakItem}><Text style={styles.streakVal}>✅ {streak.totalSessionsCompleted}</Text><Text style={styles.streakLabel}>Sessions</Text></View>
            <View style={styles.streakItem}><Text style={styles.streakVal}>⏱️ {streak.totalMinutes}</Text><Text style={styles.streakLabel}>Minutes</Text></View>
          </View>
        )}

        {/* Active Plan or Create */}
        {activePlan ? (
          <View style={styles.planCard}>
            <View style={styles.planHeader}><Text style={styles.planTitle}>📋 {activePlan.wellnessPlan?.planName}</Text><Text style={styles.planStatus}>{formatLabel(activePlan.status)}</Text></View>
            <Text style={styles.planDesc}>{activePlan.wellnessPlan?.description}</Text>
            <View style={styles.planStats}>
              <Text style={styles.planStat}>{activePlan.completedSessions || 0}/{activePlan.totalSessions || 0} sessions</Text>
              <Text style={styles.planStat}>{formatLabel(activePlan.wellnessPlan?.type)}</Text>
              <Text style={styles.planStat}>{formatLabel(activePlan.wellnessPlan?.level)}</Text>
            </View>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${activePlan.totalSessions ? (activePlan.completedSessions / activePlan.totalSessions) * 100 : 0}%` }]} /></View>
            <TouchableOpacity style={styles.newPlanBtn} onPress={() => { if (Platform.OS === 'web') { if (window.confirm('Create new plan? Current plan stays until midnight, new starts tomorrow.')) setShowSetup(true); } else Alert.alert('New Plan', 'Current plan stays until midnight, new starts tomorrow.', [{ text: 'Cancel' }, { text: 'Continue', onPress: () => setShowSetup(true) }]); }}>
              <Text style={styles.newPlanText}>+ Create New Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.createPlanCard} onPress={() => setShowSetup(true)}>
            <Text style={styles.createIcon}>🪄</Text>
            <View style={{ flex: 1 }}><Text style={styles.createTitle}>Create Wellness Plan</Text><Text style={styles.createDesc}>Generate a personalized yoga, meditation & breathing plan</Text></View>
            <Text style={styles.createArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Plan Setup Modal */}
        {showSetup && (
          <View style={styles.setupCard}>
            <Text style={styles.sectionTitle}>⚙️ Plan Setup</Text>
            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {['YOGA', 'MEDITATION', 'MIXED'].map(t => <TouchableOpacity key={t} style={[styles.chip, planType === t && styles.chipActive]} onPress={() => setPlanType(t)}><Text style={[styles.chipText, planType === t && styles.chipTextActive]}>{t === 'YOGA' ? '🧘 Yoga' : t === 'MEDITATION' ? '🧠 Meditation' : '🌿 Mixed'}</Text></TouchableOpacity>)}
            </View>
            <Text style={styles.label}>Level</Text>
            <View style={styles.chipRow}>
              {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(l => <TouchableOpacity key={l} style={[styles.chip, planLevel === l && styles.chipActive]} onPress={() => setPlanLevel(l)}><Text style={[styles.chipText, planLevel === l && styles.chipTextActive]}>{formatLabel(l)}</Text></TouchableOpacity>)}
            </View>
            <Text style={styles.label}>Duration: {planWeeks} weeks</Text>
            <View style={styles.numPicker}>
              <TouchableOpacity onPress={() => setPlanWeeks(Math.max(1, planWeeks - 1))}><Text style={styles.numBtn}>−</Text></TouchableOpacity>
              <Text style={styles.numVal}>{planWeeks}</Text>
              <TouchableOpacity onPress={() => setPlanWeeks(Math.min(12, planWeeks + 1))}><Text style={styles.numBtn}>+</Text></TouchableOpacity>
            </View>
            <Text style={styles.label}>Sessions/Week: {sessionsPerWeek}</Text>
            <View style={styles.numPicker}>
              <TouchableOpacity onPress={() => setSessionsPerWeek(Math.max(1, sessionsPerWeek - 1))}><Text style={styles.numBtn}>−</Text></TouchableOpacity>
              <Text style={styles.numVal}>{sessionsPerWeek}</Text>
              <TouchableOpacity onPress={() => setSessionsPerWeek(Math.min(7, sessionsPerWeek + 1))}><Text style={styles.numBtn}>+</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={generating}>
              {generating ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateBtnText}>Generate Plan ✨</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSetup(false)}><Text style={[styles.cancelText, { textAlign: 'center', marginTop: spacing.sm }]}>Cancel</Text></TouchableOpacity>
          </View>
        )}

        {/* Generated Plan Preview */}
        {generatedPlan && (
          <View style={styles.planPreview}>
            <Text style={styles.sectionTitle}>✨ Generated Plan</Text>
            <Text style={styles.planName}>{generatedPlan.planName}</Text>
            <Text style={styles.planDesc}>{generatedPlan.description}</Text>
            <View style={styles.planStats}>
              <Text style={styles.planStat}>{generatedPlan.durationWeeks} weeks</Text>
              <Text style={styles.planStat}>{generatedPlan.sessionsPerWeek} sessions/week</Text>
              <Text style={styles.planStat}>~{generatedPlan.totalCaloriesBurned} cal total</Text>
            </View>
            {generatedPlan.sessions?.map((s, i) => (
              <View key={i} style={styles.sessionItem}>
                <Text style={styles.sessionDay}>{s.dayOfWeek}</Text>
                <View style={{ flex: 1 }}><Text style={styles.sessionName}>{s.sessionType === 'YOGA' ? '🧘' : s.sessionType === 'MEDITATION' ? '🧠' : '🌬️'} {s.sessionName}</Text><Text style={styles.sessionDesc}>{s.durationMinutes} min • ~{s.caloriesBurned} cal</Text></View>
              </View>
            ))}
            <TouchableOpacity style={styles.assignBtn} onPress={handleAssign} disabled={assigning}>
              {assigning ? <ActivityIndicator color="#fff" /> : <Text style={styles.assignBtnText}>Assign This Plan 🎯</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Yoga Poses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧘 Yoga Poses ({yogaPoses.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {yogaPoses.slice(0, 8).map(p => (
              <TouchableOpacity key={p.id} style={styles.poseCard} onPress={() => setPoseModal(p)}>
                <Text style={styles.poseEmoji}>{p.difficulty === 'BEGINNER' ? '🟢' : p.difficulty === 'INTERMEDIATE' ? '🟡' : '🔴'}</Text>
                <Text style={styles.poseName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.poseSanskrit} numberOfLines={1}>{p.sanskritName}</Text>
                <Text style={styles.poseDuration}>{p.durationSeconds}s</Text>
                <TouchableOpacity style={styles.completeSmBtn} onPress={() => handleComplete('YOGA', p.id, Math.ceil(p.durationSeconds / 60))}><Text style={styles.completeSmText}>✅ Done</Text></TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Meditation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Meditation ({meditations.length})</Text>
          {meditations.slice(0, 4).map(m => (
            <View key={m.id} style={styles.listItem}>
              <View style={{ flex: 1 }}><Text style={styles.listName}>{m.name}</Text><Text style={styles.listDesc}>{m.description}</Text><Text style={styles.listMeta}>{m.durationMinutes} min • {formatLabel(m.type)} • {formatLabel(m.difficulty)}</Text></View>
              <TouchableOpacity style={styles.completeMdBtn} onPress={() => handleComplete('MEDITATION', m.id, m.durationMinutes)}><Text style={styles.completeMdText}>✅</Text></TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Breathing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌬️ Breathing Exercises ({breathings.length})</Text>
          {breathings.map(b => (
            <View key={b.id} style={styles.listItem}>
              <View style={{ flex: 1 }}><Text style={styles.listName}>{b.name} ({b.pattern})</Text><Text style={styles.listDesc}>{b.description}</Text><Text style={styles.listMeta}>{b.durationMinutes} min • {formatLabel(b.technique)}</Text></View>
              <TouchableOpacity style={styles.completeMdBtn} onPress={() => handleComplete('BREATHING', b.id, b.durationMinutes)}><Text style={styles.completeMdText}>✅</Text></TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Pose Detail Modal */}
      <Modal visible={!!poseModal} transparent animationType="slide" onRequestClose={() => setPoseModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {poseModal && (<>
              <View style={styles.modalHeader}><Text style={styles.modalTitle}>{poseModal.name}</Text><TouchableOpacity onPress={() => setPoseModal(null)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity></View>
              <Text style={styles.modalSanskrit}>{poseModal.sanskritName}</Text>
              <Text style={styles.modalDesc}>{poseModal.description}</Text>
              <Text style={styles.modalLabel}>Benefits</Text><Text style={styles.modalText}>{poseModal.benefits}</Text>
              <Text style={styles.modalLabel}>Instructions</Text><Text style={styles.modalText}>{poseModal.instructions}</Text>
              <View style={styles.modalMeta}><Text style={styles.modalTag}>{formatLabel(poseModal.difficulty)}</Text><Text style={styles.modalTag}>{poseModal.durationSeconds}s</Text><Text style={styles.modalTag}>{formatLabel(poseModal.category)}</Text></View>
              <TouchableOpacity style={styles.assignBtn} onPress={() => { handleComplete('YOGA', poseModal.id, Math.ceil(poseModal.durationSeconds / 60)); setPoseModal(null); }}><Text style={styles.assignBtnText}>Mark as Done ✅</Text></TouchableOpacity>
            </>)}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: '#6b46c1', padding: spacing.md, paddingTop: spacing.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backText: { color: '#fff', fontSize: 16 }, headerTitle: { ...typography.h3, color: '#fff' },
  content: { flex: 1, padding: spacing.md }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  tipCard: { backgroundColor: '#f0e6ff', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: '#6b46c1' },
  tipLabel: { fontWeight: '600', color: '#6b46c1', marginBottom: 4 }, tipContent: { color: colors.text.primary, lineHeight: 22 },
  streakRow: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
  streakItem: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', ...shadows.sm },
  streakVal: { fontWeight: 'bold', fontSize: 18, color: colors.text.primary }, streakLabel: { ...typography.caption, color: colors.text.secondary },
  planCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  planTitle: { ...typography.h4, color: colors.text.primary, flex: 1 }, planStatus: { color: colors.success, fontWeight: '600' },
  planDesc: { color: colors.text.secondary, marginBottom: spacing.sm },
  planStats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  planStat: { ...typography.caption, color: '#6b46c1', fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.sm },
  progressFill: { height: '100%', backgroundColor: '#6b46c1', borderRadius: 4 },
  newPlanBtn: { marginTop: spacing.xs }, newPlanText: { color: '#6b46c1', fontWeight: '600', textAlign: 'center' },
  createPlanCard: { backgroundColor: '#6b46c1', borderRadius: borderRadius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, ...shadows.md },
  createIcon: { fontSize: 32, marginRight: spacing.md }, createTitle: { color: '#fff', fontWeight: 'bold' }, createDesc: { color: '#fff', opacity: 0.9, fontSize: 12 }, createArrow: { color: '#fff', fontSize: 24 },
  setupCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  sectionTitle: { ...typography.h4, color: colors.text.primary, marginBottom: spacing.sm },
  label: { fontWeight: '600', color: colors.text.primary, marginBottom: 4, marginTop: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: '#6b46c1', borderColor: '#6b46c1' },
  chipText: { color: colors.text.secondary }, chipTextActive: { color: '#fff' },
  numPicker: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  numBtn: { fontSize: 24, color: '#6b46c1', fontWeight: 'bold', width: 36, textAlign: 'center' }, numVal: { fontSize: 18, fontWeight: 'bold' },
  generateBtn: { backgroundColor: '#6b46c1', padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.md },
  generateBtnText: { color: '#fff', fontWeight: 'bold' }, cancelText: { color: colors.text.secondary },
  planPreview: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  planName: { ...typography.h4, color: colors.text.primary },
  sessionItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, backgroundColor: colors.background, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  sessionDay: { fontWeight: '600', color: '#6b46c1', width: 80, fontSize: 11 }, sessionName: { fontWeight: '600', color: colors.text.primary }, sessionDesc: { ...typography.caption, color: colors.text.secondary },
  assignBtn: { backgroundColor: '#6b46c1', padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.md },
  assignBtnText: { color: '#fff', fontWeight: 'bold' },
  section: { marginBottom: spacing.md },
  poseCard: { width: 120, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm, marginRight: spacing.sm, ...shadows.sm, alignItems: 'center' },
  poseEmoji: { fontSize: 20, marginBottom: 4 }, poseName: { fontWeight: '600', fontSize: 12, color: colors.text.primary, textAlign: 'center' },
  poseSanskrit: { fontSize: 10, color: colors.text.secondary, fontStyle: 'italic' }, poseDuration: { fontSize: 10, color: '#6b46c1', marginTop: 2 },
  completeSmBtn: { marginTop: 4, backgroundColor: colors.success + '20', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  completeSmText: { fontSize: 10, color: colors.success },
  listItem: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm, alignItems: 'center' },
  listName: { fontWeight: '600', color: colors.text.primary }, listDesc: { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
  listMeta: { ...typography.caption, color: '#6b46c1', marginTop: 4 },
  completeMdBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }, completeMdText: { fontSize: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modalTitle: { ...typography.h3, color: colors.text.primary, flex: 1 }, closeBtn: { fontSize: 20, color: colors.text.secondary, padding: spacing.sm },
  modalSanskrit: { fontStyle: 'italic', color: '#6b46c1', marginBottom: spacing.sm },
  modalDesc: { color: colors.text.secondary, marginBottom: spacing.md },
  modalLabel: { fontWeight: '600', color: colors.text.primary, marginTop: spacing.sm, marginBottom: 4 },
  modalText: { color: colors.text.secondary, lineHeight: 20 },
  modalMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalTag: { backgroundColor: '#6b46c1' + '20', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, color: '#6b46c1', fontSize: 12 },
});

export default WellnessHomeScreen;

