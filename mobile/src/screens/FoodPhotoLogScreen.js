import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import nutritionService from '../services/nutritionService';

const FoodPhotoLogScreen = ({ navigation }) => {
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('LUNCH');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [descError, setDescError] = useState('');
  const [descTouched, setDescTouched] = useState(false);

  const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const validateDescription = (val) => {
    if (!val || !val.trim()) return 'Please describe the food you ate';
    if (val.trim().length > 1000) return 'Description must be ≤ 1000 characters';
    return '';
  };

  const handleDescChange = (val) => {
    setDescription(val);
    if (descTouched) {
      setDescError(validateDescription(val));
    }
  };

  const handleDescBlur = () => {
    setDescTouched(true);
    setDescError(validateDescription(description));
  };

  const logFood = async () => {
    setDescTouched(true);
    const err = validateDescription(description);
    setDescError(err);
    if (err) return;

    setLoading(true);
    try {
      const response = await nutritionService.logFoodPhoto({
        description: description.trim(),
        mealType,
        source: 'MANUAL',
      });
      setResult(response);
      showAlert('Success', `Food logged! ${response.totalCalories} calories estimated.`);
      setDescription('');
      setDescError('');
      setDescTouched(false);
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to log food. Please try again.');
    }
    setLoading(false);
  };

  const loadTodayLogs = async () => {
    try {
      const logs = await nutritionService.getTodayFoodLogs();
      setTodayLogs(logs || []);
      setShowLogs(true);
    } catch (error) {
      setTodayLogs([]);
      setShowLogs(true);
    }
  };

  const totalCals = todayLogs.reduce((sum, l) => sum + (l.totalCalories || 0), 0);
  const totalProtein = todayLogs.reduce((sum, l) => sum + (l.totalProtein || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📸 Food Photo Log</Text>
        <Text style={styles.subtitle}>Log what you eat and track calories</Text>
      </View>

      {/* Meal Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Type</Text>
        <View style={styles.mealTypeRow}>
          {mealTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.mealTypeBtn, mealType === type && styles.mealTypeBtnActive]}
              onPress={() => setMealType(type)}
            >
              <Text style={[styles.mealTypeText, mealType === type && styles.mealTypeTextActive]}>
                {type === 'BREAKFAST' ? '🌅' : type === 'LUNCH' ? '☀️' : type === 'DINNER' ? '🌙' : '🍎'} {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Food Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What did you eat?</Text>
        <TextInput
          style={[styles.input, descTouched && descError ? styles.inputError : null]}
          placeholder="e.g., 2 rotis with dal and rice, 1 banana..."
          value={description}
          onChangeText={handleDescChange}
          onBlur={handleDescBlur}
          multiline
          numberOfLines={3}
          maxLength={1000}
          placeholderTextColor={colors.text.secondary}
        />
        {descTouched && descError ? (
          <Text style={styles.fieldError}>{descError}</Text>
        ) : null}
        <Text style={styles.charCount}>{description.length}/1000</Text>
      </View>

      {/* Log Button */}
      <TouchableOpacity
        style={[styles.logBtn, loading && styles.logBtnDisabled]}
        onPress={logFood}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.logBtnText}>🤖 Analyze & Log Food</Text>
        )}
      </TouchableOpacity>

      {/* Result */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>📊 Analysis Result</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{result.totalCalories}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{(result.totalProtein || 0).toFixed(1)}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{(result.totalCarbs || 0).toFixed(1)}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{(result.totalFat || 0).toFixed(1)}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
          {result.foodItems && result.foodItems.length > 0 && (
            <View style={styles.foodItemsList}>
              {result.foodItems.map((item, idx) => (
                <Text key={idx} style={styles.foodItem}>
                  • {item.name} ({item.quantity}) - {item.calories} cal
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Today's Logs */}
      <TouchableOpacity style={styles.viewLogsBtn} onPress={loadTodayLogs}>
        <Text style={styles.viewLogsBtnText}>📋 View Today's Food Logs</Text>
      </TouchableOpacity>

      {showLogs && (
        <View style={styles.logsSection}>
          <Text style={styles.logsSummary}>
            Today: {totalCals} cal | {totalProtein.toFixed(1)}g protein | {todayLogs.length} entries
          </Text>
          {todayLogs.map((log, idx) => (
            <View key={idx} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logMealType}>{log.mealType}</Text>
                <Text style={styles.logCalories}>{log.totalCalories} cal</Text>
              </View>
              <Text style={styles.logDescription}>{log.description}</Text>
            </View>
          ))}
          {todayLogs.length === 0 && (
            <Text style={styles.emptyText}>No food logged today yet</Text>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg, backgroundColor: colors.primary, flexDirection: 'row', flexWrap: 'wrap' },
  backBtn: { marginBottom: spacing.sm, width: '100%' },
  backText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text.inverse, width: '100%' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, width: '100%' },
  section: { padding: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm },
  mealTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealTypeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  mealTypeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  mealTypeText: { fontSize: 12, color: colors.text.secondary },
  mealTypeTextActive: { color: colors.text.inverse, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.md, fontSize: 15, color: colors.text.primary, backgroundColor: colors.surface, minHeight: 80, textAlignVertical: 'top' },
  inputError: { borderColor: colors.primary, borderWidth: 1.5 },
  fieldError: { color: colors.primary, fontSize: 12, marginTop: 4, fontWeight: '500' },
  charCount: { color: colors.text.secondary, fontSize: 11, textAlign: 'right', marginTop: 2 },
  logBtn: { marginHorizontal: spacing.lg, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center', ...shadows.md },
  logBtnDisabled: { opacity: 0.6 },
  logBtnText: { color: colors.text.inverse, fontSize: 16, fontWeight: '600' },
  resultCard: { margin: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.sm },
  resultTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.md, color: colors.text.primary },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  macroLabel: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  foodItemsList: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  foodItem: { fontSize: 14, color: colors.text.secondary, marginBottom: 4 },
  viewLogsBtn: { marginHorizontal: spacing.lg, marginTop: spacing.md, paddingVertical: 12, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.primary, alignItems: 'center' },
  viewLogsBtnText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  logsSection: { padding: spacing.lg },
  logsSummary: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: spacing.md },
  logCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  logMealType: { fontSize: 13, fontWeight: '600', color: colors.primary },
  logCalories: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  logDescription: { fontSize: 13, color: colors.text.secondary, marginTop: 4 },
  emptyText: { textAlign: 'center', color: colors.text.secondary, fontStyle: 'italic' },
});

export default FoodPhotoLogScreen;

