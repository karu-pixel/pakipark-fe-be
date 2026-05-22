import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { loginColors, loginShadows } from './LoginStyles';

interface OTPVerificationFormProps {
  identifier: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  onResend: () => void;
  canResend: boolean;
  resendTimer: number;
  error?: string;
}

export function OTPVerificationForm({
  identifier,
  otpCode,
  setOtpCode,
  onBack,
  onSubmit,
  onResend,
  canResend,
  resendTimer,
  error,
}: OTPVerificationFormProps) {
  return (
    <View style={[styles.root, loginShadows.card]} testID="otp-verification-form">
      <Pressable onPress={onBack} style={styles.backLink}>
        <Text style={styles.backLinkText}>{'<'} Back to Login</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>#</Text>
        </View>
        <Text style={styles.title}>Verification Required</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit security code to{' '}
          <Text style={styles.identifier}>{identifier}</Text>.
        </Text>
      </View>

      <TextInput
        value={otpCode}
        onChangeText={(value) => setOtpCode(value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        placeholderTextColor={loginColors.subtle}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.otpInput}
      />

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable style={[styles.primaryButton, loginShadows.button]} onPress={onSubmit}>
        <Text style={styles.primaryButtonText}>Verify Access</Text>
      </Pressable>

      <Text style={styles.resendText}>
        Didn't receive the code?{' '}
        <Text onPress={canResend ? onResend : undefined} style={canResend ? styles.resendLink : styles.resendDisabled}>
          {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: loginColors.surface,
    gap: 18,
  },
  backLink: {
    alignSelf: 'flex-start',
  },
  backLinkText: {
    color: loginColors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    gap: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: loginColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: loginColors.accent,
    fontSize: 24,
    fontWeight: '800',
  },
  title: {
    color: loginColors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: loginColors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  identifier: {
    color: loginColors.text,
    fontWeight: '800',
  },
  otpInput: {
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: loginColors.border,
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 8,
    color: loginColors.text,
  },
  errorText: {
    color: loginColors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: loginColors.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  resendText: {
    color: loginColors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  resendLink: {
    color: loginColors.accent,
    fontWeight: '800',
  },
  resendDisabled: {
    color: loginColors.subtle,
    fontWeight: '700',
  },
});
