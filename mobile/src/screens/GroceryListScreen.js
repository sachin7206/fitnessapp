import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import nutritionService from '../services/nutritionService';

const GroceryListScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [groceryList, setGroceryList] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    loadGroceryList();
  }, []);

  const loadGroceryList = async () => {
    setLoading(true);
    try {
      const data = await nutritionService.getGroceryList(1);
      setGroceryList(data);
    } catch (error) {
      Alert.alert('Info', 'Generate a nutrition plan first to get a grocery list');
    }
    setLoading(false);
  };

  const toggleItem = (categoryIdx, itemIdx) => {
    const key = `${categoryIdx}-${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = groceryList?.categories?.reduce((sum, cat) =>
    sum + (cat.items?.length || 0), 0) || 0;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generating grocery list...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛒 Grocery List</Text>
        {groceryList?.planName && (
          <Text style={styles.subtitle}>For: {groceryList.planName.replace(/_/g, ' ')}</Text>
        )}
      </View>

      {/* Progress */}
      <View style={styles.progressCard}>
        <Text style={styles.progressText}>
          ✅ {checkedCount} / {totalItems} items
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }]} />
        </View>
      </View>

      {/* Categories */}
      {groceryList?.categories?.map((category, catIdx) => (
        <View key={catIdx} style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>{category.categoryName}</Text>
          {category.items?.map((item, itemIdx) => {
            const isChecked = checkedItems[`${catIdx}-${itemIdx}`];
            return (
              <TouchableOpacity
                key={itemIdx}
                style={[styles.itemRow, isChecked && styles.itemRowChecked]}
                onPress={() => toggleItem(catIdx, itemIdx)}
              >
                <Text style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked ? '☑️' : '⬜'}
                </Text>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemQuantity}>
                    {item.quantity} {item.unit}
                    {item.isOptional && ' (optional)'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {(!groceryList || !groceryList.categories || groceryList.categories.length === 0) && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🛒</Text>
          <Text style={styles.emptyTitle}>No Grocery List</Text>
          <Text style={styles.emptySubtitle}>Generate a nutrition plan first, then your grocery list will appear here</Text>
        </View>
      )}

      {groceryList?.fromAi === false && (
        <Text style={styles.aiNote}>📝 Basic list generated. AI-powered list available when Gemini is active.</Text>
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
  title: { ...typography.h2, color: colors.text.inverse, width: '100%' },
  subtitle: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: 4, width: '100%' },
  progressCard: { margin: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.sm },
  progressText: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm, color: colors.text.primary },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: 4 },
  categoryCard: { margin: spacing.lg, marginTop: 0, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.sm },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  itemRowChecked: { opacity: 0.6 },
  checkbox: { fontSize: 20, marginRight: spacing.sm },
  checkboxChecked: {},
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, color: colors.text.primary },
  itemNameChecked: { textDecorationLine: 'line-through', color: colors.text.secondary },
  itemQuantity: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: spacing.md, color: colors.text.primary },
  emptySubtitle: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', marginTop: 4 },
  aiNote: { textAlign: 'center', padding: spacing.md, color: colors.text.secondary, fontSize: 12, fontStyle: 'italic' },
});

export default GroceryListScreen;

