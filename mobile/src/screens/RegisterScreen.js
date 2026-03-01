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

  // Password criteria validation
  const password = formData.password;
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const allCriteriaMet = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleRegister = async () => {
    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!allCriteriaMet) {
      Alert.alert('Error', 'Please ensure your password meets all the criteria listed below the password field');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      await dispatch(register(registrationData)).unwrap();
      // Navigation handled automatically after registration
    } catch (err) {
      const errorMessage = err || 'Something went wrong';
      // Check if the error is about existing email
      if (errorMessage.toLowerCase().includes('already registered') || errorMessage.toLowerCase().includes('already exist')) {
        Alert.alert(
          'Already Registered',
          'You are already registered. Please login. If you forgot your password, please reset your password.',
          [
            { text: 'Login', onPress: () => navigation.navigate('Login') },
            { text: 'Reset Password', onPress: () => navigation.navigate('ForgotPassword') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Registration Failed', errorMessage);
      }
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
              placeholder="Create a strong password"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry
              autoCapitalize="none"
            />
            {/* Password Criteria Checklist */}
            {password.length > 0 && (
              <View style={styles.criteriaBox}>
                <Text style={styles.criteriaTitle}>Password Requirements:</Text>
                <View style={styles.criteriaRow}>
                  <Text style={styles.criteriaIcon}>{hasMinLength ? '✅' : '⬜'}</Text>
                  <Text style={[styles.criteriaText, hasMinLength && styles.criteriaMet]}>At least 8 characters</Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Text style={styles.criteriaIcon}>{hasUppercase ? '✅' : '⬜'}</Text>
                  <Text style={[styles.criteriaText, hasUppercase && styles.criteriaMet]}>One uppercase letter (A-Z)</Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Text style={styles.criteriaIcon}>{hasLowercase ? '✅' : '⬜'}</Text>
                  <Text style={[styles.criteriaText, hasLowercase && styles.criteriaMet]}>One lowercase letter (a-z)</Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Text style={styles.criteriaIcon}>{hasNumber ? '✅' : '⬜'}</Text>
                  <Text style={[styles.criteriaText, hasNumber && styles.criteriaMet]}>One number (0-9)</Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Text style={styles.criteriaIcon}>{hasSpecial ? '✅' : '⬜'}</Text>
                  <Text style={[styles.criteriaText, hasSpecial && styles.criteriaMet]}>One special character (!@#$%...)</Text>
                </View>
              </View>
            )}
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
            {formData.confirmPassword.length > 0 && (
              <Text style={[
                styles.matchText,
                formData.password === formData.confirmPassword ? styles.matchSuccess : styles.matchError
              ]}>
                {formData.password === formData.confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
              </Text>
            )}
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
  criteriaBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  criteriaTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  criteriaIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  criteriaText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontSize: 12,
  },
  criteriaMet: {
    color: '#2E7D32',
  },
  matchText: {
    ...typography.bodySmall,
    marginTop: 4,
    fontSize: 12,
  },
  matchSuccess: {
    color: '#2E7D32',
  },
  matchError: {
    color: '#D32F2F',
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

