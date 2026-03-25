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
      Alert.alert('Error', 'Please enter the 6-digit OTP from your email');
      return;
    }

    if (!allCriteriaMet) {
      Alert.alert('Error', 'Please ensure your password meets all the criteria');
      return;
    }

    if (!passwordsMatch) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(otp, newPassword);
      Alert.alert(
        'Password Reset Successful! 🎉',
        'Your password has been updated. Please login with your new password.',
        [
          {
            text: 'Go to Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Email not found. Please go back and try again.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      Alert.alert('OTP Resent! ✉️', 'A new OTP has been sent to your email.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the OTP sent to {email || 'your email'} and create a new password.
          </Text>
        </View>

        <View style={styles.form}>
          {/* OTP Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
              <Text style={styles.resendText}>Didn't receive OTP? Resend</Text>
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Create new password"
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
              <Text style={styles.criteriaTitle}>Password must have:</Text>
              <PasswordCriteria met={hasMinLength} text="At least 8 characters" />
              <PasswordCriteria met={hasUppercase} text="At least one uppercase letter (A-Z)" />
              <PasswordCriteria met={hasLowercase} text="At least one lowercase letter (a-z)" />
              <PasswordCriteria met={hasNumber} text="At least one number (0-9)" />
              <PasswordCriteria met={hasSpecial} text="At least one special character (!@#$%...)" />
            </View>
          )}

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            {confirmPassword.length > 0 && (
              <Text style={[styles.matchText, passwordsMatch ? styles.matchSuccess : styles.matchError]}>
                {passwordsMatch ? '✅ Passwords match' : '❌ Passwords do not match'}
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
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>← Back to Login</Text>
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

