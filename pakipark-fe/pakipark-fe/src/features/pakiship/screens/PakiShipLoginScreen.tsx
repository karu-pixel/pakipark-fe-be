import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather } from '@expo/vector-icons';

const COLORS = {
  background: '#DBF0EF',
  border: '#D7ECE8',
  card: '#FFFFFF',
  dark: '#021B1A',
  inputBackground: '#EFF8F7',
  inputIcon: '#A6D9D4',
  muted: '#8D95B2',
  primary: '#39B5A8',
  white: '#FFFFFF',
} as const;

type PakiShipLoginScreenProps = {
  onBack: () => void;
  onNavigateToCreateAccount: () => void;
};

export function PakiShipLoginScreen({
  onBack,
  onNavigateToCreateAccount,
}: PakiShipLoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isResetModalVisible, setResetModalVisible] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');

  const handleContinue = () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter your email or mobile number and password to continue.');
      return;
    }

    Alert.alert('PakiShip branch ready', 'This PakiShip login path is now connected from the shared PakiApps launcher.');
  };

  const handleOpenReset = () => {
    setResetIdentifier(identifier.trim());
    setResetModalVisible(true);
  };

  const handleResetPassword = () => {
    if (!resetIdentifier.trim()) {
      Alert.alert('Reset password', 'Enter your email or mobile number to continue.');
      return;
    }

    setResetModalVisible(false);
    Alert.alert('Reset link sent', `PakiShip reset instructions were prepared for ${resetIdentifier.trim()}.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onBack} style={styles.backButton}>
          <AntDesign color={COLORS.primary} name="left" size={18} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroBlock}>
            <Text style={styles.heroTitleDark}>Hatid Agad,</Text>
            <Text style={styles.heroTitlePrimary}>Walang Abala.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log In</Text>
            <Text style={styles.cardSubtitle}>
              Welcome back! Log in to manage your shipments.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Email or Mobile Number</Text>
              <View style={styles.inputRow}>
                <Feather color={COLORS.inputIcon} name="mail" size={18} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                  onChangeText={setIdentifier}
                  placeholder="customer@pakiship.com"
                  placeholderTextColor="#C5CBDC"
                  style={styles.textInput}
                  value={identifier}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputRow}>
                <Feather color={COLORS.inputIcon} name="lock" size={18} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setPassword}
                  placeholder="********"
                  placeholderTextColor="#C5CBDC"
                  secureTextEntry={secureTextEntry}
                  style={styles.textInput}
                  value={password}
                />
                <Pressable hitSlop={8} onPress={() => setSecureTextEntry((current) => !current)}>
                  <Feather
                    color="#CDD2DF"
                    name={secureTextEntry ? 'eye' : 'eye-off'}
                    size={18}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.rememberRow}>
              <Pressable onPress={() => setRememberMe((current) => !current)} style={styles.rememberLeft}>
                <View style={[styles.checkbox, rememberMe ? styles.checkboxChecked : null]}>
                  {rememberMe ? <Feather color={COLORS.white} name="check" size={12} /> : null}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </Pressable>

              <Pressable onPress={handleOpenReset}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>

            <Pressable onPress={handleContinue} style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>

            <View style={styles.createRow}>
              <Text style={styles.createText}>New to PakiSHIP? </Text>
              <Pressable onPress={onNavigateToCreateAccount}>
                <Text style={styles.createLink}>Create Account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
        transparent={true}
        visible={isResetModalVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setResetModalVisible(false)}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.modalSheet}>
              <Pressable
                hitSlop={8}
                onPress={() => setResetModalVisible(false)}
                style={styles.modalClose}
              >
                <AntDesign color="#A5AEC6" name="close" size={20} />
              </Pressable>

              <View style={styles.modalIconBox}>
                <Feather color={COLORS.primary} name="lock" size={24} />
              </View>

              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalSubtitle}>
                Enter your details to receive a reset link.
              </Text>

              <View style={styles.modalInputShell}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setResetIdentifier}
                  placeholder="Email or Mobile"
                  placeholderTextColor="#B1DCD6"
                  style={styles.modalInput}
                  value={resetIdentifier}
                />
              </View>

              <Pressable onPress={handleResetPassword} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  headerBar: {
    height: 52,
    paddingHorizontal: 18,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 32,
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heroTitleDark: {
    color: COLORS.dark,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 48,
    textAlign: 'center',
  },
  heroTitlePrimary: {
    color: COLORS.primary,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 48,
    textAlign: 'center',
  },
  card: {
    borderRadius: 36,
    backgroundColor: COLORS.card,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: '#F3F3F3',
    shadowColor: '#052A27',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 5,
  },
  cardTitle: {
    color: COLORS.dark,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 14,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingLeft: 4,
  },
  inputRow: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 12,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 22,
    gap: 12,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D8DCE7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberText: {
    color: '#5C6783',
    fontSize: 13,
    fontWeight: '500',
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  continueButton: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark,
    shadowColor: '#021B1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  createRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 4,
  },
  createText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  createLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(4,22,20,0.55)',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 40,
  },
  modalClose: {
    position: 'absolute',
    top: 22,
    right: 22,
    zIndex: 1,
    padding: 6,
  },
  modalIconBox: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#F1FAF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.dark,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalInputShell: {
    minHeight: 58,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 18,
    justifyContent: 'center',
    marginBottom: 18,
  },
  modalInput: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 12,
  },
  resetButton: {
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9EE0D3',
  },
  resetButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
});
