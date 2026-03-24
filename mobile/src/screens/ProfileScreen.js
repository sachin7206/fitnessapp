import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, updateHealthMetrics, updateGoals, fetchProfile } from '../store/slices/userSlice';
import { logout, updateUser } from '../store/slices/authSlice';
import { clearTracking } from '../store/slices/mealTrackingSlice';
import { clearWorkoutTracking } from '../store/slices/workoutTrackingSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import { Picker } from '@react-native-picker/picker';
import { useTranslation, LANGUAGES } from '../i18n';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { profile, isLoading } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);
  const { t, setLocale, locale } = useTranslation();

  const handleLogout = () => {
    const doLogout = () => {
      dispatch(clearTracking());
      dispatch(clearWorkoutTracking());
      dispatch(logout());
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        doLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: doLogout },
        ]
      );
    }
  };

  const [activeTab, setActiveTab] = useState('personal');
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    phone: '',
    language: 'en',
    region: '',
  });

  const [healthData, setHealthData] = useState({
    height: '',
    currentWeight: '',
    targetWeight: '',
    activityLevel: 'MODERATE',
    healthConditions: [],
    dietaryPreferences: [],
  });

  const [selectedGoals, setSelectedGoals] = useState([]);

  useEffect(() => {
    // Only fetch profile if we don't already have user data
    // This prevents 403 errors right after registration
    if (!user && !profile) {
      dispatch(fetchProfile());
    }
  }, [user, profile]);

  useEffect(() => {
    if (profile || user) {
      const userData = profile || user;
      if (userData.profile) {
        setPersonalData({
          firstName: userData.profile.firstName || '',
          lastName: userData.profile.lastName || '',
          age: userData.profile.age?.toString() || '',
          gender: userData.profile.gender || '',
          phone: userData.profile.phone || '',
          language: userData.profile.language || 'en',
          region: userData.profile.region || '',
        });
        // Sync i18n locale with profile language
        if (userData.profile.language && userData.profile.language !== locale) {
          setLocale(userData.profile.language);
        }
      }
      if (userData.healthMetrics) {
        setHealthData({
          height: userData.healthMetrics.height?.toString() || '',
          currentWeight: userData.healthMetrics.currentWeight?.toString() || '',
          targetWeight: userData.healthMetrics.targetWeight?.toString() || '',
          activityLevel: userData.healthMetrics.activityLevel || 'MODERATE',
          healthConditions: userData.healthMetrics.healthConditions || [],
          dietaryPreferences: userData.healthMetrics.dietaryPreferences || [],
        });
      }
      setSelectedGoals(userData.goals || []);
    }
  }, [profile, user]);

  const handleSavePersonal = async () => {
    try {
      const dataToSave = {
        ...personalData,
        age: personalData.age ? parseInt(personalData.age) : null,
      };
      const result = await dispatch(updateProfile(dataToSave)).unwrap();
      // Also update auth user so NutritionProfileSetupScreen sees fresh data
      if (result) {
        dispatch(updateUser(result));
      }
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err || 'Failed to update profile');
    }
  };

  const handleSaveHealth = async () => {
    try {
      const dataToSave = {
        ...healthData,
        height: healthData.height ? parseFloat(healthData.height) : null,
        currentWeight: healthData.currentWeight ? parseFloat(healthData.currentWeight) : null,
        targetWeight: healthData.targetWeight ? parseFloat(healthData.targetWeight) : null,
      };
      const result = await dispatch(updateHealthMetrics(dataToSave)).unwrap();
      if (result) {
        dispatch(updateUser(result));
      }
      Alert.alert('Success', 'Health metrics updated successfully');
    } catch (err) {
      Alert.alert('Error', err || 'Failed to update health metrics');
    }
  };

  const goalOptions = [
    'WEIGHT_LOSS',
    'MUSCLE_GAIN',
    'GENERAL_FITNESS',
    'FLEXIBILITY',
    'ENDURANCE',
    'STRESS_RELIEF',
  ];

  const toggleGoal = (goal) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleSaveGoals = async () => {
    try {
      const result = await dispatch(updateGoals(selectedGoals)).unwrap();
      if (result) {
        dispatch(updateUser(result));
      }
      Alert.alert('Success', 'Goals updated successfully');
    } catch (err) {
      Alert.alert('Error', err || 'Failed to update goals');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            {t('profile.personalInfo')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'health' && styles.activeTab]}
          onPress={() => setActiveTab('health')}
        >
          <Text style={[styles.tabText, activeTab === 'health' && styles.activeTabText]}>
            {t('profile.healthMetrics')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'goals' && styles.activeTab]}
          onPress={() => setActiveTab('goals')}
        >
          <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>
            {t('profile.goals')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'personal' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={personalData.firstName}
                  onChangeText={(text) => setPersonalData({ ...personalData, firstName: text })}
                />
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={personalData.lastName}
                  onChangeText={(text) => setPersonalData({ ...personalData, lastName: text })}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={personalData.age}
                onChangeText={(text) => setPersonalData({ ...personalData, age: text })}
                keyboardType="numeric"
                placeholder="Enter your age"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={personalData.gender}
                  onValueChange={(value) => setPersonalData({ ...personalData, gender: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select gender" value="" />
                  <Picker.Item label="Male" value="MALE" />
                  <Picker.Item label="Female" value="FEMALE" />
                  <Picker.Item label="Other" value="OTHER" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={personalData.phone}
                onChangeText={(text) => setPersonalData({ ...personalData, phone: text })}
                keyboardType="phone-pad"
                placeholder="Enter your phone number"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('profile.language')}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={personalData.language}
                  onValueChange={(value) => {
                    setPersonalData({ ...personalData, language: value });
                    setLocale(value);
                  }}
                  style={styles.picker}
                >
                  {LANGUAGES.map(lang => (
                    <Picker.Item key={lang.code} label={`${lang.nativeName} (${lang.name})`} value={lang.code} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Region</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={personalData.region}
                  onValueChange={(value) => setPersonalData({ ...personalData, region: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select your region" value="" />
                  <Picker.Item label="North India" value="NORTH" />
                  <Picker.Item label="South India" value="SOUTH" />
                  <Picker.Item label="East India" value="EAST" />
                  <Picker.Item label="West India" value="WEST" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSavePersonal}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Save Personal Info</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'health' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Metrics</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={healthData.height}
                onChangeText={(text) => setHealthData({ ...healthData, height: text })}
                keyboardType="numeric"
                placeholder="e.g., 170"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Current Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={healthData.currentWeight}
                  onChangeText={(text) => setHealthData({ ...healthData, currentWeight: text })}
                  keyboardType="numeric"
                  placeholder="e.g., 75"
                />
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Target Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={healthData.targetWeight}
                  onChangeText={(text) => setHealthData({ ...healthData, targetWeight: text })}
                  keyboardType="numeric"
                  placeholder="e.g., 70"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Activity Level</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={healthData.activityLevel}
                  onValueChange={(value) => setHealthData({ ...healthData, activityLevel: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Sedentary (Little or no exercise)" value="SEDENTARY" />
                  <Picker.Item label="Light (Exercise 1-3 days/week)" value="LIGHT" />
                  <Picker.Item label="Moderate (Exercise 3-5 days/week)" value="MODERATE" />
                  <Picker.Item label="Active (Exercise 6-7 days/week)" value="ACTIVE" />
                  <Picker.Item label="Very Active (Intense exercise daily)" value="VERY_ACTIVE" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSaveHealth}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Save Health Metrics</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'goals' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Goals</Text>
            <Text style={styles.description}>Select your fitness goals (you can choose multiple)</Text>

            <View style={styles.goalsContainer}>
              {goalOptions.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalChip,
                    selectedGoals.includes(goal) && styles.goalChipSelected,
                  ]}
                  onPress={() => toggleGoal(goal)}
                >
                  <Text
                    style={[
                      styles.goalChipText,
                      selectedGoals.includes(goal) && styles.goalChipTextSelected,
                    ]}
                  >
                    {goal.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSaveGoals}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Save Goals</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...shadows.sm,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...shadows.sm,
  },
  picker: {
    height: 50,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  goalChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    margin: spacing.xs,
    borderWidth: 1,
    borderColor: colors.text.light,
  },
  goalChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goalChipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  goalChipTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
    marginTop: spacing.md,
  },
  buttonText: {
    ...typography.button,
    color: colors.text.inverse,
  },
  logoutSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.text.inverse,
    fontWeight: '600',
  },
});

export default ProfileScreen;

