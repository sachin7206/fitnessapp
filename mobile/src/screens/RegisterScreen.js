import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
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
import { useTranslation } from '../i18n';

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
  const { t } = useTranslation();
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

  const [validationError, setValidationError] = useState('');

  const handleRegister = async () => {
    setValidationError('');

    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      const msg = t('auth.fillRequired');
      setValidationError(msg);
      if (Platform.OS !== 'web') Alert.alert(t('common.error'), msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      const msg = t('auth.validEmail');
      setValidationError(msg);
      if (Platform.OS !== 'web') Alert.alert(t('common.error'), msg);
      return;
    }

    if (!allCriteriaMet) {
      const msg = t('auth.passwordCriteria');
      setValidationError(msg);
      if (Platform.OS !== 'web') Alert.alert(t('common.error'), msg);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      const msg = t('auth.passwordsNoMatch');
      setValidationError(msg);
      if (Platform.OS !== 'web') Alert.alert(t('common.error'), msg);
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      await dispatch(register(registrationData)).unwrap();
      // Navigation handled automatically after registration
    } catch (err) {
      const errorMessage = err || t('common.error');
      // Check if the error is about existing email
      if (typeof errorMessage === 'string' && (errorMessage.toLowerCase().includes('already registered') || errorMessage.toLowerCase().includes('already exist'))) {
        const msg = t('auth.alreadyRegistered');
        setValidationError(msg);
        if (Platform.OS !== 'web') {
          Alert.alert(t('auth.alreadyRegisteredTitle'), msg, [
            { text: t('auth.login'), onPress: () => navigation.navigate('Login') },
            { text: t('auth.resetPassword'), onPress: () => navigation.navigate('ForgotPassword') },
            { text: t('common.cancel'), style: 'cancel' },
          ]);
        }
      } else {
        const msg = typeof errorMessage === 'string' ? errorMessage : t('auth.registrationFailed');
        setValidationError(msg);
        if (Platform.OS !== 'web') Alert.alert(t('auth.registrationFailed'), msg);
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
          <Text style={styles.title}>{t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('auth.getStarted')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>{t('auth.firstName')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.firstName')}
                value={formData.firstName}
                onChangeText={(text) => updateFormData('firstName', text)}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>{t('auth.lastName')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.lastName')}
                value={formData.lastName}
                onChangeText={(text) => updateFormData('lastName', text)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.email')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.enterEmail')}
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('profile.phone')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('profile.enterPhone')}
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.password')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.enterPassword')}
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry
              autoCapitalize="none"
            />
            {/* Password Criteria Checklist */}
            {password.length > 0 && (
              <View style={styles.criteriaBox}>
                <Text style={styles.criteriaTitle}>{t('auth.passwordMustHave')}</Text>
                <View style={styles.criteriaRow}>
                  <Text style={styles.criteriaIcon}>{hasMinLength ? '✅' : '⬜'}</Text>
                  <Text style={[styles.criteriaText, hasMinLength && styles.criteriaMet]}>{t('auth.minLength')}</Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Text style={styles.criteriaIcon}>{hasUppercase ? '✅' : '⬜'}</Text>
                  <Text style={[styles.criteriaText, hasUppercase && styles.criteriaMet]}>{t('auth.uppercaseLetter')}</Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Text style={styles.criteriaIcon}>{hasLowercase ? '✅' : '⬜'}</Text>
                  <Text style={[styles.criteriaText, hasLowercase && styles.criteriaMet]}>{t('auth.lowercaseLetter')}</Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Text style={styles.criteriaIcon}>{hasNumber ? '✅' : '⬜'}</Text>
                  <Text style={[styles.criteriaText, hasNumber && styles.criteriaMet]}>{t('auth.number')}</Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Text style={styles.criteriaIcon}>{hasSpecial ? '✅' : '⬜'}</Text>
                  <Text style={[styles.criteriaText, hasSpecial && styles.criteriaMet]}>{t('auth.specialCharacter')}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.confirmPassword')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.reenterYourPassword')}
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
                {formData.password === formData.confirmPassword ? `✅ ${t('auth.passwordsMatch')}` : `❌ ${t('auth.passwordsNoMatch')}`}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.preferredLanguage')}</Text>
            <CustomPicker
              label={t('auth.selectLanguage')}
              selectedValue={formData.language}
              onValueChange={(value) => updateFormData('language', value)}
              options={LANGUAGE_OPTIONS}
              placeholder={t('auth.selectLanguagePlaceholder')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.region')}</Text>
            <CustomPicker
              label={t('auth.selectRegion')}
              selectedValue={formData.region}
              onValueChange={(value) => updateFormData('region', value)}
              options={REGION_OPTIONS}
              placeholder={t('auth.selectRegionPlaceholder')}
            />
          </View>

          {validationError ? (
            <Text style={styles.validationError}>{validationError}</Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              isLoading && styles.buttonDisabled,
              Platform.OS === 'web' && { cursor: 'pointer' },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              handleRegister();
            }}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? `${t('auth.createAccount')}...` : t('auth.signUp')}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.hasAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>{t('auth.login')}</Text>
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
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  criteriaBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: '#166534',
  },
  matchText: {
    ...typography.bodySmall,
    marginTop: 4,
    fontSize: 12,
  },
  matchSuccess: {
    color: '#166534',
  },
  matchError: {
    color: '#EF4444',
  },
  customPickerButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderBottomColor: colors.border,
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
    borderBottomColor: colors.border,
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
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  validationError: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: '#FEF2F2',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
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

