import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  ScrollView,
  View,
} from 'react-native';

import { backendApi } from '../../../lib/api';
import { loginColors } from './LoginStyles';

type Step = 'identifier' | 'otp' | 'newPassword';

interface ForgotPasswordModalProps {
  visible: boolean;
  initialIdentifier?: string;
  onClose: () => void;
  onSuccess: () => void;
  // Legacy props kept for backwards-compatibility (no-ops now)
  value?: string;
  error?: string;
  onChangeText?: (value: string) => void;
  onSubmit?: () => void;
}

const RESEND_COOLDOWN = 60;

export function ForgotPasswordModal({
  visible,
  initialIdentifier = '',
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('identifier');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resetToken, setResetToken] = useState('');

  // Resend timer countdown
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      resetState();
    } else {
      setIdentifier(initialIdentifier);
    }
  }, [visible, initialIdentifier]);

  function resetState() {
    setStep('identifier');
    setIdentifier(initialIdentifier);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setLoading(false);
    setResendTimer(0);
    setResetToken('');
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function startResendTimer() {
    setResendTimer(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────────
  async function handleSendOtp() {
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Please enter your email or mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await backendApi.forgotPassword(trimmed);
      setStep('otp');
      setOtp('');
      startResendTimer();
    } catch (err: any) {
      // Always show generic success to prevent enumeration
      setStep('otp');
      setOtp('');
      startResendTimer();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      await backendApi.forgotPassword(identifier.trim());
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
      startResendTimer();
    }
  }

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────────
  async function handleVerifyOtp() {
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit code we sent you.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await backendApi.verifyResetOtp(identifier.trim(), code);
      setResetToken(result.resetToken);
      setStep('newPassword');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Reset Password ───────────────────────────────────────────────────
  async function handleResetPassword() {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await backendApi.resetPassword(resetToken, newPassword);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please start over.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step indicator label ─────────────────────────────────────────────────────
  const stepLabels: Record<Step, string> = {
    identifier: 'Reset Password',
    otp: 'Enter Verification Code',
    newPassword: 'Create New Password',
  };

  const stepSubtitles: Record<Step, string> = {
    identifier: "Enter your email or mobile number and we'll send you a verification code.",
    otp: `We sent a 6-digit code to ${identifier.trim() || 'your account'}.`,
    newPassword: 'Your identity is verified. Enter your new password below.',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Feather
                name={step === 'newPassword' ? 'check-circle' : step === 'otp' ? 'shield' : 'lock'}
                size={20}
                color={loginColors.accent}
              />
            </View>
            {step !== 'identifier' && (
              <Pressable
                onPress={() => {
                  setError('');
                  setStep(step === 'newPassword' ? 'otp' : 'identifier');
                }}
                style={styles.backBtn}
                hitSlop={8}
              >
                <Feather name="arrow-left" size={16} color="#9BAABD" />
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Feather name="x" size={16} color="#9BAABD" />
            </Pressable>
          </View>

          {/* Step indicator dots */}
          <View style={styles.stepsRow}>
            {(['identifier', 'otp', 'newPassword'] as Step[]).map((s, i) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  step === s
                    ? styles.stepDotActive
                    : ['identifier', 'otp', 'newPassword'].indexOf(step) > i
                      ? styles.stepDotDone
                      : styles.stepDotPending,
                ]}
              />
            ))}
          </View>

          {/* Title & subtitle */}
          <View style={styles.copyBlock}>
            <Text style={styles.title}>{stepLabels[step]}</Text>
            <Text style={styles.subtitle}>{stepSubtitles[step]}</Text>
          </View>

          {/* ── Step 1: Identifier input ── */}
          {step === 'identifier' && (
            <View style={styles.formBlock}>
              <TextInput
                value={identifier}
                onChangeText={(v) => { setIdentifier(v.trimStart()); setError(''); }}
                placeholder="Email or Mobile Number"
                placeholderTextColor="#C3CFDC"
                style={[styles.input, error ? styles.inputError : undefined]}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                editable={!loading}
              />
              {!!error && <Text style={styles.errorText}>{error}</Text>}
              <Pressable
                style={[styles.submitButton, loading && styles.submitDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                    <Text style={styles.submitLabel}>SEND CODE</Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  </>
                }
              </Pressable>
            </View>
          )}

          {/* ── Step 2: OTP input ── */}
          {step === 'otp' && (
            <View style={styles.formBlock}>
              <View style={styles.infoHint}>
                <Feather name="mail" size={13} color="#2563EB" />
                <Text style={styles.infoHintText}>
                  We've sent a verification code to your email. Please check your inbox and enter the OTP to continue.
                </Text>
              </View>
              <TextInput
                value={otp}
                onChangeText={(v) => { setOtp(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="000000"
                placeholderTextColor="#C3CFDC"
                style={[styles.otpInput, { letterSpacing: otp ? 0 : 0 }, error ? styles.inputError : undefined]}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              {!!error && <Text style={styles.errorText}>{error}</Text>}
              <Pressable
                style={[styles.submitButton, loading && styles.submitDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                    <Text style={styles.submitLabel}>VERIFY CODE</Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  </>
                }
              </Pressable>
              <Text style={styles.resendText}>
                Didn't receive it?{' '}
                <Text
                  onPress={resendTimer === 0 && !loading ? handleResend : undefined}
                  style={resendTimer === 0 && !loading ? styles.resendLink : styles.resendDisabled}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </Text>
              </Text>
            </View>
          )}

          {/* ── Step 3: New password ── */}
          {step === 'newPassword' && (
            <View style={styles.formBlock}>
              <View style={[styles.pwRow, error ? styles.inputError : undefined]}>
                <TextInput
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setError(''); }}
                  placeholder="New Password (8+ chars)"
                  placeholderTextColor="#C3CFDC"
                  style={styles.pwInput}
                  secureTextEntry={!showNewPw}
                  editable={!loading}
                />
                <Pressable onPress={() => setShowNewPw((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                  <Feather name={showNewPw ? 'eye-off' : 'eye'} size={16} color="#9BAABD" />
                </Pressable>
              </View>
              <View style={[styles.pwRow, error ? styles.inputError : undefined]}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#C3CFDC"
                  style={styles.pwInput}
                  secureTextEntry={!showConfirmPw}
                  editable={!loading}
                />
                <Pressable onPress={() => setShowConfirmPw((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                  <Feather name={showConfirmPw ? 'eye-off' : 'eye'} size={16} color="#9BAABD" />
                </Pressable>
              </View>
              {!!error && <Text style={styles.errorText}>{error}</Text>}
              <Pressable
                style={[styles.submitButton, loading && styles.submitDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                    <Feather name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.submitLabel}>RESET PASSWORD</Text>
                  </>
                }
              </Pressable>
            </View>
          )}
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(189, 203, 220, 0.78)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    shadowColor: '#17324F',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: 6,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepDotActive: { backgroundColor: loginColors.accent },
  stepDotDone: { backgroundColor: '#10B981' },
  stepDotPending: { backgroundColor: '#E5E7EB' },
  copyBlock: {
    gap: 6,
  },
  title: {
    color: loginColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#7C90A5',
    fontSize: 12,
    lineHeight: 18,
  },
  formBlock: {
    gap: 12,
  },
  input: {
    minHeight: 44,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DCE4EE',
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 14,
    color: '#22324A',
    fontSize: 13,
    fontWeight: '600',
  },
  inputFlex: {
    flex: 1,
  },
  inputError: {
    borderColor: '#E37A7A',
  },
  otpInput: {
    minHeight: 56,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DCE4EE',
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 14,
    color: '#22324A',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  errorText: {
    marginTop: -4,
    color: '#D64545',
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: loginColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16304B',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  submitDisabled: {
    opacity: 0.65,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
  },
  resendText: {
    color: '#7C90A5',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  resendLink: {
    color: loginColors.accent,
    fontWeight: '800',
  },
  resendDisabled: {
    color: '#C3CFDC',
    fontWeight: '700',
  },
  infoHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoHintText: {
    flex: 1,
    color: '#1D4ED8',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  pwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DCE4EE',
    backgroundColor: '#F7F9FC',
    paddingRight: 12,
  },
  pwInput: {
    flex: 1,
    minHeight: 44,
    paddingLeft: 14,
    paddingRight: 8,
    color: '#22324A',
    fontSize: 13,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 4,
  },
});
