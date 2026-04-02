import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Platform, TextInput, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import { fetchExerciseReport, fetchDietReport, clearReports } from '../store/slices/reportSlice';
import ExerciseReportTable from './components/ExerciseReportTable';
import DietReportTable from './components/DietReportTable';
import { generateReportPDF } from '../utils/reportPdfGenerator';
import { useTranslation } from '../i18n';

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Check if a YYYY-MM-DD string represents a real calendar date */
const isValidDate = (str) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

/** Sanitize date input — allow only digits and hyphens */
const sanitizeDateInput = (val) => val.replace(/[^0-9-]/g, '').substring(0, 10);

const MAX_RANGE_DAYS = 365;

const ReportGeneratorScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { exerciseReport, dietReport, loading, error } = useSelector((state) => state.report);

  const TIMEFRAMES = [
    { label: t('reports.lastWeekShort'), days: 7 },
    { label: t('reports.last1Month'), days: 30 },
    { label: t('reports.last3MonthsShort'), days: 90 },
  ];

  const [includeExercise, setIncludeExercise] = useState(true);
  const [includeDiet, setIncludeDiet] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(null);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [generated, setGenerated] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
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
    const showError = (title, msg) => Platform.OS === 'web' ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

    if (!includeExercise && !includeDiet) {
      showError(t('reports.selectReport'), t('reports.selectReportMsg'));
      return;
    }
    const range = getDateRange();
    if (!range) {
      showError(t('reports.selectTimeframe'), t('reports.selectTimeframeMsg'));
      return;
    }

    // Validate date format and real calendar dates
    if (!isValidDate(range.startDate) || !isValidDate(range.endDate)) {
      showError(t('reports.invalidDate'), t('reports.invalidDateMsg'));
      return;
    }

    // Start must be before or equal to end
    if (range.startDate > range.endDate) {
      showError(t('reports.invalidRange'), t('reports.invalidRangeMsg'));
      return;
    }

    // No future dates allowed — end date can be at most today
    const today = formatDate(new Date());
    if (range.endDate > today) {
      showError(t('reports.invalidDate'), t('reports.futureDateMsg'));
      return;
    }

    // Max range: 1 year
    const startMs = new Date(range.startDate + 'T00:00:00').getTime();
    const endMs = new Date(range.endDate + 'T00:00:00').getTime();
    const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
    if (diffDays > MAX_RANGE_DAYS) {
      showError(t('reports.rangeTooLarge'), `${MAX_RANGE_DAYS} days max. You selected ${diffDays} days.`);
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
    if (!exerciseReport && !dietReport) {
      const msg = t('reports.noDataMsg');
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert(t('reports.noData'), msg);
      return;
    }
    setPdfLoading(true);
    try {
      await generateReportPDF(exerciseReport, dietReport);
    } catch (e) {
      const msg = t('reports.pdfError') + ': ' + (e.message || '');
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert(t('reports.pdfError'), msg);
    } finally {
      setPdfLoading(false);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 {t('reports.title')}</Text>
        <Text style={styles.subtitle}>{t('reports.createCustomReports')}</Text>
      </View>

      {/* ─── Report Type Selection ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.selectReportTypes')}</Text>
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={[styles.checkbox, includeExercise && styles.checkboxActive]}
            onPress={() => setIncludeExercise(!includeExercise)}
          >
            <Text style={styles.checkIcon}>{includeExercise ? '☑' : '☐'}</Text>
            <Text style={[styles.checkLabel, includeExercise && styles.checkLabelActive]}>
              🏋️ {t('reports.exerciseReport')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkbox, includeDiet && styles.checkboxActive]}
            onPress={() => setIncludeDiet(!includeDiet)}
          >
            <Text style={styles.checkIcon}>{includeDiet ? '☑' : '☐'}</Text>
            <Text style={[styles.checkLabel, includeDiet && styles.checkLabelActive]}>
              🥗 {t('reports.dietReport')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Timeframe Selection ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.selectTimeframe')}</Text>
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
            📅 {t('reports.customRange')}
          </Text>
        </TouchableOpacity>

        {showCustomRange && (
          <View style={styles.dateInputRow}>
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateLabel}>{t('reports.startDate')}</Text>
              <TextInput
                style={styles.dateInput}
                value={customStart}
                onChangeText={(v) => setCustomStart(sanitizeDateInput(v))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.light}
                maxLength={10}
              />
            </View>
            <Text style={styles.dateArrow}>→</Text>
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateLabel}>{t('reports.endDate')}</Text>
              <TextInput
                style={styles.dateInput}
                value={customEnd}
                onChangeText={(v) => setCustomEnd(sanitizeDateInput(v))}
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
          <View style={styles.generateBtnGradient}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>📄 {t('reports.generateReport')}</Text>
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
            <Text style={styles.resultsTitle}>📋 {t('reports.reportReady')}</Text>
            <TouchableOpacity style={[styles.pdfBtn, pdfLoading && { opacity: 0.6 }]} onPress={handleDownloadPDF} disabled={pdfLoading}>
              <Text style={styles.pdfBtnText}>{pdfLoading ? '⏳ ...' : `📥 ${t('reports.downloadPdf')}`}</Text>
            </TouchableOpacity>
          </View>

          {exerciseReport && <ExerciseReportTable report={exerciseReport} />}
          {dietReport && <DietReportTable report={dietReport} />}
        </View>
      )}

      {generated && !loading && !exerciseReport && !dietReport && !error && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t('reports.noDataMsg')}</Text>
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
    backgroundColor: colors.primary,
  },
  backText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  title: { color: colors.text.inverse, fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },

  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 12 },

  // Checkboxes
  checkboxRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  checkboxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  checkIcon: { fontSize: 20, marginRight: 8 },
  checkLabel: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  checkLabelActive: { color: colors.primary },

  // Timeframe buttons
  timeframeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  timeframeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  timeframeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  timeframeBtnText: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },
  timeframeBtnTextActive: { color: colors.text.inverse },

  // Custom range
  customRangeToggle: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignSelf: 'flex-start',
  },
  customRangeToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
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
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: colors.background,
    color: colors.text.primary,
  },
  dateArrow: { fontSize: 18, color: colors.text.light, marginTop: 16 },

  rangePreview: {
    marginTop: 10,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Generate button
  generateBtn: { marginHorizontal: spacing.md, marginTop: spacing.lg },
  generateBtnGradient: {
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  generateBtnText: { color: colors.text.inverse, fontSize: 17, fontWeight: '700' },

  // Error
  errorBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.lg,
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
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
  },
  pdfBtnText: { color: colors.text.inverse, fontSize: 13, fontWeight: '600' },

  // Empty
  emptyBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: { color: colors.text.secondary, fontSize: 15 },
});

