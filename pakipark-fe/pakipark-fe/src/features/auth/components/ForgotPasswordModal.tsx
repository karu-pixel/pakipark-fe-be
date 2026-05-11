import { Feather } from '@expo/vector-icons';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { loginColors } from './LoginStyles';

interface ForgotPasswordModalProps {
  visible: boolean;
  value: string;
  error?: string;
  onChangeText: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function ForgotPasswordModal({
  visible,
  value,
  error,
  onChangeText,
  onClose,
  onSubmit,
}: ForgotPasswordModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Feather name="lock" size={20} color={loginColors.accent} />
            </View>

            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Feather name="x" size={16} color="#9BAABD" />
            </Pressable>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email or mobile number and we&apos;ll send you instructions to reset your password.
            </Text>
          </View>

          <View style={styles.formBlock}>
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder="Email or Mobile Number"
              placeholderTextColor="#C3CFDC"
              style={[styles.input, error ? styles.inputError : undefined]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable style={styles.submitButton} onPress={onSubmit}>
              <Text style={styles.submitLabel}>SEND RESET LINK</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
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
    maxWidth: 340,
    alignSelf: 'center',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    shadowColor: '#17324F',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBlock: {
    gap: 8,
    marginBottom: 20,
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
  inputError: {
    borderColor: '#E37A7A',
  },
  errorText: {
    marginTop: -2,
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
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});
