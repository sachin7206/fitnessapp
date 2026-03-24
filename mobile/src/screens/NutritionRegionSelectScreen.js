import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import nutritionService from '../services/nutritionService';

const NutritionRegionSelectScreen = ({ navigation }) => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mealFrequency, setMealFrequency] = useState('4_MEALS');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadSavedRegion = async () => {
      try {
        const saved = await nutritionService.getFoodPreferences();
        if (saved && saved.region) {
          setSelectedRegion(saved.region);
        }
      } catch (error) {
        // No saved preferences, keep defaults
      } finally {
        setInitialLoading(false);
      }
    };
    loadSavedRegion();
  }, []);

  const regions = [
    {
      value: 'NORTH',
      label: 'North India',
      icon: '🫓',
      description: 'Rotis, Parathas, Dal, Paneer dishes',
      states: 'Punjab, Delhi, UP, Rajasthan, Haryana',
      color: '#374151',
    },
    {
      value: 'SOUTH',
      label: 'South India',
      icon: '🥘',
      description: 'Idli, Dosa, Sambar, Rice-based meals',
      states: 'Tamil Nadu, Kerala, Karnataka, Andhra',
      color: '#6B7280',
    },
    {
      value: 'EAST',
      label: 'East India',
      icon: '🍚',
      description: 'Bengali cuisine, Fish curries, Sweets',
      states: 'West Bengal, Odisha, Bihar, Jharkhand',
      color: '#6B7280',
    },
    {
      value: 'WEST',
      label: 'West India',
      icon: '🥙',
      description: 'Gujarati, Maharashtrian, Dhokla, Vada Pav',
      states: 'Gujarat, Maharashtra, Goa',
      color: '#9CA3AF',
    },
    {
      value: 'PAN_INDIA',
      label: 'Mix of All',
      icon: '🇮🇳',
      description: 'Best dishes from all regions',
      states: 'Variety from across India',
      color: '#D1D5DB',
    },
  ];

  const mealFrequencies = [
    { value: '3_MEALS', label: '3 Meals', desc: 'Breakfast, Lunch, Dinner' },
    { value: '4_MEALS', label: '4 Meals', desc: '+ Evening Snack' },
    { value: '5_MEALS', label: '5 Meals', desc: '+ Morning Snack' },
    { value: '6_MEALS', label: '6 Meals', desc: '+ Pre/Post Workout' },
  ];

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedRegion) {
      showAlert('Select Region', 'Please select your preferred regional cuisine');
      return;
    }

    // Navigate to food preferences screen with region
    navigation.navigate('FoodPreferences', { region: selectedRegion });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Cuisine</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>🍽️ Select Your Regional Preference</Text>
          <Text style={styles.introText}>
            We'll create a personalized diet plan featuring authentic dishes from your preferred region,
            customized to your health goals and dietary preferences.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Regional Cuisine</Text>

        {regions.map((region) => (
          <TouchableOpacity
            key={region.value}
            style={[
              styles.regionCard,
              selectedRegion === region.value && styles.regionCardSelected,
              { borderLeftColor: region.color },
            ]}
            onPress={() => setSelectedRegion(region.value)}
          >
            <View style={[styles.regionIconContainer, { backgroundColor: region.color + '20' }]}>
              <Text style={styles.regionIcon}>{region.icon}</Text>
            </View>
            <View style={styles.regionInfo}>
              <Text style={[
                styles.regionLabel,
                selectedRegion === region.value && styles.regionLabelSelected,
              ]}>{region.label}</Text>
              <Text style={styles.regionDesc}>{region.description}</Text>
              <Text style={styles.regionStates}>{region.states}</Text>
            </View>
            {selectedRegion === region.value && (
              <View style={[styles.checkCircle, { backgroundColor: region.color }]}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            After selecting your region, you'll customize your food preferences, meal count,
            and supplement options for a truly personalized diet plan.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGeneratePlan}
          disabled={loading || !selectedRegion}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.text.inverse} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>
              Next: Food Preferences →
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  introSection: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  introTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  introText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  regionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  regionCardSelected: {
    backgroundColor: colors.primary + '08',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  regionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  regionIcon: {
    fontSize: 28,
  },
  regionInfo: {
    flex: 1,
  },
  regionLabel: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  regionLabelSelected: {
    color: colors.primary,
  },
  regionDesc: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  regionStates: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 16,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  frequencyCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  frequencyCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  frequencyLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  frequencyLabelSelected: {
    color: colors.primary,
  },
  frequencyDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.info + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  generateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: colors.primary + '60',
  },
  generateButtonText: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.inverse,
    marginLeft: spacing.sm,
  },
});

export default NutritionRegionSelectScreen;

