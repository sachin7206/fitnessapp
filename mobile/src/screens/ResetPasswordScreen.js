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
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import authService from '../services/authService';
import { useTranslation } from '../i18n';

const PasswordCriteria = ({ met, text }) => (
  <View style={styles.criteriaRow}>
    <Text style={[styles.criteriaIcon, met && styles.criteriaMet]}>
      {met ? '✅' : '⬜'}
    </Text>
    <Text style={[styles.criteriaText, met && styles.criteriaTextMet]}>
      {text}
    </Text>
  </View>
);

const ResetPasswordScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const email = route.params?.email || '';
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const allCriteriaMet = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleResetPassword = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert(t('common.error'), t('auth.enterOtpError'));
      return;
    }

    if (!allCriteriaMet) {
      Alert.alert(t('common.error'), t('auth.passwordCriteriaError'));
      return;
    }

    if (!passwordsMatch) {
      Alert.alert(t('common.error'), t('auth.passwordsDontMatch'));
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(otp, newPassword);
      Alert.alert(
        t('auth.resetSuccessTitle') + ' 🎉',
        t('auth.resetSuccessMsg'),
        [
          {
            text: t('auth.goToLogin'),
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      const message = error.response?.data?.message || t('auth.failedResetPassword');
      Alert.alert(t('common.error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.emailNotFound'));
      return;
    }
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      Alert.alert(t('auth.otpResent'), t('auth.otpResentMsg'));
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.failedResendOtp'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>{t('auth.resetPassword')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.enterResetCode')}
          </Text>
        </View>

        <View style={styles.form}>
          {/* OTP Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.resetCode')}</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder={t('auth.enterOtp')}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
              <Text style={styles.resendText}>{t('auth.resendCode')}</Text>
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.newPassword')}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('auth.createNewPassword')}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Criteria */}
          {newPassword.length > 0 && (
            <View style={styles.criteriaContainer}>
              <Text style={styles.criteriaTitle}>{t('auth.passwordMustHave')}</Text>
              <PasswordCriteria met={hasMinLength} text={t('auth.minLength')} />
              <PasswordCriteria met={hasUppercase} text={t('auth.uppercaseLetter')} />
              <PasswordCriteria met={hasLowercase} text={t('auth.lowercaseLetter')} />
              <PasswordCriteria met={hasNumber} text={t('auth.number')} />
              <PasswordCriteria met={hasSpecial} text={t('auth.specialCharacter')} />
            </View>
          )}

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.confirmNewPassword')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.reenterPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            {confirmPassword.length > 0 && (
              <Text style={[styles.matchText, passwordsMatch ? styles.matchSuccess : styles.matchError]}>
                {passwordsMatch ? `✅ ${t('auth.passwordsMatch')}` : `❌ ${t('auth.passwordsNoMatch')}`}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, (!allCriteriaMet || !passwordsMatch || isLoading) && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={!allCriteriaMet || !passwordsMatch || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.resetPassword')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>{t('auth.backToLogin')}</Text>
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
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 50,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.md,
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
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
    fontWeight: '700',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  resendText: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  criteriaContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  criteriaTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  criteriaIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  criteriaMet: {},
  criteriaText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  criteriaTextMet: {
    color: '#166534',
  },
  matchText: {
    ...typography.bodySmall,
    marginTop: 4,
  },
  matchSuccess: {
    color: '#166534',
  },
  matchError: {
    color: '#EF4444',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.button,
    color: colors.text.inverse,
  },
  footer: {
    alignItems: 'center',
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;

