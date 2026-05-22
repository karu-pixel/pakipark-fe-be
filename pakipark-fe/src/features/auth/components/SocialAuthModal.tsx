import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { backendApi } from '../../../lib/api';

const COLORS = {
  background: 'rgba(15,23,42,0.6)',
  card: '#FFFFFF',
  text: '#1E293B',
  subtle: '#64748B',
  pakiship: '#7ed8cfff',
  border: '#E2E8F0',
  inputBackground: '#F8FAFC',
};

type SocialAuthModalProps = {
  visible: boolean;
  provider: string;
  onClose: () => void;
  onSuccess: (role: 'customer' | 'admin' | 'partner') => void;
};

export function SocialAuthModal({
  visible,
  provider,
  onClose,
  onSuccess,
}: Readonly<SocialAuthModalProps>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const providerColor = COLORS.pakiship;
  const providerDisplayName = 'PakiShip';

  const handleSignIn = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (twoFactorRequired && !/^\d{6}$/.test(twoFactorCode.trim())) {
      Alert.alert('Invalid Code', 'Enter the 6-digit code from your authenticator app.');
      return;
    }

    setSubmitting(true);
    try {
      const trimmedEmail = email.trim();

      const user = await backendApi.login(
        trimmedEmail,
        password,
        twoFactorRequired ? twoFactorCode.trim() : undefined
      );

      if (user.two_factor_required) {
        setTwoFactorRequired(true);
        setTwoFactorCode('');
        return;
      }

      setTwoFactorRequired(false);

      onClose();
      setEmail('');
      setPassword('');
      setTwoFactorCode('');

      const rawRole = user.role || 'customer';
      const resolvedRole = rawRole === 'business_partner' ? 'partner' : rawRole;
      onSuccess(resolvedRole as any);
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'An unexpected error occurred. Please try again.');
      if (twoFactorRequired) {
        setTwoFactorCode('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setPassword('');
      setTwoFactorRequired(false);
      setTwoFactorCode('');
      onClose();
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../../../assets/images/pakiship.png')}
              style={{ width: 140, height: 40, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text style={styles.title}>Sign in with {providerDisplayName}</Text>
            <Text style={styles.subtitle}>
              Enter the email address linked to your {providerDisplayName} account to continue.
            </Text>
            <Pressable hitSlop={12} style={styles.closeButton} onPress={handleClose} disabled={isSubmitting}>
              <AntDesign name="close" size={20} color={COLORS.subtle} />
            </Pressable>
          </View>

          {/* Body */}
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={providerColor} />
              <Text style={styles.loadingText}>Authenticating…</Text>
            </View>
          ) : (
            <View style={styles.body}>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputShell}>
                  <Feather name="mail" size={16} color={COLORS.subtle} />
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor={COLORS.subtle}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputShell}>
                  <Feather name="shield" size={16} color={COLORS.subtle} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.subtle}
                    secureTextEntry
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              {twoFactorRequired && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>2FA Code</Text>
                  <View style={styles.inputShell}>
                    <Feather name="key" size={16} color={COLORS.subtle} />
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit code"
                      placeholderTextColor={COLORS.subtle}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      value={twoFactorCode}
                      onChangeText={setTwoFactorCode}
                    />
                  </View>
                </View>
              )}

              <Pressable
                style={[styles.submitButton, { backgroundColor: providerColor }]}
                onPress={handleSignIn}
              >
                <Text style={styles.submitButtonText}>{twoFactorRequired ? 'Verify & Sign In' : 'Sign In'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    width: '100%',
    maxWidth: 380,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.subtle,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.subtle,
    fontWeight: '600',
    textAlign: 'center',
  },
  body: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: COLORS.inputBackground,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 13,
  },
  submitButton: {
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
