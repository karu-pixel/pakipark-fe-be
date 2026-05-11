import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { loginColors, loginShadows } from './LoginStyles';

interface LoginFormMainProps {
  formData: { identifier: string; password: string };
  setFormData: Dispatch<SetStateAction<{ identifier: string; password: string }>>;
  errors: { identifier: string; password: string };
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  isEmail: boolean;
  keepLoggedIn: boolean;
  setKeepLoggedIn: Dispatch<SetStateAction<boolean>>;
  onSubmit: () => void;
  onForgotPassword: () => void;
  onSocialClick: (provider: string) => void;
  handleIdentifierChange: (value: string) => void;
  onCreateAccount: () => void;
}

const socialProviders = [
  {
    label: 'Google',
    logo: require('../../../../assets/images/google.png'),
  },
  {
    label: 'Facebook',
    logo: require('../../../../assets/images/facebook.png'),
  },
  {
    label: 'PakiShip',
    logo: require('../../../../assets/images/pakiship.png'),
  },
];

export function LoginFormMain({
  formData,
  setFormData,
  errors,
  showPassword,
  setShowPassword,
  isEmail,
  keepLoggedIn,
  setKeepLoggedIn,
  onSubmit,
  onForgotPassword,
  onSocialClick,
  handleIdentifierChange,
  onCreateAccount,
}: LoginFormMainProps) {
  const [focusedField, setFocusedField] = useState<'identifier' | 'password' | null>(null);

  return (
    <View style={styles.root} testID="login-form-main">
      <View style={styles.headingBlock}>
        <Text style={styles.heading}>Log In</Text>
        <Text style={styles.headingCopy}>Welcome back! Enter your details to continue.</Text>
      </View>

      {!!(errors.identifier || errors.password) && (
        <View style={styles.alertBox}>
          <Text style={styles.alertIcon}>!</Text>
          <Text style={styles.alertText}>Please check your inputs.</Text>
        </View>
      )}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email or Mobile Number</Text>
        <View style={styles.inputRow}>
          {!isEmail && (
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>+63</Text>
            </View>
          )}
          <View style={[styles.inputShell, focusedField === 'identifier' ? styles.inputShellFocused : undefined]}>
            <Feather
              name={isEmail ? 'mail' : 'phone'}
              size={14}
              color={focusedField === 'identifier' ? loginColors.accent : '#B2C0CF'}
            />
            <TextInput
              value={formData.identifier}
              onChangeText={handleIdentifierChange}
              onFocus={() => setFocusedField('identifier')}
              onBlur={() => setFocusedField(null)}
              placeholder={isEmail ? 'customer@pakipark.ph' : '912 345 6789'}
              placeholderTextColor={loginColors.subtle}
              keyboardType="default"
              autoCapitalize="none"
              style={[styles.input, errors.identifier ? styles.inputError : undefined]}
            />
          </View>
        </View>
        {!!errors.identifier && <Text style={styles.errorText}>{errors.identifier}</Text>}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={[styles.inputShell, focusedField === 'password' ? styles.inputShellFocused : undefined]}>
          <Feather name="shield" size={14} color={focusedField === 'password' ? loginColors.accent : '#B2C0CF'} />
          <TextInput
            value={formData.password}
            onChangeText={(password) => setFormData((prev) => ({ ...prev, password }))}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            placeholder="••••••••"
            placeholderTextColor={loginColors.subtle}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : undefined]}
          />
          <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={14}
              color={focusedField === 'password' ? loginColors.accent : '#B2C0CF'}
            />
          </Pressable>
        </View>
        {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View style={styles.optionsRow}> 
        <Pressable style={styles.checkboxRow} onPress={() => setKeepLoggedIn((prev) => !prev)}>
          <View style={[styles.checkbox, keepLoggedIn && styles.checkboxChecked]}>
            {keepLoggedIn && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
          <Text style={styles.switchLabel}>Keep me logged in</Text>
        </Pressable>
        <Pressable onPress={onForgotPassword}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.primaryButton, loginShadows.button]} onPress={onSubmit}>
        <Text style={styles.primaryButtonText}>Continue to Dashboard</Text>
      </Pressable>

      <View style={styles.socialBlock}>
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerLabel}>Or Connect With</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialGrid}>
          {socialProviders.map((provider) => (
            <Pressable
              key={provider.label}
              onPress={() => onSocialClick(provider.label)}
              style={styles.socialButton}
            >
              <Image source={provider.logo} style={styles.socialLogo} resizeMode="contain" />
            </Pressable>
          ))}
        </View>

        <Text style={styles.signupCopy}>
          New to PakiPark? <Text style={styles.signupLink} onPress={onCreateAccount}>Create Account</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: loginColors.surface,
    gap: 16,
  },
  headingBlock: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  heading: {
    color: loginColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  headingCopy: {
    color: '#7B8EA5',
    fontSize: 12,
    textAlign: 'center',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F7C7C7',
    backgroundColor: '#FFF3F3',
  },
  alertIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#FFFFFF',
    backgroundColor: loginColors.danger,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 18,
  },
  alertText: {
    color: loginColors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#8192A3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBox: {
    minWidth: 48,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: loginColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countryCodeText: {
    color: loginColors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  inputShell: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E1EB',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 14,
  },
  inputShellFocused: {
    borderColor: loginColors.accent,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    color: '#22324A',
    fontSize: 14,
    paddingVertical: 14,
  },
  passwordInput: {
    paddingRight: 4,
  },
  inputError: {
    color: loginColors.danger,
  },
  errorText: {
    color: loginColors.danger,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D9E1EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: loginColors.primary,
    borderColor: loginColors.primary,
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  switchLabel: {
    color: '#71859A',
    fontSize: 12,
    fontWeight: '700',
  },
  linkText: {
    color: loginColors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: loginColors.primary,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  socialBlock: {
    gap: 14,
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: loginColors.border,
  },
  dividerLabel: {
    color: loginColors.subtle,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: loginColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  socialLogo: {
    width: 24,
    height: 24,
  },
  signupCopy: {
    color: '#71859A',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 2,
  },
  signupLink: {
    color: loginColors.accent,
  },
});
