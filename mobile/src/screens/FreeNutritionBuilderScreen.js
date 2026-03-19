import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
  ActivityIndicator, Modal, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import nutritionService from '../services/nutritionService';

const FreeNutritionBuilderScreen = ({ navigation, route }) => {
  const { customMeals: mealSlots = [] } = route.params || {};

  const [planName, setPlanName] = useState('My Custom Diet Plan');
  const [meals, setMeals] = useState(
    mealSlots.map((m, idx) => ({
      id: idx + 1,
      name: m.name,
      mealType: m.type,
      timeOfDay: m.time,
      foodItems: [],
    }))
  );
  const [saving, setSaving] = useState(false);

  // Add food item modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingMealIndex, setEditingMealIndex] = useState(null);
  const [editingFoodIndex, setEditingFoodIndex] = useState(null);
  const [foodForm, setFoodForm] = useState({
    name: '', quantity: '', protein: '', carbs: '', fat: '', calories: '',
  });

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const openAddFoodModal = (mealIndex) => {
    setEditingMealIndex(mealIndex);
    setEditingFoodIndex(null);
    setFoodForm({ name: '', quantity: '', protein: '', carbs: '', fat: '', calories: '' });
    setAddModalVisible(true);
  };

  const openEditFoodModal = (mealIndex, foodIndex) => {
    const food = meals[mealIndex].foodItems[foodIndex];
    setEditingMealIndex(mealIndex);
    setEditingFoodIndex(foodIndex);
    setFoodForm({
      name: food.name || '',
      quantity: food.quantity || '',
      protein: String(food.proteinGrams || ''),
      carbs: String(food.carbsGrams || ''),
      fat: String(food.fatGrams || ''),
      calories: String(food.calories || ''),
    });
    setAddModalVisible(true);
  };

  const handleSaveFood = () => {
    if (!foodForm.name.trim()) {
      showAlert('Required', 'Please enter food item name');
      return;
    }

    const protein = parseFloat(foodForm.protein) || 0;
    const carbs = parseFloat(foodForm.carbs) || 0;
    const fat = parseFloat(foodForm.fat) || 0;
    let calories = parseInt(foodForm.calories) || 0;

    // Auto-calculate calories if not provided
    if (calories === 0 && (protein > 0 || carbs > 0 || fat > 0)) {
      calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
    }

    const foodItem = {
      name: foodForm.name.trim(),
      quantity: foodForm.quantity.trim() || '1 serving',
      proteinGrams: protein,
      carbsGrams: carbs,
      fatGrams: fat,
      calories,
    };

    setMeals(prev => {
      const updated = [...prev];
      if (editingFoodIndex !== null) {
        updated[editingMealIndex].foodItems[editingFoodIndex] = foodItem;
      } else {
        updated[editingMealIndex].foodItems.push(foodItem);
      }
      return updated;
    });

    setAddModalVisible(false);
  };

  const removeFood = (mealIndex, foodIndex) => {
    setMeals(prev => {
      const updated = [...prev];
      updated[mealIndex].foodItems.splice(foodIndex, 1);
      return updated;
    });
  };

  const calculateMealTotals = (foodItems) => {
    if (!foodItems || foodItems.length === 0) {
      return { protein: 0, carbs: 0, fat: 0, calories: 0 };
    }
    return foodItems.reduce((acc, item) => ({
      protein: acc.protein + (item.proteinGrams || 0),
      carbs: acc.carbs + (item.carbsGrams || 0),
      fat: acc.fat + (item.fatGrams || 0),
      calories: acc.calories + (item.calories || 0),
    }), { protein: 0, carbs: 0, fat: 0, calories: 0 });
  };

  const calculateDailyTotals = () => {
    return meals.reduce((acc, meal) => {
      const mealTotals = calculateMealTotals(meal.foodItems);
      return {
        protein: acc.protein + mealTotals.protein,
        carbs: acc.carbs + mealTotals.carbs,
        fat: acc.fat + mealTotals.fat,
        calories: acc.calories + mealTotals.calories,
      };
    }, { protein: 0, carbs: 0, fat: 0, calories: 0 });
  };

  const getMealTypeIcon = (mealType) => {
    const icons = {
      'BREAKFAST': '🌅', 'MORNING_SNACK': '🍎', 'LUNCH': '☀️',
      'AFTERNOON_SNACK': '🥜', 'EVENING_SNACK': '🍌', 'DINNER': '🌙',
      'LATE_SNACK': '🌜', 'PRE_WORKOUT': '⚡', 'POST_WORKOUT': '💪', 'SNACK': '🍎',
    };
    return icons[mealType] || '🍽️';
  };

  const handleStartPlan = async () => {
    // Validate: at least one food item in at least one meal
    const hasFoodItems = meals.some(m => m.foodItems.length > 0);
    if (!hasFoodItems) {
      showAlert('Add Food Items', 'Please add at least one food item to any meal');
      return;
    }

    setSaving(true);
    try {
      const dailyTotals = calculateDailyTotals();
      const request = {
        planName: planName.trim() || 'My Custom Diet Plan',
        totalCalories: dailyTotals.calories,
        proteinGrams: dailyTotals.protein,
        carbsGrams: dailyTotals.carbs,
        fatGrams: dailyTotals.fat,
        meals: meals.map(m => ({
          name: m.name,
          mealType: m.mealType,
          timeOfDay: m.timeOfDay,
          foodItems: m.foodItems.map(f => ({
            name: f.name,
            quantity: f.quantity,
            calories: f.calories,
            proteinGrams: f.proteinGrams,
            carbsGrams: f.carbsGrams,
            fatGrams: f.fatGrams,
          })),
        })),
      };

      await nutritionService.saveFreePlan(request);
      showAlert('Plan Activated! 🎉', 'Your custom nutrition plan is now active!');
      navigation.reset({
        index: 0,
        routes: [
          { name: 'MainTabs' },
          { name: 'MyNutritionPlan' },
        ],
      });
    } catch (err) {
      console.error('Error saving free plan:', err);
      showAlert('Error', err.response?.data?.message || 'Failed to save your plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderMacroCircle = (value, label, color) => (
    <View style={styles.macroItem}>
      <View style={[styles.macroCircle, { borderColor: color }]}>
        <Text style={[styles.macroValue, { color }]}>{Math.round(value || 0)}g</Text>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );

  const renderFoodItem = (food, mealIndex, foodIndex) => (
    <View key={foodIndex} style={styles.foodItem}>
      <TouchableOpacity style={styles.foodMain} onPress={() => openEditFoodModal(mealIndex, foodIndex)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodQuantity}>{food.quantity}</Text>
        </View>
        <Text style={styles.editIcon}>✏️</Text>
      </TouchableOpacity>
      <View style={styles.foodMacros}>
        <View style={styles.macroTag}>
          <Text style={styles.macroTagText}>P: {Math.round(food.proteinGrams || 0)}g</Text>
        </View>
        <View style={[styles.macroTag, styles.macroTagCarbs]}>
          <Text style={styles.macroTagText}>C: {Math.round(food.carbsGrams || 0)}g</Text>
        </View>
        <View style={[styles.macroTag, styles.macroTagFat]}>
          <Text style={styles.macroTagText}>F: {Math.round(food.fatGrams || 0)}g</Text>
        </View>
        <View style={[styles.macroTag, styles.macroTagCal]}>
          <Text style={styles.macroTagText}>{food.calories || 0} cal</Text>
        </View>
        <TouchableOpacity onPress={() => removeFood(mealIndex, foodIndex)} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMeal = (meal, mealIndex) => {
    const mealTotals = calculateMealTotals(meal.foodItems);

    return (
      <View key={meal.id} style={styles.mealCard}>
        {/* Meal Header */}
        <View style={styles.mealHeader}>
          <Text style={styles.mealIcon}>{getMealTypeIcon(meal.mealType)}</Text>
          <View style={styles.mealInfo}>
            <Text style={styles.mealType}>
              {meal.mealType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
            </Text>
            <Text style={styles.mealTime}>🕐 {meal.timeOfDay}</Text>
          </View>
          <View style={styles.mealCalories}>
            <Text style={styles.calorieValue}>{mealTotals.calories}</Text>
            <Text style={styles.calorieLabel}>cal</Text>
          </View>
        </View>

        <Text style={styles.mealName}>{meal.name}</Text>

        {/* Food Items */}
        {meal.foodItems.length > 0 && (
          <View style={styles.foodItemsContainer}>
            {meal.foodItems.map((food, foodIndex) => renderFoodItem(food, mealIndex, foodIndex))}
          </View>
        )}

        {/* Meal Total Macros */}
        {meal.foodItems.length > 0 && (
          <View style={styles.mealTotalsContainer}>
            <Text style={styles.mealTotalsTitle}>Meal Total</Text>
            <View style={styles.mealTotalsRow}>
              <View style={styles.mealTotalItem}>
                <Text style={[styles.mealTotalValue, { color: '#FF6B6B' }]}>{Math.round(mealTotals.protein)}g</Text>
                <Text style={styles.mealTotalLabel}>Protein</Text>
              </View>
              <View style={styles.mealTotalItem}>
                <Text style={[styles.mealTotalValue, { color: '#4ECDC4' }]}>{Math.round(mealTotals.carbs)}g</Text>
                <Text style={styles.mealTotalLabel}>Carbs</Text>
              </View>
              <View style={styles.mealTotalItem}>
                <Text style={[styles.mealTotalValue, { color: '#FFE66D' }]}>{Math.round(mealTotals.fat)}g</Text>
                <Text style={styles.mealTotalLabel}>Fat</Text>
              </View>
              <View style={styles.mealTotalItem}>
                <Text style={[styles.mealTotalValue, { color: colors.primary }]}>{Math.round(mealTotals.calories)}</Text>
                <Text style={styles.mealTotalLabel}>Cal</Text>
              </View>
            </View>
          </View>
        )}

        {/* Add Food Item Button */}
        <TouchableOpacity style={styles.addFoodBtn} onPress={() => openAddFoodModal(mealIndex)}>
          <Text style={styles.addFoodBtnText}>➕ Add Food Item</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const dailyTotals = calculateDailyTotals();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Plan</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plan Name */}
        <View style={styles.planNameContainer}>
          <Text style={styles.planNameLabel}>Plan Name</Text>
          <TextInput
            style={styles.planNameInput}
            value={planName}
            onChangeText={setPlanName}
            placeholder="Enter plan name"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        {/* Daily Macros Summary */}
        <View style={styles.macrosContainer}>
          <Text style={styles.macrosTitle}>Daily Macros Target</Text>
          <View style={styles.macrosRow}>
            {renderMacroCircle(dailyTotals.protein, 'Protein', '#FF6B6B')}
            {renderMacroCircle(dailyTotals.carbs, 'Carbs', '#4ECDC4')}
            {renderMacroCircle(dailyTotals.fat, 'Fat', '#FFE66D')}
          </View>
          <View style={styles.totalCaloriesContainer}>
            <Text style={styles.totalCaloriesLabel}>Total Calories</Text>
            <Text style={styles.totalCaloriesValue}>{dailyTotals.calories}</Text>
          </View>
        </View>

        {/* Meals */}
        <Text style={styles.sectionTitle}>Your Meals</Text>
        {meals.map((meal, idx) => renderMeal(meal, idx))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, saving && styles.startButtonDisabled]}
          onPress={handleStartPlan}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.startButtonText}>🚀 Start This Plan</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Add/Edit Food Item Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingFoodIndex !== null ? '✏️ Edit Food Item' : '➕ Add Food Item'}
            </Text>
            {editingMealIndex !== null && (
              <Text style={styles.modalSubtitle}>
                For {meals[editingMealIndex]?.name} ({meals[editingMealIndex]?.timeOfDay})
              </Text>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Food Name *</Text>
              <TextInput
                style={styles.formInput}
                value={foodForm.name}
                onChangeText={(t) => setFoodForm(p => ({ ...p, name: t }))}
                placeholder="e.g., Grilled Chicken Breast"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Quantity</Text>
              <TextInput
                style={styles.formInput}
                value={foodForm.quantity}
                onChangeText={(t) => setFoodForm(p => ({ ...p, quantity: t }))}
                placeholder="e.g., 150g, 1 cup, 2 pieces"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.macroInputRow}>
              <View style={styles.macroInputGroup}>
                <Text style={[styles.formLabel, { color: '#FF6B6B' }]}>Protein (g)</Text>
                <TextInput
                  style={[styles.formInput, styles.macroInput]}
                  value={foodForm.protein}
                  onChangeText={(t) => setFoodForm(p => ({ ...p, protein: t }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={styles.macroInputGroup}>
                <Text style={[styles.formLabel, { color: '#4ECDC4' }]}>Carbs (g)</Text>
                <TextInput
                  style={[styles.formInput, styles.macroInput]}
                  value={foodForm.carbs}
                  onChangeText={(t) => setFoodForm(p => ({ ...p, carbs: t }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>

            <View style={styles.macroInputRow}>
              <View style={styles.macroInputGroup}>
                <Text style={[styles.formLabel, { color: '#FFE66D' }]}>Fat (g)</Text>
                <TextInput
                  style={[styles.formInput, styles.macroInput]}
                  value={foodForm.fat}
                  onChangeText={(t) => setFoodForm(p => ({ ...p, fat: t }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={styles.macroInputGroup}>
                <Text style={[styles.formLabel, { color: colors.primary }]}>Calories</Text>
                <TextInput
                  style={[styles.formInput, styles.macroInput]}
                  value={foodForm.calories}
                  onChangeText={(t) => setFoodForm(p => ({ ...p, calories: t }))}
                  keyboardType="numeric"
                  placeholder="Auto"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>

            <Text style={styles.autoCalcNote}>
              💡 Leave calories empty to auto-calculate from macros (P×4 + C×4 + F×9)
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveFood}>
                <Text style={styles.modalSaveText}>
                  {editingFoodIndex !== null ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary, padding: spacing.md, paddingTop: spacing.xxl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backButton: { padding: spacing.xs },
  backButtonText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  content: { flex: 1, padding: spacing.md },

  planNameContainer: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.md, ...shadows.sm,
  },
  planNameLabel: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.xs },
  planNameInput: {
    ...typography.h3, color: colors.text.primary, borderBottomWidth: 1,
    borderBottomColor: colors.border, paddingBottom: spacing.xs,
  },

  macrosContainer: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.md, ...shadows.sm,
  },
  macrosTitle: { ...typography.h4, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.md },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  macroItem: { alignItems: 'center' },
  macroCircle: {
    width: 70, height: 70, borderRadius: 35, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background,
  },
  macroValue: { ...typography.bodySmall, fontWeight: '700' },
  macroLabel: { ...typography.caption, color: colors.text.secondary, marginTop: 4 },
  totalCaloriesContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  totalCaloriesLabel: { ...typography.body, color: colors.text.secondary, marginRight: spacing.sm },
  totalCaloriesValue: { ...typography.h3, color: colors.primary, fontWeight: '700' },

  sectionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md, marginTop: spacing.sm },

  mealCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.md, ...shadows.sm,
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  mealIcon: { fontSize: 28, marginRight: spacing.sm },
  mealInfo: { flex: 1 },
  mealType: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  mealTime: { ...typography.caption, color: colors.text.secondary },
  mealCalories: { alignItems: 'center' },
  calorieValue: { ...typography.h3, color: colors.primary, fontWeight: '700' },
  calorieLabel: { ...typography.caption, color: colors.text.secondary },
  mealName: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.sm },

  foodItemsContainer: { marginTop: spacing.sm },
  foodItem: {
    borderBottomWidth: 1, borderBottomColor: colors.border + '50',
    paddingVertical: spacing.sm,
  },
  foodMain: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  foodName: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  foodQuantity: { ...typography.caption, color: colors.text.secondary },
  editIcon: { fontSize: 14, marginLeft: spacing.sm },
  foodMacros: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  macroTag: {
    backgroundColor: '#FF6B6B20', borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs, paddingVertical: 2,
  },
  macroTagCarbs: { backgroundColor: '#4ECDC420' },
  macroTagFat: { backgroundColor: '#FFE66D20' },
  macroTagCal: { backgroundColor: colors.primary + '20' },
  macroTagText: { ...typography.caption, fontWeight: '600', color: colors.text.primary },
  removeBtn: {
    marginLeft: 'auto', backgroundColor: '#FF6B6B20', borderRadius: 12,
    width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
  },
  removeBtnText: { color: '#FF6B6B', fontWeight: '700', fontSize: 12 },

  mealTotalsContainer: {
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border + '50',
  },
  mealTotalsTitle: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.xs },
  mealTotalsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  mealTotalItem: { alignItems: 'center' },
  mealTotalValue: { ...typography.bodySmall, fontWeight: '700' },
  mealTotalLabel: { ...typography.caption, color: colors.text.secondary },

  addFoodBtn: {
    marginTop: spacing.sm, borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center',
    borderStyle: 'dashed',
  },
  addFoodBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },

  footer: {
    padding: spacing.md, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  startButton: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center',
  },
  startButtonDisabled: { opacity: 0.6 },
  startButtonText: { ...typography.body, color: colors.text.inverse, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl, padding: spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.md },
  formGroup: { marginBottom: spacing.md },
  formLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  formInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.sm, ...typography.body, color: colors.text.primary,
    backgroundColor: colors.background,
  },
  macroInputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  macroInputGroup: { flex: 1 },
  macroInput: { textAlign: 'center' },
  autoCalcNote: {
    ...typography.caption, color: colors.text.secondary,
    textAlign: 'center', marginBottom: spacing.md,
  },
  modalButtons: { flexDirection: 'row', gap: spacing.sm },
  modalCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center',
  },
  modalCancelText: { ...typography.body, color: colors.text.secondary },
  modalSaveBtn: {
    flex: 1, backgroundColor: colors.primary,
    borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center',
  },
  modalSaveText: { ...typography.body, color: colors.text.inverse, fontWeight: '700' },
});

export default FreeNutritionBuilderScreen;

