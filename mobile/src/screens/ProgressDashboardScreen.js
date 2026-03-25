import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import progressService from '../services/progressService';

const ProgressDashboardScreen = ({ navigation }) => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTarget, setGoalTarget] = useState('');
  const [goalType, setGoalType] = useState('WEIGHT');
  const [showMeasForm, setShowMeasForm] = useState(false);
  const [measurements, setMeasurements] = useState({ chest: '', waist: '', hips: '', leftArm: '', rightArm: '', leftThigh: '', rightThigh: '' });

  const loadData = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([progressService.getSummary('monthly'), progressService.getTrends(30)]);
      setSummary(s); setTrends(t);
    } catch (e) {  }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { const unsub = navigation.addListener('focus', loadData); return unsub; }, [navigation]);

  const handleLogWeight = async () => {
    if (!weight) return;
    setSaving(true);
    try {
      await progressService.logWeight({ weight: parseFloat(weight), unit: 'kg', bmi: bmi ? parseFloat(bmi) : null, bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : null, notes });
      setShowWeightForm(false); setWeight(''); setBmi(''); setBodyFat(''); setNotes('');
      loadData();
      Platform.OS === 'web' ? window.alert('Weight logged! ✅') : Alert.alert('Success', 'Weight logged! ✅');
    } catch (e) { Platform.OS === 'web' ? window.alert('Failed to log weight') : Alert.alert('Error', 'Failed to log weight'); }
    setSaving(false);
  };

  const getCurrentValueForGoalType = (type) => {
    if (type === 'WEIGHT') return summary?.currentWeight || 0;
    if (type === 'BODY_FAT') return summary?.bmi || 0;
    if (type === 'WAIST') return summary?.latestMeasurements?.waist || 0;
    return 0;
  };

  const getUnitForGoalType = (type) => {
    if (type === 'WEIGHT') return 'kg';
    if (type === 'BODY_FAT') return '%';
    if (type === 'WAIST') return 'cm';
    return 'kg';
  };

  const handleSetGoal = async () => {
    if (!goalTarget) return;
    setSaving(true);
    try {
      const targetDate = new Date(); targetDate.setMonth(targetDate.getMonth() + 3);
      const currentValue = getCurrentValueForGoalType(goalType);
      const unit = getUnitForGoalType(goalType);
      await progressService.setGoal({ goalType, targetValue: parseFloat(goalTarget), currentValue, targetDate: targetDate.toISOString().split('T')[0], unit });
      setShowGoalForm(false); setGoalTarget(''); setGoalType('WEIGHT');
      await loadData();
      Platform.OS === 'web' ? window.alert('Goal set! 🎯') : Alert.alert('Success', 'Goal set! 🎯');
    } catch (e) { Platform.OS === 'web' ? window.alert('Failed to set goal') : Alert.alert('Error', 'Failed to set goal'); }
    setSaving(false);
  };

  const handleLogMeasurements = async () => {
    setSaving(true);
    try {
      const data = {};
      Object.entries(measurements).forEach(([k, v]) => { if (v) data[k] = parseFloat(v); });
      data.unit = 'cm';
      await progressService.logMeasurements(data);
      setShowMeasForm(false); setMeasurements({ chest: '', waist: '', hips: '', leftArm: '', rightArm: '', leftThigh: '', rightThigh: '' });
      loadData();
      Platform.OS === 'web' ? window.alert('Measurements logged! 📏') : Alert.alert('Success', 'Measurements logged! 📏');
    } catch (e) { Platform.OS === 'web' ? window.alert('Failed to log measurements') : Alert.alert('Error', 'Failed'); }
    setSaving(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading progress...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Progress Tracking</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
        {/* Current Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statValue}>{summary?.currentWeight ? `${summary.currentWeight} kg` : '—'}</Text><Text style={styles.statLabel}>Weight</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>{summary?.bmi ? summary.bmi.toFixed(1) : '—'}</Text><Text style={styles.statLabel}>BMI</Text></View>
            <View style={styles.stat}><Text style={[styles.statValue, { color: summary?.weightChange > 0 ? colors.error : colors.success }]}>{summary?.weightChange ? `${summary.weightChange > 0 ? '+' : ''}${summary.weightChange.toFixed(1)} kg` : '—'}</Text><Text style={styles.statLabel}>Change (30d)</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>🔥 {summary?.streakDays || 0}</Text><Text style={styles.statLabel}>Day Streak</Text></View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => setShowWeightForm(true)}><Text style={styles.actionBtnText}>⚖️ Log Weight</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => setShowMeasForm(true)}><Text style={styles.actionBtnText}>📏 Measurements</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.info || '#374151' }]} onPress={() => setShowGoalForm(true)}><Text style={styles.actionBtnText}>🎯 Set Goal</Text></TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#111827', marginBottom: spacing.md, paddingVertical: spacing.md }]}
          onPress={() => navigation.navigate('ReportGenerator')}
        >
          <Text style={styles.actionBtnText}>📄 Generate Report</Text>
        </TouchableOpacity>

        {/* Weight Form */}
        {showWeightForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Log Today's Weight</Text>
            <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} placeholderTextColor={colors.text.secondary} />
            <TextInput style={styles.input} placeholder="BMI (optional)" keyboardType="numeric" value={bmi} onChangeText={setBmi} placeholderTextColor={colors.text.secondary} />
            <TextInput style={styles.input} placeholder="Body Fat % (optional)" keyboardType="numeric" value={bodyFat} onChangeText={setBodyFat} placeholderTextColor={colors.text.secondary} />
            <TextInput style={styles.input} placeholder="Notes (optional)" value={notes} onChangeText={setNotes} placeholderTextColor={colors.text.secondary} />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWeightForm(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleLogWeight} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}</TouchableOpacity>
            </View>
          </View>
        )}

        {/* Measurements Form */}
        {showMeasForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Log Body Measurements (cm)</Text>
            {['chest', 'waist', 'hips', 'leftArm', 'rightArm', 'leftThigh', 'rightThigh'].map(k => (
              <TextInput key={k} style={styles.input} placeholder={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} keyboardType="numeric" value={measurements[k]} onChangeText={v => setMeasurements({ ...measurements, [k]: v })} placeholderTextColor={colors.text.secondary} />
            ))}
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowMeasForm(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleLogMeasurements} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}</TouchableOpacity>
            </View>
          </View>
        )}

        {/* Goal Form */}
        {showGoalForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Set a Goal</Text>
            <View style={styles.goalTypes}>
              {['WEIGHT', 'BODY_FAT', 'WAIST'].map(t => {
                const hasExisting = summary?.activeGoals?.some(g => g.goalType === t);
                return (
                  <TouchableOpacity key={t} style={[styles.goalTypeBtn, goalType === t && styles.goalTypeBtnActive]} onPress={() => { setGoalType(t); setGoalTarget(''); }}>
                    <Text style={[styles.goalTypeText, goalType === t && styles.goalTypeTextActive]}>
                      {t === 'WEIGHT' ? '⚖️ Weight' : t === 'BODY_FAT' ? '📊 Body Fat' : '📏 Waist'}
                      {hasExisting ? ' ✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {summary?.activeGoals?.some(g => g.goalType === goalType) && (
              <Text style={{ ...typography.caption, color: colors.warning || '#f59e0b', marginBottom: spacing.xs }}>
                ⚠️ This will replace your existing {goalType === 'WEIGHT' ? 'weight' : goalType === 'BODY_FAT' ? 'body fat' : 'waist'} goal
              </Text>
            )}
            {getCurrentValueForGoalType(goalType) > 0 && (
              <Text style={{ ...typography.caption, color: colors.text.secondary, marginBottom: spacing.sm }}>
                Current {goalType === 'WEIGHT' ? 'weight' : goalType === 'BODY_FAT' ? 'body fat' : 'waist'}: {getCurrentValueForGoalType(goalType)} {getUnitForGoalType(goalType)}
              </Text>
            )}
            <TextInput style={styles.input} placeholder={`Target ${goalType === 'WEIGHT' ? 'weight' : goalType === 'BODY_FAT' ? 'body fat' : 'waist'} (${getUnitForGoalType(goalType)})`} keyboardType="numeric" value={goalTarget} onChangeText={setGoalTarget} placeholderTextColor={colors.text.secondary} />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowGoalForm(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSetGoal} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Set Goal</Text>}</TouchableOpacity>
            </View>
          </View>
        )}

        {/* Goals */}
        {summary?.activeGoals?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Active Goals</Text>
            {summary.activeGoals.map((g, i) => (
              <View key={i} style={styles.goalItem}>
                <View style={styles.goalHeader}><Text style={styles.goalType}>{g.goalType?.replace(/_/g, ' ')}</Text><Text style={styles.goalProgress}>{(g.progressPercentage || 0).toFixed(0)}%</Text></View>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(g.progressPercentage || 0, 100)}%` }]} /></View>
                <Text style={styles.goalDetail}>Current: {g.currentValue} → Target: {g.targetValue} {g.unit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Weight Trend */}
        {trends?.weightTrend?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Weight Trend (30 days)</Text>
            <View style={styles.trendContainer}>
              {trends.weightTrend.slice(-7).map((p, i) => (
                <View key={i} style={styles.trendPoint}>
                  <Text style={styles.trendValue}>{p.value?.toFixed(1)}</Text>
                  <View style={[styles.trendBar, { height: Math.max(20, (p.value - (trends.weightTrend.reduce((min, x) => Math.min(min, x.value), 999)) + 1) * 10) }]} />
                  <Text style={styles.trendDate}>{new Date(p.date).getDate()} {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(p.date).getMonth()]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Latest Measurements */}
        {summary?.latestMeasurements && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📏 Latest Measurements</Text>
            <View style={styles.measGrid}>
              {[['Chest', summary.latestMeasurements.chest], ['Waist', summary.latestMeasurements.waist], ['Hips', summary.latestMeasurements.hips], ['Left Arm', summary.latestMeasurements.leftArm], ['Right Arm', summary.latestMeasurements.rightArm]].map(([label, val]) => val ? (
                <View key={label} style={styles.measItem}><Text style={styles.measValue}>{val} cm</Text><Text style={styles.measLabel}>{label}</Text></View>
              ) : null)}
            </View>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: spacing.md, paddingTop: spacing.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backText: { color: colors.text.inverse, fontSize: 16 },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  content: { flex: 1, padding: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.text.secondary },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  cardTitle: { ...typography.h4, color: colors.text.primary, marginBottom: spacing.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { ...typography.body, fontWeight: 'bold', color: colors.primary },
  statLabel: { ...typography.caption, color: colors.text.secondary },
  actionsRow: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
  actionBtn: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  formCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  formTitle: { ...typography.h4, color: colors.text.primary, marginBottom: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm, color: colors.text.primary, backgroundColor: colors.surface },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: { padding: spacing.sm, paddingHorizontal: spacing.md },
  cancelText: { color: colors.text.secondary },
  saveBtn: { backgroundColor: colors.primary, padding: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  goalTypes: { flexDirection: 'row', marginBottom: spacing.sm, gap: spacing.xs },
  goalTypeBtn: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  goalTypeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  goalTypeText: { fontSize: 12, color: colors.text.secondary },
  goalTypeTextActive: { color: '#fff' },
  goalItem: { marginBottom: spacing.sm, padding: spacing.sm, backgroundColor: colors.background, borderRadius: borderRadius.md },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  goalType: { fontWeight: '600', color: colors.text.primary, textTransform: 'capitalize' },
  goalProgress: { fontWeight: 'bold', color: colors.primary },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  goalDetail: { ...typography.caption, color: colors.text.secondary },
  trendContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, paddingTop: spacing.sm },
  trendPoint: { alignItems: 'center', flex: 1 },
  trendValue: { fontSize: 10, color: colors.text.secondary, marginBottom: 2 },
  trendBar: { width: 20, backgroundColor: colors.primary + '40', borderRadius: 4 },
  trendDate: { fontSize: 9, color: colors.text.secondary, marginTop: 2 },
  measGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  measItem: { width: '33%', alignItems: 'center', paddingVertical: spacing.sm },
  measValue: { fontWeight: 'bold', color: colors.primary },
  measLabel: { ...typography.caption, color: colors.text.secondary },
});

export default ProgressDashboardScreen;

