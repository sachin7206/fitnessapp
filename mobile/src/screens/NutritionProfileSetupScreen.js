import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { updateUser } from '../store/slices/authSlice';

const NutritionProfileSetupScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { missingFields = [] } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    age: user?.profile?.age?.toString() || '',
    gender: user?.profile?.gender || '',
    height: user?.healthMetrics?.height?.toString() || '',
    currentWeight: user?.healthMetrics?.currentWeight?.toString() || '',
    targetWeight: user?.healthMetrics?.targetWeight?.toString() || '',
    activityLevel: user?.healthMetrics?.activityLevel || '',
    dietaryPreference: user?.healthMetrics?.dietaryPreferences?.[0] || '',
    goals: user?.goals || [],
    healthConditions: user?.healthMetrics?.healthConditions || [],
  });

  // Fetch fresh profile from API to ensure form has latest data
  useEffect(() => {
    const loadFreshProfile = async () => {
      try {
        const response = await userService.getProfile();
        const freshUser = response.data || response;
        if (freshUser) {
          // Update Redux auth user
          dispatch(updateUser(freshUser));
          // Update AsyncStorage
          await authService.updateCachedUser(freshUser);
          // Update form data with fresh profile
          setFormData(prev => ({
            ...prev,
            firstName: freshUser.profile?.firstName || prev.firstName,
            lastName: freshUser.profile?.lastName || prev.lastName,
            age: freshUser.profile?.age?.toString() || prev.age,
            gender: freshUser.profile?.gender || prev.gender,
            height: freshUser.healthMetrics?.height?.toString() || prev.height,
            currentWeight: freshUser.healthMetrics?.currentWeight?.toString() || prev.currentWeight,
            targetWeight: freshUser.healthMetrics?.targetWeight?.toString() || prev.targetWeight,
            activityLevel: freshUser.healthMetrics?.activityLevel || prev.activityLevel,
            dietaryPreference: freshUser.healthMetrics?.dietaryPreferences?.[0] || prev.dietaryPreference,
            goals: freshUser.goals?.length > 0 ? freshUser.goals : prev.goals,
            healthConditions: freshUser.healthMetrics?.healthConditions?.length > 0
              ? freshUser.healthMetrics.healthConditions
              : prev.healthConditions,
          }));
        }
      } catch (error) {
        console.log('Could not fetch fresh profile, using cached data');
      } finally {
        setInitialLoading(false);
      }
    };
    loadFreshProfile();
  }, []);

  const genderOptions = [
    { label: 'Male', value: 'MALE', icon: '👨' },
    { label: 'Female', value: 'FEMALE', icon: '👩' },
    { label: 'Other', value: 'OTHER', icon: '🧑' },
  ];

  const activityLevels = [
    { label: 'Sedentary', value: 'SEDENTARY', desc: 'Little or no exercise', icon: '🛋️' },
    { label: 'Light', value: 'LIGHT', desc: '1-3 days/week', icon: '🚶' },
    { label: 'Moderate', value: 'MODERATE', desc: '3-5 days/week', icon: '🏃' },
    { label: 'Active', value: 'ACTIVE', desc: '6-7 days/week', icon: '💪' },
    { label: 'Very Active', value: 'VERY_ACTIVE', desc: 'Intense daily exercise', icon: '🏋️' },
  ];

  const dietaryPreferences = [
    { label: 'Vegetarian', value: 'VEGETARIAN', icon: '🥬', desc: 'No meat or fish' },
    { label: 'Vegan', value: 'VEGAN', icon: '🌱', desc: 'No animal products' },
    { label: 'Eggetarian', value: 'EGGETARIAN', icon: '🥚', desc: 'Vegetarian + eggs' },
    { label: 'Non-Vegetarian', value: 'NON_VEGETARIAN', icon: '🍗', desc: 'All foods' },
    { label: 'Jain', value: 'JAIN', icon: '🙏', desc: 'No root vegetables' },
  ];

  const goalOptions = [
    { label: 'Weight Loss', value: 'WEIGHT_LOSS', icon: '⚖️' },
    { label: 'Weight Gain', value: 'WEIGHT_GAIN', icon: '📈' },
    { label: 'Muscle Building', value: 'MUSCLE_BUILDING', icon: '💪' },
    { label: 'Maintain Weight', value: 'MAINTENANCE', icon: '✨' },
    { label: 'Diabetes Management', value: 'DIABETES_FRIENDLY', icon: '🩺' },
    { label: 'Heart Health', value: 'HEART_HEALTHY', icon: '❤️' },
  ];

  const healthConditionExamples = [
    { label: 'Diabetes', value: 'DIABETES', icon: '🩺' },
    { label: 'High Blood Pressure', value: 'HYPERTENSION', icon: '💉' },
    { label: 'Heart Disease', value: 'HEART_DISEASE', icon: '❤️‍🩹' },
    { label: 'Thyroid Issues', value: 'THYROID', icon: '🦋' },
    { label: 'PCOS', value: 'PCOS', icon: '🩻' },
    { label: 'Cholesterol', value: 'CHOLESTEROL', icon: '🫀' },
    { label: 'Asthma', value: 'ASTHMA', icon: '🫁' },
  ];

  // Health condition popup state
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [customHealthInput, setCustomHealthInput] = useState('');

  const steps = [
    { title: 'Personal Info', icon: '👤' },
    { title: 'Body Metrics', icon: '📏' },
    { title: 'Activity Level', icon: '🏃' },
    { title: 'Diet Preference', icon: '🍽️' },
    { title: 'Goals', icon: '🎯' },
  ];

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGoal = (goal) => {
    setFormData(prev => {
      // If already selected, just remove it
      if (prev.goals.includes(goal)) {
        return { ...prev, goals: prev.goals.filter(g => g !== goal) };
      }

      // Conflicting goal groups — only one from each group
      const conflicting = {
        'WEIGHT_LOSS': ['WEIGHT_GAIN', 'MAINTENANCE'],
        'WEIGHT_GAIN': ['WEIGHT_LOSS', 'MAINTENANCE'],
        'MAINTENANCE': ['WEIGHT_LOSS', 'WEIGHT_GAIN'],
      };

      let newGoals = [...prev.goals];

      // Remove any conflicting goals
      const conflicts = conflicting[goal] || [];
      if (conflicts.length > 0) {
        const removed = newGoals.filter(g => conflicts.includes(g));
        newGoals = newGoals.filter(g => !conflicts.includes(g));
        if (removed.length > 0) {
          const conflictNames = removed.map(g => {
            const opt = goalOptions.find(o => o.value === g);
            return opt ? opt.label : g;
          }).join(', ');
          setTimeout(() => showAlert(
            'Goal Updated',
            `Removed "${conflictNames}" as it conflicts with your new selection.`
          ), 100);
        }
      }

      newGoals.push(goal);
      return { ...prev, goals: newGoals };
    });
  };

  const addHealthCondition = (condition) => {
    if (!formData.healthConditions.includes(condition)) {
      setFormData(prev => ({
        ...prev,
        healthConditions: [...prev.healthConditions, condition],
      }));
    }
  };

  const removeHealthCondition = (condition) => {
    setFormData(prev => ({
      ...prev,
      healthConditions: prev.healthConditions.filter(c => c !== condition),
    }));
  };

  const addCustomHealthCondition = () => {
    const trimmed = customHealthInput.trim();
    if (!trimmed) return;
    const value = trimmed.toUpperCase().replace(/\s+/g, '_');
    if (!formData.healthConditions.includes(value)) {
      addHealthCondition(value);
    }
    setCustomHealthInput('');
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0: // Personal Info
        if (!formData.firstName || !formData.age || !formData.gender) {
          showAlert('Required Fields', 'Please fill in your name, age, and gender');
          return false;
        }
        if (formData.firstName.trim().length > 50) {
          showAlert('Invalid Name', 'First name must be ≤ 50 characters');
          return false;
        }
        if (formData.lastName && formData.lastName.trim().length > 50) {
          showAlert('Invalid Name', 'Last name must be ≤ 50 characters');
          return false;
        }
        if (parseInt(formData.age) < 10 || parseInt(formData.age) > 100) {
          showAlert('Invalid Age', 'Please enter a valid age between 10 and 100');
          return false;
        }
        return true;
      case 1: // Body Metrics
        if (!formData.height || !formData.currentWeight) {
          showAlert('Required Fields', 'Please enter your height and weight');
          return false;
        }
        {
          const h = parseFloat(formData.height);
          if (isNaN(h) || h < 50 || h > 300) {
            showAlert('Invalid Height', 'Height must be between 50 and 300 cm');
            return false;
          }
          const w = parseFloat(formData.currentWeight);
          if (isNaN(w) || w < 20 || w > 500) {
            showAlert('Invalid Weight', 'Current weight must be between 20 and 500 kg');
            return false;
          }
          if (formData.targetWeight) {
            const tw = parseFloat(formData.targetWeight);
            if (isNaN(tw) || tw < 20 || tw > 500) {
              showAlert('Invalid Target Weight', 'Target weight must be between 20 and 500 kg');
              return false;
            }
          }
        }
        return true;
      case 2: // Activity Level
        if (!formData.activityLevel) {
          showAlert('Required Field', 'Please select your activity level');
          return false;
        }
        return true;
      case 3: // Diet Preference
        if (!formData.dietaryPreference) {
          showAlert('Required Field', 'Please select your dietary preference');
          return false;
        }
        return true;
      case 4: // Goals
        if (formData.goals.length === 0) {
          showAlert('Required Field', 'Please select at least one goal');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
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
    setLoading(true);
    try {
      const profileData = {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          age: parseInt(formData.age),
          gender: formData.gender,
        },
        healthMetrics: {
          height: parseFloat(formData.height),
          currentWeight: parseFloat(formData.currentWeight),
          targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : parseFloat(formData.currentWeight),
          activityLevel: formData.activityLevel,
          dietaryPreferences: [formData.dietaryPreference],
          healthConditions: formData.healthConditions,
        },
        goals: formData.goals,
      };

      const response = await userService.updateProfile(profileData);
      const updatedUser = response.data || response;
      dispatch(updateUser(updatedUser));
      // Also persist to AsyncStorage so it survives app restarts
      await authService.updateCachedUser(updatedUser);

      // Navigate to region selection
      navigation.replace('NutritionRegionSelect');
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            index <= currentStep && styles.stepCircleActive,
            index < currentStep && styles.stepCircleCompleted,
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

  const renderPersonalInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Let's get to know you! 👋</Text>
      <Text style={styles.stepSubtitle}>This helps us create your personalized plan</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.firstName}
          onChangeText={(v) => updateField('firstName', v)}
          placeholder="Enter your first name"
          maxLength={50}
          placeholderTextColor={colors.text.secondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={formData.lastName}
          onChangeText={(v) => updateField('lastName', v)}
          placeholder="Enter your last name"
          maxLength={50}
          placeholderTextColor={colors.text.secondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          value={formData.age}
          onChangeText={(v) => updateField('age', v.replace(/[^0-9]/g, ''))}
          placeholder="Enter your age"
          keyboardType="numeric"
          maxLength={3}
          placeholderTextColor={colors.text.secondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.optionRow}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                formData.gender === option.value && styles.optionCardSelected,
              ]}
              onPress={() => updateField('gender', option.value)}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={[
                styles.optionLabel,
                formData.gender === option.value && styles.optionLabelSelected,
              ]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderBodyMetrics = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Body Metrics 📏</Text>
      <Text style={styles.stepSubtitle}>We'll use this to calculate your calorie needs</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Height (cm) *</Text>
        <TextInput
          style={styles.input}
          value={formData.height}
          onChangeText={(v) => updateField('height', v.replace(/[^0-9.]/g, ''))}
          placeholder="e.g., 170"
          keyboardType="numeric"
          maxLength={5}
          placeholderTextColor={colors.text.secondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current Weight (kg) *</Text>
        <TextInput
          style={styles.input}
          value={formData.currentWeight}
          onChangeText={(v) => updateField('currentWeight', v.replace(/[^0-9.]/g, ''))}
          placeholder="e.g., 70"
          keyboardType="numeric"
          maxLength={5}
          placeholderTextColor={colors.text.secondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={formData.targetWeight}
          onChangeText={(v) => updateField('targetWeight', v.replace(/[^0-9.]/g, ''))}
          placeholder="e.g., 65"
          keyboardType="numeric"
          maxLength={5}
          placeholderTextColor={colors.text.secondary}
        />
      </View>

      {formData.height && formData.currentWeight && (
        <View style={styles.bmiCard}>
          <Text style={styles.bmiLabel}>Your BMI</Text>
          <Text style={styles.bmiValue}>
            {(parseFloat(formData.currentWeight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)}
          </Text>
          <Text style={styles.bmiCategory}>
            {getBMICategory(parseFloat(formData.currentWeight) / Math.pow(parseFloat(formData.height) / 100, 2))}
          </Text>
        </View>
      )}
    </View>
  );

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const renderActivityLevel = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How active are you? 🏃</Text>
      <Text style={styles.stepSubtitle}>This affects your daily calorie requirements</Text>

      {activityLevels.map((level) => (
        <TouchableOpacity
          key={level.value}
          style={[
            styles.activityCard,
            formData.activityLevel === level.value && styles.activityCardSelected,
          ]}
          onPress={() => updateField('activityLevel', level.value)}
        >
          <Text style={styles.activityIcon}>{level.icon}</Text>
          <View style={styles.activityInfo}>
            <Text style={[
              styles.activityLabel,
              formData.activityLevel === level.value && styles.activityLabelSelected,
            ]}>{level.label}</Text>
            <Text style={styles.activityDesc}>{level.desc}</Text>
          </View>
          {formData.activityLevel === level.value && (
            <Text style={styles.checkIcon}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDietPreference = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Diet Preference 🍽️</Text>
      <Text style={styles.stepSubtitle}>We'll customize meals based on your preference</Text>

      {dietaryPreferences.map((pref) => (
        <TouchableOpacity
          key={pref.value}
          style={[
            styles.activityCard,
            formData.dietaryPreference === pref.value && styles.activityCardSelected,
          ]}
          onPress={() => updateField('dietaryPreference', pref.value)}
        >
          <Text style={styles.activityIcon}>{pref.icon}</Text>
          <View style={styles.activityInfo}>
            <Text style={[
              styles.activityLabel,
              formData.dietaryPreference === pref.value && styles.activityLabelSelected,
            ]}>{pref.label}</Text>
            <Text style={styles.activityDesc}>{pref.desc}</Text>
          </View>
          {formData.dietaryPreference === pref.value && (
            <Text style={styles.checkIcon}>✓</Text>
          )}
        </TouchableOpacity>
      ))}

      <Text style={[styles.label, { marginTop: spacing.lg }]}>Any health conditions?</Text>
      <TouchableOpacity
        style={styles.healthConditionBtn}
        onPress={() => setShowHealthModal(true)}
      >
        <Text style={styles.healthConditionBtnIcon}>🩺</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.healthConditionBtnText}>
            {formData.healthConditions.length > 0
              ? `${formData.healthConditions.length} condition(s) added`
              : 'Tap to add health conditions'}
          </Text>
          <Text style={styles.healthConditionBtnHint}>
            {formData.healthConditions.length > 0
              ? formData.healthConditions.map(c => c.replace(/_/g, ' ')).join(', ')
              : 'Skip if none'}
          </Text>
        </View>
        <Text style={{ fontSize: 16 }}>→</Text>
      </TouchableOpacity>

      {/* Display selected conditions as removable chips */}
      {formData.healthConditions.length > 0 && (
        <View style={styles.chipContainer}>
          {formData.healthConditions.map((cond) => (
            <View key={cond} style={[styles.chip, styles.chipSelected]}>
              <Text style={styles.chipTextSelected}>
                {cond.replace(/_/g, ' ')}
              </Text>
              <TouchableOpacity onPress={() => removeHealthCondition(cond)}>
                <Text style={styles.chipRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderGoals = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What are your goals? 🎯</Text>
      <Text style={styles.stepSubtitle}>Select all that apply</Text>

      <View style={styles.goalsGrid}>
        {goalOptions.map((goal) => (
          <TouchableOpacity
            key={goal.value}
            style={[
              styles.goalCard,
              formData.goals.includes(goal.value) && styles.goalCardSelected,
            ]}
            onPress={() => toggleGoal(goal.value)}
          >
            <Text style={styles.goalIcon}>{goal.icon}</Text>
            <Text style={[
              styles.goalLabel,
              formData.goals.includes(goal.value) && styles.goalLabelSelected,
            ]}>{goal.label}</Text>
            {formData.goals.includes(goal.value) && (
              <View style={styles.goalCheck}>
                <Text style={styles.goalCheckText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderPersonalInfo();
      case 1: return renderBodyMetrics();
      case 2: return renderActivityLevel();
      case 3: return renderDietPreference();
      case 4: return renderGoals();
      default: return null;
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, color: colors.text.secondary }}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Profile</Text>
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
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Health Condition Modal */}
      <Modal
        visible={showHealthModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHealthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🩺 Health Conditions</Text>
            <Text style={styles.modalSubtitle}>Add any health conditions for personalized diet</Text>

            {/* Custom input */}
            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                placeholder="Type a health condition..."
                placeholderTextColor={colors.text.secondary}
                value={customHealthInput}
                onChangeText={setCustomHealthInput}
                onSubmitEditing={addCustomHealthCondition}
              />
              <TouchableOpacity
                style={styles.modalAddBtn}
                onPress={addCustomHealthCondition}
              >
                <Text style={styles.modalAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Selected conditions */}
            {formData.healthConditions.length > 0 && (
              <View style={styles.modalSelectedSection}>
                <Text style={styles.modalSectionLabel}>Selected:</Text>
                <View style={styles.modalChipRow}>
                  {formData.healthConditions.map((cond) => (
                    <View key={cond} style={styles.modalChipSelected}>
                      <Text style={styles.modalChipSelectedText}>{cond.replace(/_/g, ' ')}</Text>
                      <TouchableOpacity onPress={() => removeHealthCondition(cond)}>
                        <Text style={styles.modalChipRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Example suggestions */}
            <Text style={styles.modalSectionLabel}>Common conditions (tap to add):</Text>
            <View style={styles.modalChipRow}>
              {healthConditionExamples
                .filter(ex => !formData.healthConditions.includes(ex.value))
                .map((ex) => (
                  <TouchableOpacity
                    key={ex.value}
                    style={styles.modalChipExample}
                    onPress={() => addHealthCondition(ex.value)}
                  >
                    <Text style={styles.modalChipExampleText}>{ex.icon} {ex.label}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Done button */}
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowHealthModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: colors.success,
  },
  stepIcon: {
    fontSize: 16,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: colors.border,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  stepContent: {
    flex: 1,
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
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  optionLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  bmiCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  bmiLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  bmiValue: {
    ...typography.h1,
    color: colors.primary,
  },
  bmiCategory: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activityCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  activityIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  activityLabelSelected: {
    color: colors.primary,
  },
  activityDesc: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  checkIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.text.inverse,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  goalLabel: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
  goalLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  goalCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCheckText: {
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  footer: {
    padding: spacing.lg,
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
    backgroundColor: colors.primary + '80',
  },
  nextButtonText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  // Health condition button
  healthConditionBtn: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm, ...shadows.sm,
  },
  healthConditionBtnIcon: { fontSize: 24, marginRight: spacing.sm },
  healthConditionBtnText: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  healthConditionBtnHint: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  chipRemove: { color: colors.primary, fontWeight: '700', fontSize: 14, marginLeft: 6 },
  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl || 20,
    borderTopRightRadius: borderRadius.xl || 20, padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.md },
  modalInputRow: { flexDirection: 'row', marginBottom: spacing.md },
  modalInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body,
    color: colors.text.primary, backgroundColor: colors.background,
  },
  modalAddBtn: {
    marginLeft: spacing.sm, backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  modalAddBtnText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  modalSelectedSection: { marginBottom: spacing.md },
  modalSectionLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.sm },
  modalChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  modalChipSelected: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full || 20, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.primary,
  },
  modalChipSelectedText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  modalChipRemove: { color: colors.primary, fontWeight: '700', fontSize: 14, marginLeft: 6 },
  modalChipExample: {
    backgroundColor: colors.background, borderRadius: borderRadius.full || 20,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.border,
  },
  modalChipExampleText: { ...typography.bodySmall, color: colors.text.primary },
  modalDoneBtn: {
    backgroundColor: colors.primary, padding: spacing.md,
    borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.lg,
  },
  modalDoneBtnText: { ...typography.body, color: colors.text.inverse, fontWeight: '700' },
});

export default NutritionProfileSetupScreen;

