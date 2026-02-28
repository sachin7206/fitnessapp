import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import nutritionService from '../services/nutritionService';

const FoodPreferencesScreen = ({ navigation, route }) => {
  const { user } = useSelector((state) => state.auth);
  const { region } = route.params || {};

  const dietType = user?.healthMetrics?.dietaryPreferences?.[0] || 'VEGETARIAN';
  const isNonVeg = dietType === 'NON_VEGETARIAN';
  const isEggetarian = dietType === 'EGGETARIAN';
  const isVegan = dietType === 'VEGAN';
  const isJain = dietType === 'JAIN';

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingMealIndex, setEditingMealIndex] = useState(null);
  const [editingWorkoutMeal, setEditingWorkoutMeal] = useState(null); // 'pre' or 'post'
  const [showCustomInput, setShowCustomInput] = useState(null); // 'protein', 'carbs', 'dairy', 'salad'
  const [customItemName, setCustomItemName] = useState('');

  // Food preferences with expanded options
  const [preferences, setPreferences] = useState({
    // Protein sources
    includeChicken: isNonVeg,
    includeFish: isNonVeg,
    includeRedMeat: false,
    includePrawns: false,
    includeTurkey: false,
    includeSoyaChunks: true,
    includeTofu: isVegan,
    includeLegumes: true,
    includeNuts: true,
    eggsPerDay: isEggetarian || isNonVeg ? 2 : 0,
    customProteins: [],
    // Carb sources
    includeRice: !isJain,
    includeRoti: true,
    includeDal: true,
    includeOats: true,
    includeQuinoa: false,
    includePoha: true,
    includeUpma: true,
    includeBread: false,
    includePasta: false,
    includeSweet_potato: true,
    includeRegular_potato: true,
    customCarbs: [],
    // Dairy products
    includeMilk: !isVegan,
    includePaneer: !isVegan,
    includeCurd: !isVegan,
    includeCheese: !isVegan,
    includeButtermilk: !isVegan,
    includeGhee: !isVegan,
    includeGreekYogurt: !isVegan,
    includeCottageCheese: !isVegan,
    customDairy: [],
    // Salads & Vegetables
    includeCucumber: true,
    includeTomato: true,
    includeCarrot: true,
    includeOnion: !isJain,
    includeBeetroot: true,
    includeSpinach: true,
    includeLettuce: true,
    includeCabbage: true,
    includeBellPepper: true,
    includeBroccoli: true,
    customSalads: [],
    // Other preferences
    allergies: [],
    dislikedFoods: [],
    cookingOilPreference: 'MUSTARD',
    preferHomemade: true,
  });

  // Custom meals with time preferences
  const [customMeals, setCustomMeals] = useState([
    { id: 1, name: 'Breakfast', type: 'BREAKFAST', time: '8:00 AM', enabled: true },
    { id: 2, name: 'Lunch', type: 'LUNCH', time: '1:00 PM', enabled: true },
    { id: 3, name: 'Dinner', type: 'DINNER', time: '8:00 PM', enabled: true },
  ]);

  // Workout meals
  const [workoutMeals, setWorkoutMeals] = useState({
    includePreWorkout: false,
    preWorkoutTime: '5:00 PM',
    includePostWorkout: false,
    postWorkoutTime: '7:00 PM',
  });

  // Supplements
  const [supplements, setSupplements] = useState({
    canTakeWheyProtein: false,
    otherSupplements: [],
  });

  const steps = [
    { title: 'Food Items', icon: '🍽️' },
    { title: 'Meals & Time', icon: '⏰' },
    { title: 'Supplements', icon: '💪' },
  ];

  const availableMealTypes = [
    { type: 'BREAKFAST', name: 'Breakfast', icon: '🌅', defaultTime: '8:00 AM' },
    { type: 'MORNING_SNACK', name: 'Morning Snack', icon: '🍎', defaultTime: '11:00 AM' },
    { type: 'LUNCH', name: 'Lunch', icon: '☀️', defaultTime: '1:00 PM' },
    { type: 'AFTERNOON_SNACK', name: 'Afternoon Snack', icon: '🥜', defaultTime: '4:00 PM' },
    { type: 'EVENING_SNACK', name: 'Evening Snack', icon: '🍌', defaultTime: '6:00 PM' },
    { type: 'DINNER', name: 'Dinner', icon: '🌙', defaultTime: '8:00 PM' },
    { type: 'LATE_SNACK', name: 'Late Night Snack', icon: '🌜', defaultTime: '10:00 PM' },
  ];

  const timeSlots = [
    '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM',
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
    '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
    '11:00 PM',
  ];

  const eggOptions = [0, 1, 2, 3, 4, 5, 6];

  const oilOptions = [
    { value: 'MUSTARD', label: 'Mustard Oil', icon: '🌻' },
    { value: 'OLIVE', label: 'Olive Oil', icon: '🫒' },
    { value: 'COCONUT', label: 'Coconut Oil', icon: '🥥' },
    { value: 'GHEE', label: 'Ghee', icon: '🧈' },
    { value: 'GROUNDNUT', label: 'Groundnut Oil', icon: '🥜' },
  ];

  const allergyOptions = [
    { value: 'GLUTEN', label: 'Gluten' },
    { value: 'DAIRY', label: 'Dairy' },
    { value: 'NUTS', label: 'Nuts' },
    { value: 'SOY', label: 'Soy' },
    { value: 'SHELLFISH', label: 'Shellfish' },
  ];

  const supplementOptions = [
    { value: 'CREATINE', label: 'Creatine', desc: 'Muscle strength' },
    { value: 'BCAA', label: 'BCAA', desc: 'Recovery' },
    { value: 'MULTIVITAMIN', label: 'Multivitamin', desc: 'Overall health' },
    { value: 'OMEGA3', label: 'Omega-3 / Fish Oil', desc: 'Heart & brain' },
  ];

  const [initialLoading, setInitialLoading] = useState(true);

  const PREFS_STORAGE_KEY = '@food_preferences';

  const restoreFromSaved = (saved) => {
    if (!saved || typeof saved !== 'object') return;

    setPreferences(prev => ({
      ...prev,
      includeChicken: saved.includeChicken ?? prev.includeChicken,
      includeFish: saved.includeFish ?? prev.includeFish,
      includeRedMeat: saved.includeRedMeat ?? prev.includeRedMeat,
      eggsPerDay: saved.eggsPerDay ?? prev.eggsPerDay,
      includeRice: saved.includeRice ?? prev.includeRice,
      includeRoti: saved.includeRoti ?? prev.includeRoti,
      includeDal: saved.includeDal ?? prev.includeDal,
      includeMilk: saved.includeMilk ?? prev.includeMilk,
      includePaneer: saved.includePaneer ?? prev.includePaneer,
      includeCurd: saved.includeCurd ?? prev.includeCurd,
      allergies: saved.allergies ?? prev.allergies,
      dislikedFoods: saved.dislikedFoods ?? prev.dislikedFoods,
      cookingOilPreference: saved.cookingOilPreference ?? prev.cookingOilPreference,
      preferHomemade: saved.preferHomemade ?? prev.preferHomemade,
    }));

    if (saved.customMeals && saved.customMeals.length > 0) {
      const restoredMeals = saved.customMeals.map((m, idx) => ({
        id: idx + 1,
        name: m.name,
        type: m.type,
        time: m.time,
        enabled: m.enabled ?? true,
      }));
      setCustomMeals(restoredMeals);
    }

    setWorkoutMeals(prev => ({
      ...prev,
      includePreWorkout: saved.includePreWorkout ?? prev.includePreWorkout,
      preWorkoutTime: saved.preWorkoutTime ?? prev.preWorkoutTime,
      includePostWorkout: saved.includePostWorkout ?? prev.includePostWorkout,
      postWorkoutTime: saved.postWorkoutTime ?? prev.postWorkoutTime,
    }));

    setSupplements(prev => ({
      ...prev,
      canTakeWheyProtein: saved.canTakeWheyProtein ?? prev.canTakeWheyProtein,
      otherSupplements: saved.supplements ?? prev.otherSupplements,
    }));
  };

  // Fetch saved preferences on mount and on focus
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // 1. Try AsyncStorage first (instant, always available)
        const localData = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          restoreFromSaved(parsed);
          console.log('Food preferences restored from local storage');
        }

        // 2. Also try backend (may have newer data from another device)
        try {
          const backendData = await nutritionService.getFoodPreferences();
          if (backendData && typeof backendData === 'object' && Object.keys(backendData).length > 0) {
            restoreFromSaved(backendData);
            // Update local cache with backend data
            await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(backendData));
            console.log('Food preferences synced from backend');
          }
        } catch (apiErr) {
          console.log('Backend food preferences not available, using local:', apiErr.message);
        }
      } catch (error) {
        console.log('Error loading food preferences:', error.message);
      } finally {
        setInitialLoading(false);
      }
    };

    loadPreferences();

    const unsubscribe = navigation.addListener('focus', () => {
      loadPreferences();
    });

    return unsubscribe;
  }, [navigation]);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllergy = (allergy) => {
    setPreferences(prev => {
      const allergies = prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy];
      return { ...prev, allergies };
    });
  };

  const toggleSupplement = (supplement) => {
    setSupplements(prev => {
      const otherSupplements = prev.otherSupplements.includes(supplement)
        ? prev.otherSupplements.filter(s => s !== supplement)
        : [...prev.otherSupplements, supplement];
      return { ...prev, otherSupplements };
    });
  };

  const addMeal = (mealType) => {
    const mealInfo = availableMealTypes.find(m => m.type === mealType);
    if (mealInfo && !customMeals.find(m => m.type === mealType)) {
      setCustomMeals(prev => [...prev, {
        id: Date.now(),
        name: mealInfo.name,
        type: mealType,
        time: mealInfo.defaultTime,
        enabled: true,
      }].sort((a, b) => {
        const timeA = convertTo24Hour(a.time);
        const timeB = convertTo24Hour(b.time);
        return timeA - timeB;
      }));
    }
  };

  const removeMeal = (mealId) => {
    if (customMeals.length > 1) {
      setCustomMeals(prev => prev.filter(m => m.id !== mealId));
    } else {
      showAlert('Cannot Remove', 'You need at least 1 meal in your plan');
    }
  };

  const updateMealTime = (mealId, newTime) => {
    setCustomMeals(prev => prev.map(m =>
      m.id === mealId ? { ...m, time: newTime } : m
    ).sort((a, b) => {
      const timeA = convertTo24Hour(a.time);
      const timeB = convertTo24Hour(b.time);
      return timeA - timeB;
    }));
    setShowTimePicker(false);
    setEditingMealIndex(null);
  };

  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return parseInt(hours) * 60 + parseInt(minutes);
  };

  const getMealIcon = (type) => {
    const meal = availableMealTypes.find(m => m.type === type);
    return meal?.icon || '🍽️';
  };

  const validateStep = () => {
    if (currentStep === 1 && customMeals.length === 0) {
      showAlert('Add Meals', 'Please add at least one meal to your plan');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    const enabledMeals = customMeals.filter(m => m.enabled);

    if (enabledMeals.length === 0) {
      showAlert('Add Meals', 'Please add at least one meal');
      return;
    }

    // Build the preferences payload
    const prefsPayload = {
      includeChicken: preferences.includeChicken,
      includeFish: preferences.includeFish,
      includeRedMeat: preferences.includeRedMeat,
      eggsPerDay: preferences.eggsPerDay,
      includeRice: preferences.includeRice,
      includeRoti: preferences.includeRoti,
      includeDal: preferences.includeDal,
      includeMilk: preferences.includeMilk,
      includePaneer: preferences.includePaneer,
      includeCurd: preferences.includeCurd,
      allergies: preferences.allergies,
      dislikedFoods: preferences.dislikedFoods,
      cookingOilPreference: preferences.cookingOilPreference,
      preferHomemade: preferences.preferHomemade,
      region: region,
      customMeals: enabledMeals.map(m => ({
        name: m.name,
        type: m.type,
        time: m.time,
        enabled: m.enabled,
      })),
      includePreWorkout: workoutMeals.includePreWorkout,
      preWorkoutTime: workoutMeals.preWorkoutTime,
      includePostWorkout: workoutMeals.includePostWorkout,
      postWorkoutTime: workoutMeals.postWorkoutTime,
      canTakeWheyProtein: supplements.canTakeWheyProtein,
      supplements: supplements.otherSupplements,
    };

    // Save to local storage (guaranteed to persist)
    try {
      await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefsPayload));
      console.log('Food preferences saved to local storage');
    } catch (error) {
      console.log('Failed to save to local storage:', error.message);
    }

    // Also save to backend (for cross-device sync)
    try {
      await nutritionService.saveFoodPreferences(prefsPayload);
      console.log('Food preferences saved to backend');
    } catch (error) {
      console.log('Failed to save food preferences to backend:', error.message);
    }

    navigation.navigate('GeneratedPlanView', {
      region,
      foodPreferences: preferences,
      customMeals: enabledMeals,
      workoutMeals,
      canTakeWheyProtein: supplements.canTakeWheyProtein,
      supplements: supplements.otherSupplements,
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            index <= currentStep && styles.stepCircleActive,
          ]}>
            <Text style={styles.stepIcon}>
              {index < currentStep ? '✓' : step.icon}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              index < currentStep && styles.stepLineActive,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const getSelectedTimeForPicker = () => {
    if (editingMealIndex !== null) {
      return customMeals[editingMealIndex]?.time;
    }
    if (editingWorkoutMeal === 'pre') {
      return workoutMeals.preWorkoutTime;
    }
    if (editingWorkoutMeal === 'post') {
      return workoutMeals.postWorkoutTime;
    }
    return null;
  };

  const handleTimeSelection = (time) => {
    if (editingMealIndex !== null) {
      updateMealTime(customMeals[editingMealIndex].id, time);
    } else if (editingWorkoutMeal === 'pre') {
      setWorkoutMeals(prev => ({ ...prev, preWorkoutTime: time }));
      setShowTimePicker(false);
      setEditingWorkoutMeal(null);
    } else if (editingWorkoutMeal === 'post') {
      setWorkoutMeals(prev => ({ ...prev, postWorkoutTime: time }));
      setShowTimePicker(false);
      setEditingWorkoutMeal(null);
    }
  };

  const renderTimePickerModal = () => {
    const selectedTime = getSelectedTimeForPicker();
    const title = editingWorkoutMeal === 'pre'
      ? 'Pre-Workout Time'
      : editingWorkoutMeal === 'post'
        ? 'Post-Workout Time'
        : 'Select Time';

    return (
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <ScrollView style={styles.timeList}>
              {timeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    selectedTime === time && styles.timeOptionSelected,
                  ]}
                  onPress={() => handleTimeSelection(time)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    selectedTime === time && styles.timeOptionTextSelected,
                  ]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowTimePicker(false);
                setEditingMealIndex(null);
                setEditingWorkoutMeal(null);
              }}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const addCustomItem = (category) => {
    if (!customItemName.trim()) {
      showAlert('Error', 'Please enter a food item name');
      return;
    }
    const key = `custom${category.charAt(0).toUpperCase() + category.slice(1)}`;
    setPreferences(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), customItemName.trim()],
    }));
    setCustomItemName('');
    setShowCustomInput(null);
  };

  const removeCustomItem = (category, item) => {
    const key = `custom${category.charAt(0).toUpperCase() + category.slice(1)}`;
    setPreferences(prev => ({
      ...prev,
      [key]: prev[key].filter(i => i !== item),
    }));
  };

  const renderCustomInputModal = () => (
    <Modal
      visible={showCustomInput !== null}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCustomInput(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Add Custom {showCustomInput === 'proteins' ? 'Protein' :
                        showCustomInput === 'carbs' ? 'Carb' :
                        showCustomInput === 'dairy' ? 'Dairy' : 'Salad'} Item
          </Text>
          <TextInput
            style={styles.customInput}
            placeholder="Enter food item name..."
            placeholderTextColor={colors.text.secondary}
            value={customItemName}
            onChangeText={setCustomItemName}
            autoFocus
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => {
                setCustomItemName('');
                setShowCustomInput(null);
              }}
            >
              <Text style={styles.modalButtonCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={() => addCustomItem(showCustomInput)}
            >
              <Text style={styles.modalButtonConfirmText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCustomItems = (category) => {
    const key = `custom${category.charAt(0).toUpperCase() + category.slice(1)}`;
    const items = preferences[key] || [];
    if (items.length === 0) return null;

    return (
      <View style={styles.customItemsContainer}>
        <Text style={styles.customItemsLabel}>Your custom items:</Text>
        <View style={styles.customItemsRow}>
          {items.map((item, index) => (
            <View key={index} style={styles.customItemChip}>
              <Text style={styles.customItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeCustomItem(category, item)}>
                <Text style={styles.customItemRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFoodItemsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Your Food Preferences 🍽️</Text>
      <Text style={styles.stepSubtitle}>
        Based on your {dietType.toLowerCase().replace('_', ' ')} diet
      </Text>

      {/* PROTEIN SOURCES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🥩 Protein Sources</Text>

        {isNonVeg && (
          <>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>🍗 Chicken</Text>
                <Text style={styles.toggleDesc}>Lean protein, versatile</Text>
              </View>
              <Switch
                value={preferences.includeChicken}
                onValueChange={() => togglePreference('includeChicken')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>🐟 Fish</Text>
                <Text style={styles.toggleDesc}>Rich in Omega-3</Text>
              </View>
              <Switch
                value={preferences.includeFish}
                onValueChange={() => togglePreference('includeFish')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>🦐 Prawns/Shrimp</Text>
                <Text style={styles.toggleDesc}>Low fat, high protein</Text>
              </View>
              <Switch
                value={preferences.includePrawns}
                onValueChange={() => togglePreference('includePrawns')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>🥩 Red Meat</Text>
                <Text style={styles.toggleDesc}>Mutton/Lamb/Beef</Text>
              </View>
              <Switch
                value={preferences.includeRedMeat}
                onValueChange={() => togglePreference('includeRedMeat')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>🦃 Turkey</Text>
                <Text style={styles.toggleDesc}>Lean meat option</Text>
              </View>
              <Switch
                value={preferences.includeTurkey}
                onValueChange={() => togglePreference('includeTurkey')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </>
        )}

        {/* Vegetarian protein options */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🫘 Soya Chunks</Text>
            <Text style={styles.toggleDesc}>Plant-based protein</Text>
          </View>
          <Switch
            value={preferences.includeSoyaChunks}
            onValueChange={() => togglePreference('includeSoyaChunks')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🧊 Tofu</Text>
            <Text style={styles.toggleDesc}>Soy-based protein</Text>
          </View>
          <Switch
            value={preferences.includeTofu}
            onValueChange={() => togglePreference('includeTofu')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🫛 Legumes/Beans</Text>
            <Text style={styles.toggleDesc}>Rajma, Chana, etc.</Text>
          </View>
          <Switch
            value={preferences.includeLegumes}
            onValueChange={() => togglePreference('includeLegumes')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🥜 Nuts & Seeds</Text>
            <Text style={styles.toggleDesc}>Almonds, Peanuts, etc.</Text>
          </View>
          <Switch
            value={preferences.includeNuts}
            onValueChange={() => togglePreference('includeNuts')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {renderCustomItems('proteins')}

        <TouchableOpacity
          style={styles.addCustomButton}
          onPress={() => setShowCustomInput('proteins')}
        >
          <Text style={styles.addCustomButtonText}>+ Add Custom Protein Source</Text>
        </TouchableOpacity>
      </View>

      {/* EGGS SECTION */}
      {(isNonVeg || isEggetarian) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🥚 Eggs Per Day</Text>
          <View style={styles.eggSelector}>
            {eggOptions.map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.eggOption,
                  preferences.eggsPerDay === num && styles.eggOptionSelected,
                ]}
                onPress={() => setPreferences(prev => ({ ...prev, eggsPerDay: num }))}
              >
                <Text style={[
                  styles.eggOptionText,
                  preferences.eggsPerDay === num && styles.eggOptionTextSelected,
                ]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* CARB SOURCES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌾 Carb Sources</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🍚 Rice</Text>
            <Text style={styles.toggleDesc}>White/Brown rice</Text>
          </View>
          <Switch
            value={preferences.includeRice}
            onValueChange={() => togglePreference('includeRice')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🫓 Roti/Chapati</Text>
            <Text style={styles.toggleDesc}>Whole wheat flatbread</Text>
          </View>
          <Switch
            value={preferences.includeRoti}
            onValueChange={() => togglePreference('includeRoti')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {!isJain && (
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>🥣 Dal/Lentils</Text>
              <Text style={styles.toggleDesc}>Protein + Carbs</Text>
            </View>
            <Switch
              value={preferences.includeDal}
              onValueChange={() => togglePreference('includeDal')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        )}

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🥣 Oats</Text>
            <Text style={styles.toggleDesc}>High fiber, filling</Text>
          </View>
          <Switch
            value={preferences.includeOats}
            onValueChange={() => togglePreference('includeOats')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🌾 Quinoa</Text>
            <Text style={styles.toggleDesc}>Complete protein grain</Text>
          </View>
          <Switch
            value={preferences.includeQuinoa}
            onValueChange={() => togglePreference('includeQuinoa')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🍚 Poha</Text>
            <Text style={styles.toggleDesc}>Flattened rice</Text>
          </View>
          <Switch
            value={preferences.includePoha}
            onValueChange={() => togglePreference('includePoha')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🍚 Upma</Text>
            <Text style={styles.toggleDesc}>Semolina dish</Text>
          </View>
          <Switch
            value={preferences.includeUpma}
            onValueChange={() => togglePreference('includeUpma')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🍞 Bread</Text>
            <Text style={styles.toggleDesc}>Whole wheat/Multigrain</Text>
          </View>
          <Switch
            value={preferences.includeBread}
            onValueChange={() => togglePreference('includeBread')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🍝 Pasta</Text>
            <Text style={styles.toggleDesc}>Whole wheat pasta</Text>
          </View>
          <Switch
            value={preferences.includePasta}
            onValueChange={() => togglePreference('includePasta')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🍠 Sweet Potato</Text>
            <Text style={styles.toggleDesc}>Complex carbs, fiber</Text>
          </View>
          <Switch
            value={preferences.includeSweet_potato}
            onValueChange={() => togglePreference('includeSweet_potato')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🥔 Regular Potato</Text>
            <Text style={styles.toggleDesc}>Versatile carb source</Text>
          </View>
          <Switch
            value={preferences.includeRegular_potato}
            onValueChange={() => togglePreference('includeRegular_potato')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {renderCustomItems('carbs')}

        <TouchableOpacity
          style={styles.addCustomButton}
          onPress={() => setShowCustomInput('carbs')}
        >
          <Text style={styles.addCustomButtonText}>+ Add Custom Carb Source</Text>
        </TouchableOpacity>
      </View>

      {/* DAIRY PRODUCTS */}
      {!isVegan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🥛 Dairy Products</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>🥛 Milk</Text>
              <Text style={styles.toggleDesc}>Full fat/Toned/Skimmed</Text>
            </View>
            <Switch
              value={preferences.includeMilk}
              onValueChange={() => togglePreference('includeMilk')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>🧀 Paneer</Text>
              <Text style={styles.toggleDesc}>Indian cottage cheese</Text>
            </View>
            <Switch
              value={preferences.includePaneer}
              onValueChange={() => togglePreference('includePaneer')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>🥄 Curd/Yogurt</Text>
              <Text style={styles.toggleDesc}>Probiotic rich</Text>
            </View>
            <Switch
              value={preferences.includeCurd}
              onValueChange={() => togglePreference('includeCurd')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>🧀 Cheese</Text>
              <Text style={styles.toggleDesc}>Processed/Mozzarella</Text>
            </View>
            <Switch
              value={preferences.includeCheese}
              onValueChange={() => togglePreference('includeCheese')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>🥛 Buttermilk</Text>
              <Text style={styles.toggleDesc}>Chaas - digestive aid</Text>
            </View>
            <Switch
              value={preferences.includeButtermilk}
              onValueChange={() => togglePreference('includeButtermilk')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>🧈 Ghee</Text>
              <Text style={styles.toggleDesc}>Clarified butter</Text>
            </View>
            <Switch
              value={preferences.includeGhee}
              onValueChange={() => togglePreference('includeGhee')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>🥄 Greek Yogurt</Text>
              <Text style={styles.toggleDesc}>High protein yogurt</Text>
            </View>
            <Switch
              value={preferences.includeGreekYogurt}
              onValueChange={() => togglePreference('includeGreekYogurt')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>🧀 Cottage Cheese</Text>
              <Text style={styles.toggleDesc}>Low fat, high protein</Text>
            </View>
            <Switch
              value={preferences.includeCottageCheese}
              onValueChange={() => togglePreference('includeCottageCheese')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {renderCustomItems('dairy')}

          <TouchableOpacity
            style={styles.addCustomButton}
            onPress={() => setShowCustomInput('dairy')}
          >
            <Text style={styles.addCustomButtonText}>+ Add Custom Dairy Product</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SALADS & VEGETABLES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🥗 Salads & Vegetables</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🥒 Cucumber</Text>
            <Text style={styles.toggleDesc}>Hydrating, low calorie</Text>
          </View>
          <Switch
            value={preferences.includeCucumber}
            onValueChange={() => togglePreference('includeCucumber')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🍅 Tomato</Text>
            <Text style={styles.toggleDesc}>Rich in lycopene</Text>
          </View>
          <Switch
            value={preferences.includeTomato}
            onValueChange={() => togglePreference('includeTomato')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🥕 Carrot</Text>
            <Text style={styles.toggleDesc}>Beta-carotene rich</Text>
          </View>
          <Switch
            value={preferences.includeCarrot}
            onValueChange={() => togglePreference('includeCarrot')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {!isJain && (
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>🧅 Onion</Text>
              <Text style={styles.toggleDesc}>Flavor & nutrients</Text>
            </View>
            <Switch
              value={preferences.includeOnion}
              onValueChange={() => togglePreference('includeOnion')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        )}

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🫒 Beetroot</Text>
            <Text style={styles.toggleDesc}>Iron rich, earthy</Text>
          </View>
          <Switch
            value={preferences.includeBeetroot}
            onValueChange={() => togglePreference('includeBeetroot')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🥬 Spinach</Text>
            <Text style={styles.toggleDesc}>Iron & vitamins</Text>
          </View>
          <Switch
            value={preferences.includeSpinach}
            onValueChange={() => togglePreference('includeSpinach')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🥬 Lettuce</Text>
            <Text style={styles.toggleDesc}>Crunchy, low calorie</Text>
          </View>
          <Switch
            value={preferences.includeLettuce}
            onValueChange={() => togglePreference('includeLettuce')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🥬 Cabbage</Text>
            <Text style={styles.toggleDesc}>Fiber rich, crunchy</Text>
          </View>
          <Switch
            value={preferences.includeCabbage}
            onValueChange={() => togglePreference('includeCabbage')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🫑 Bell Pepper</Text>
            <Text style={styles.toggleDesc}>Vitamin C rich</Text>
          </View>
          <Switch
            value={preferences.includeBellPepper}
            onValueChange={() => togglePreference('includeBellPepper')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>🥦 Broccoli</Text>
            <Text style={styles.toggleDesc}>Superfood, fiber rich</Text>
          </View>
          <Switch
            value={preferences.includeBroccoli}
            onValueChange={() => togglePreference('includeBroccoli')}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {renderCustomItems('salads')}

        <TouchableOpacity
          style={styles.addCustomButton}
          onPress={() => setShowCustomInput('salads')}
        >
          <Text style={styles.addCustomButtonText}>+ Add Custom Vegetable/Salad</Text>
        </TouchableOpacity>
      </View>

      {/* COOKING OIL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🫒 Cooking Oil</Text>
        <View style={styles.oilSelector}>
          {oilOptions.map((oil) => (
            <TouchableOpacity
              key={oil.value}
              style={[
                styles.oilOption,
                preferences.cookingOilPreference === oil.value && styles.oilOptionSelected,
              ]}
              onPress={() => setPreferences(prev => ({ ...prev, cookingOilPreference: oil.value }))}
            >
              <Text style={styles.oilIcon}>{oil.icon}</Text>
              <Text style={[
                styles.oilLabel,
                preferences.cookingOilPreference === oil.value && styles.oilLabelSelected,
              ]}>{oil.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ALLERGIES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Allergies</Text>
        <View style={styles.chipContainer}>
          {allergyOptions.map((allergy) => (
            <TouchableOpacity
              key={allergy.value}
              style={[
                styles.chip,
                preferences.allergies.includes(allergy.value) && styles.chipSelected,
              ]}
              onPress={() => toggleAllergy(allergy.value)}
            >
              <Text style={[
                styles.chipText,
                preferences.allergies.includes(allergy.value) && styles.chipTextSelected,
              ]}>{allergy.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {renderCustomInputModal()}
    </View>
  );

  const renderMealsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Customize Your Meals ⏰</Text>
      <Text style={styles.stepSubtitle}>Add meals and set your preferred eating times</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Your Meals ({customMeals.length})</Text>

        {customMeals.map((meal, index) => (
          <View key={meal.id} style={styles.mealRow}>
            <View style={styles.mealInfo}>
              <Text style={styles.mealIconLarge}>{getMealIcon(meal.type)}</Text>
              <View style={styles.mealDetails}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => {
                    setEditingMealIndex(index);
                    setShowTimePicker(true);
                  }}
                >
                  <Text style={styles.timeButtonText}>🕐 {meal.time}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeMealButton}
              onPress={() => removeMeal(meal.id)}
            >
              <Text style={styles.removeMealText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>➕ Add More Meals</Text>
        <View style={styles.addMealContainer}>
          {availableMealTypes
            .filter(m => !customMeals.find(cm => cm.type === m.type))
            .map((meal) => (
              <TouchableOpacity
                key={meal.type}
                style={styles.addMealButton}
                onPress={() => addMeal(meal.type)}
              >
                <Text style={styles.addMealIcon}>{meal.icon}</Text>
                <Text style={styles.addMealText}>{meal.name}</Text>
                <Text style={styles.addMealPlus}>+</Text>
              </TouchableOpacity>
            ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏋️ Workout Nutrition</Text>

        <View style={styles.workoutMealCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>⚡ Pre-Workout Meal</Text>
              <Text style={styles.toggleDesc}>Light meal before workout</Text>
            </View>
            <Switch
              value={workoutMeals.includePreWorkout}
              onValueChange={(value) => setWorkoutMeals(prev => ({ ...prev, includePreWorkout: value }))}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {workoutMeals.includePreWorkout && (
            <TouchableOpacity
              style={styles.workoutTimeButton}
              onPress={() => {
                setEditingWorkoutMeal('pre');
                setShowTimePicker(true);
              }}
            >
              <Text style={styles.workoutTimeText}>🕐 {workoutMeals.preWorkoutTime}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.workoutMealCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>💪 Post-Workout Meal</Text>
              <Text style={styles.toggleDesc}>Recovery meal after workout</Text>
            </View>
            <Switch
              value={workoutMeals.includePostWorkout}
              onValueChange={(value) => setWorkoutMeals(prev => ({ ...prev, includePostWorkout: value }))}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {workoutMeals.includePostWorkout && (
            <TouchableOpacity
              style={styles.workoutTimeButton}
              onPress={() => {
                setEditingWorkoutMeal('post');
                setShowTimePicker(true);
              }}
            >
              <Text style={styles.workoutTimeText}>🕐 {workoutMeals.postWorkoutTime}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderSupplementsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Supplements 💪</Text>
      <Text style={styles.stepSubtitle}>Optional - helps optimize your nutrition</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🥤 Whey Protein</Text>

        <View style={[styles.wheyCard, supplements.canTakeWheyProtein && styles.wheyCardSelected]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Can you take Whey Protein?</Text>
              <Text style={styles.toggleDesc}>Recommended for muscle building</Text>
            </View>
            <Switch
              value={supplements.canTakeWheyProtein}
              onValueChange={(value) => setSupplements(prev => ({ ...prev, canTakeWheyProtein: value }))}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {supplements.canTakeWheyProtein && (
            <View style={styles.wheyInfo}>
              <Text style={styles.wheyInfoText}>
                ✓ ~25g protein per serving{'\n'}
                ✓ Best taken post-workout{'\n'}
                ✓ Will be included in your plan
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💊 Other Supplements</Text>

        {supplementOptions.map((supp) => (
          <TouchableOpacity
            key={supp.value}
            style={[
              styles.supplementCard,
              supplements.otherSupplements.includes(supp.value) && styles.supplementCardSelected,
            ]}
            onPress={() => toggleSupplement(supp.value)}
          >
            <View style={styles.supplementInfo}>
              <Text style={[
                styles.supplementLabel,
                supplements.otherSupplements.includes(supp.value) && styles.supplementLabelSelected,
              ]}>{supp.label}</Text>
              <Text style={styles.supplementDesc}>{supp.desc}</Text>
            </View>
            {supplements.otherSupplements.includes(supp.value) && (
              <Text style={styles.checkIcon}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📋 Your Plan Summary</Text>
        <Text style={styles.summaryText}>
          • {customMeals.length} meals per day{'\n'}
          {customMeals.map(m => `  - ${m.name} at ${m.time}\n`).join('')}
          {workoutMeals.includePreWorkout && `• Pre-workout at ${workoutMeals.preWorkoutTime}\n`}
          {workoutMeals.includePostWorkout && `• Post-workout at ${workoutMeals.postWorkoutTime}\n`}
          {supplements.canTakeWheyProtein && '• Whey protein included\n'}
          • {region} regional cuisine{'\n'}
          • {dietType.toLowerCase().replace('_', ' ')} diet
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderFoodItemsStep();
      case 1: return renderMealsStep();
      case 2: return renderSupplementsStep();
      default: return null;
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, color: colors.text.secondary }}>Loading your preferences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Preferences</Text>
        <View style={{ width: 60 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? 'Generate My Plan 🚀' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {renderTimePickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    paddingTop: spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.inverse,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepIcon: {
    fontSize: 18,
  },
  stepLine: {
    width: 40,
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  stepContent: {
    paddingBottom: spacing.xxl,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  toggleDesc: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  eggSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eggOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  eggOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eggOptionText: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  eggOptionTextSelected: {
    color: colors.text.inverse,
  },
  oilSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  oilOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  oilOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  oilIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  oilLabel: {
    ...typography.caption,
    color: colors.text.primary,
  },
  oilLabelSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  chipTextSelected: {
    color: colors.text.inverse,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIconLarge: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  mealDetails: {
    flex: 1,
  },
  mealName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timeButton: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  timeButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  removeMealButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMealText: {
    color: colors.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
  addMealContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addMealIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  addMealText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  addMealPlus: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  workoutMealCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  workoutTimeButton: {
    backgroundColor: colors.primary + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  workoutTimeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  wheyCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  wheyCardSelected: {
    borderColor: colors.success,
    backgroundColor: '#E8F5E9',
  },
  wheyInfo: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  wheyInfoText: {
    ...typography.caption,
    color: colors.success,
    lineHeight: 20,
  },
  supplementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  supplementCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  supplementInfo: {
    flex: 1,
  },
  supplementLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  supplementLabelSelected: {
    color: colors.primary,
  },
  supplementDesc: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  checkIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  summaryCard: {
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  summaryTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  summaryText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '60%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  timeList: {
    maxHeight: 300,
  },
  timeOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timeOptionSelected: {
    backgroundColor: colors.primary + '20',
  },
  timeOptionText: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalCloseText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  // Custom food item styles
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  addCustomButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  customItemsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  customItemsLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  customItemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  customItemText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  customItemRemove: {
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: 'bold',
    fontSize: 14,
  },
  customInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.border,
    marginRight: spacing.sm,
  },
  modalButtonCancelText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  modalButtonConfirmText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: '600',
  },
});

export default FoodPreferencesScreen;

