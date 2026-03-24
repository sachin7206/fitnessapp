import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Platform, TextInput, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, spacing, borderRadius } from '../config/theme';
import { fetchExerciseReport, fetchDietReport, clearReports } from '../store/slices/reportSlice';
import ExerciseReportTable from './components/ExerciseReportTable';
import DietReportTable from './components/DietReportTable';
import { generateReportPDF } from '../utils/reportPdfGenerator';

const formatDate = (d) => d.toISOString().split('T')[0];

const TIMEFRAMES = [
  { label: 'Last Week', days: 7 },
  { label: 'Last 1 Month', days: 30 },
  { label: 'Last 3 Months', days: 90 },
];

const ReportGeneratorScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { exerciseReport, dietReport, loading, error } = useSelector((state) => state.report);

  const [includeExercise, setIncludeExercise] = useState(true);
  const [includeDiet, setIncludeDiet] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(null);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [generated, setGenerated] = useState(false);
  const scrollRef = useRef(null);

  const getDateRange = useCallback(() => {
    if (showCustomRange && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    if (selectedTimeframe !== null) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - TIMEFRAMES[selectedTimeframe].days);
      return { startDate: formatDate(start), endDate: formatDate(end) };
    }
    return null;
  }, [showCustomRange, customStart, customEnd, selectedTimeframe]);

  const handleGenerate = async () => {
    if (!includeExercise && !includeDiet) {
      Alert.alert('Select Report', 'Please select at least one report type.');
      return;
    }
    const range = getDateRange();
    if (!range) {
      Alert.alert('Select Timeframe', 'Please select a timeframe or enter a custom date range.');
      return;
    }
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(range.startDate) || !dateRegex.test(range.endDate)) {
      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format for dates.');
      return;
    }
    if (range.startDate > range.endDate) {
      Alert.alert('Invalid Range', 'Start date must be before end date.');
      return;
    }

    dispatch(clearReports());
    setGenerated(true);

    const promises = [];
    if (includeExercise) promises.push(dispatch(fetchExerciseReport(range)));
    if (includeDiet) promises.push(dispatch(fetchDietReport(range)));
    await Promise.all(promises);

    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 500);
  };

  const handleDownloadPDF = async () => {
    try {
      await generateReportPDF(exerciseReport, dietReport);
    } catch (e) {
      Alert.alert('PDF Error', 'Could not generate PDF. ' + (e.message || ''));
    }
  };

  const rangeLabel = (() => {
    const r = getDateRange();
    return r ? `${r.startDate}  →  ${r.endDate}` : '';
  })();

  return (
    <ScrollView ref={scrollRef} style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header ─── */}
      <View style={[styles.header, { backgroundColor: '#111827' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Report Generator</Text>
        <Text style={styles.subtitle}>Create custom fitness & diet reports</Text>
      </View>

      {/* ─── Report Type Selection ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Report Types</Text>
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkbox, includeExercise && styles.checkboxActive]}
            onPress={() => setIncludeExercise(!includeExercise)}
          >
            <Text style={styles.checkIcon}>{includeExercise ? '☑' : '☐'}</Text>
            <Text style={[styles.checkLabel, includeExercise && styles.checkLabelActive]}>
              🏋️ Exercise Report
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkbox, includeDiet && styles.checkboxActive]}
            onPress={() => setIncludeDiet(!includeDiet)}
          >
            <Text style={styles.checkIcon}>{includeDiet ? '☑' : '☐'}</Text>
            <Text style={[styles.checkLabel, includeDiet && styles.checkLabelActive]}>
              🥗 Diet Report
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Timeframe Selection ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Timeframe</Text>
        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map((tf, idx) => (
            <TouchableOpacity
              key={tf.label}
              style={[
                styles.timeframeBtn,
                selectedTimeframe === idx && !showCustomRange && styles.timeframeBtnActive,
              ]}
              onPress={() => {
                setSelectedTimeframe(idx);
                setShowCustomRange(false);
              }}
            >
              <Text
                style={[
                  styles.timeframeBtnText,
                  selectedTimeframe === idx && !showCustomRange && styles.timeframeBtnTextActive,
                ]}
              >
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.customRangeToggle, showCustomRange && styles.customRangeToggleActive]}
          onPress={() => setShowCustomRange(!showCustomRange)}
        >
          <Text style={[styles.customRangeToggleText, showCustomRange && { color: '#fff' }]}>
            📅 Custom Date Range
          </Text>
        </TouchableOpacity>

        {showCustomRange && (
          <View style={styles.dateInputRow}>
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <TextInput
                style={styles.dateInput}
                value={customStart}
                onChangeText={setCustomStart}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.light}
                maxLength={10}
              />
            </View>
            <Text style={styles.dateArrow}>→</Text>
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateLabel}>End Date</Text>
              <TextInput
                style={styles.dateInput}
                value={customEnd}
                onChangeText={setCustomEnd}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.light}
                maxLength={10}
              />
            </View>
          </View>
        )}

        {rangeLabel ? (
          <Text style={styles.rangePreview}>{rangeLabel}</Text>
        ) : null}
      </View>

      {/* ─── Generate Button ─── */}
      <TouchableOpacity
        style={[styles.generateBtn, loading && { opacity: 0.6 }]}
        onPress={handleGenerate}
        disabled={loading}
      >
        <View style={[styles.generateBtnGradient, { backgroundColor: '#111827' }]}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>📄 Generate Report</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* ─── Error ─── */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* ─── Results ─── */}
      {generated && !loading && (exerciseReport || dietReport) && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsTitleRow}>
            <Text style={styles.resultsTitle}>📋 Report Results</Text>
            <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPDF}>
              <Text style={styles.pdfBtnText}>📥 Download PDF</Text>
            </TouchableOpacity>
          </View>

          {exerciseReport && <ExerciseReportTable report={exerciseReport} />}
          {dietReport && <DietReportTable report={dietReport} />}
        </View>
      )}

      {generated && !loading && !exerciseReport && !dietReport && !error && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No data found for the selected period.</Text>
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

export default ReportGeneratorScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backText: { color: '#fff', fontSize: 16, marginBottom: 8 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },

  section: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 12 },

  // Checkboxes
  checkboxRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  checkboxActive: {
    borderColor: '#111827',
    backgroundColor: 'rgba(102,126,234,0.08)',
  },
  checkIcon: { fontSize: 20, marginRight: 8 },
  checkLabel: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  checkLabelActive: { color: '#111827' },

  // Timeframe buttons
  timeframeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  timeframeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  timeframeBtnActive: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  timeframeBtnText: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },
  timeframeBtnTextActive: { color: '#fff' },

  // Custom range
  customRangeToggle: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    alignSelf: 'flex-start',
  },
  customRangeToggleActive: {
    borderColor: '#1F2937',
    backgroundColor: '#1F2937',
  },
  customRangeToggleText: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },

  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  dateInputGroup: { flex: 1 },
  dateLabel: { fontSize: 12, color: colors.text.secondary, marginBottom: 4, fontWeight: '600' },
  dateInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    color: colors.text.primary,
  },
  dateArrow: { fontSize: 18, color: colors.text.light, marginTop: 16 },

  rangePreview: {
    marginTop: 10,
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Generate button
  generateBtn: { marginHorizontal: spacing.md, marginTop: spacing.lg },
  generateBtnGradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // Error
  errorBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: 'rgba(239,71,111,0.08)',
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: 14 },

  // Results
  resultsSection: { marginTop: spacing.lg },
  resultsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  resultsTitle: { fontSize: 20, fontWeight: '700', color: colors.text.primary },
  pdfBtn: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  pdfBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Empty
  emptyBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: { color: colors.text.secondary, fontSize: 15 },
});

