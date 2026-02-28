import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';

// Custom Picker Component for better iOS/Android support
const CustomPicker = ({ label, selectedValue, onValueChange, options, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder || 'Select...';

  return (
    <>
      <TouchableOpacity
        style={styles.customPickerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.customPickerText,
          !selectedOption && styles.customPickerPlaceholder
        ]}>
          {displayText}
        </Text>
        <Text style={styles.customPickerArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedValue === item.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedValue === item.value && styles.modalOptionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {selectedValue === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'हिंदी (Hindi)', value: 'hi' },
  { label: 'தமிழ் (Tamil)', value: 'ta' },
  { label: 'తెలుగు (Telugu)', value: 'te' },
  { label: 'मराठी (Marathi)', value: 'mr' },
  { label: 'ગુજરાતી (Gujarati)', value: 'gu' },
];

const REGION_OPTIONS = [
  { label: 'Select your region', value: '' },
  { label: 'North India', value: 'NORTH' },
  { label: 'South India', value: 'SOUTH' },
  { label: 'East India', value: 'EAST' },
  { label: 'West India', value: 'WEST' },
];

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    language: 'en',
    region: '',
  });

  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);

  const handleRegister = async () => {
    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      await dispatch(register(registrationData)).unwrap();
      // Navigation handled automatically after registration
    } catch (err) {
      Alert.alert('Registration Failed', err || 'Something went wrong');
    }
  };

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your personalized fitness journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="First name"
                value={formData.firstName}
                onChangeText={(text) => updateFormData('firstName', text)}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Last name"
                value={formData.lastName}
                onChangeText={(text) => updateFormData('lastName', text)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password (min 6 characters)"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preferred Language</Text>
            <CustomPicker
              label="Select Language"
              selectedValue={formData.language}
              onValueChange={(value) => updateFormData('language', value)}
              options={LANGUAGE_OPTIONS}
              placeholder="Select language"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Region</Text>
            <CustomPicker
              label="Select Region"
              selectedValue={formData.region}
              onValueChange={(value) => updateFormData('region', value)}
              options={REGION_OPTIONS}
              placeholder="Select your region"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
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
  customPickerButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  customPickerText: {
    ...typography.body,
    color: colors.text.primary,
  },
  customPickerPlaceholder: {
    color: colors.text.secondary,
  },
  customPickerArrow: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalClose: {
    fontSize: 20,
    color: colors.text.secondary,
    padding: spacing.sm,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: colors.primary + '15',
  },
  modalOptionText: {
    ...typography.body,
    color: colors.text.primary,
  },
  modalOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: colors.text.inverse,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;

