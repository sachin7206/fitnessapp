import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import nutritionService from '../services/nutritionService';

const FoodPhotoLogScreen = ({ navigation }) => {
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('LUNCH');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

  const logFood = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the food you ate');
      return;
    }
    setLoading(true);
    try {
      const response = await nutritionService.logFoodPhoto({
        description: description.trim(),
        mealType,
        source: 'MANUAL',
      });
      setResult(response);
      Alert.alert('Success', `Food logged! ${response.totalCalories} calories estimated.`);
      setDescription('');
    } catch (error) {
      Alert.alert('Error', 'Failed to log food. Please try again.');
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
          style={styles.input}
          placeholder="e.g., 2 rotis with dal and rice, 1 banana..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.text.secondary}
        />
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
  header: { padding: spacing.lg, paddingTop: 50, backgroundColor: colors.primary },
  backBtn: { marginBottom: spacing.sm },
  backText: { color: '#fff', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  section: { padding: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.sm },
  mealTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealTypeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  mealTypeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  mealTypeText: { fontSize: 12, color: colors.text.secondary },
  mealTypeTextActive: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: borderRadius.md, padding: spacing.md, fontSize: 15, color: colors.text.primary, backgroundColor: '#fff', minHeight: 80, textAlignVertical: 'top' },
  logBtn: { marginHorizontal: spacing.lg, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' },
  logBtnDisabled: { opacity: 0.6 },
  logBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultCard: { margin: spacing.lg, backgroundColor: '#fff', borderRadius: borderRadius.md, padding: spacing.lg, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  resultTitle: { fontSize: 18, fontWeight: '600', marginBottom: spacing.md },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  macroLabel: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  foodItemsList: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: '#eee' },
  foodItem: { fontSize: 14, color: colors.text.secondary, marginBottom: 4 },
  viewLogsBtn: { marginHorizontal: spacing.lg, marginTop: spacing.md, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary, alignItems: 'center' },
  viewLogsBtnText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  logsSection: { padding: spacing.lg },
  logsSummary: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: spacing.md },
  logCard: { backgroundColor: '#fff', borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.sm, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  logMealType: { fontSize: 13, fontWeight: '600', color: colors.primary },
  logCalories: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  logDescription: { fontSize: 13, color: colors.text.secondary, marginTop: 4 },
  emptyText: { textAlign: 'center', color: colors.text.secondary, fontStyle: 'italic' },
});

export default FoodPhotoLogScreen;

