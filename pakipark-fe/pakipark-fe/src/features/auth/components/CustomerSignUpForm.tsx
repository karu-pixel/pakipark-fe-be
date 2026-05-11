import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { loginColors, loginShadows } from './LoginStyles';
import { sharedFieldStyles, SignUpField } from './SignUpShared';
import { SocialSignUpButtons } from './SocialSignUpButtons';

interface CustomerSignUpFormProps {
  onSubmit: (payload: { name: string; identifier: string; password: string }) => void;
  onLoginPress: () => void;
  onSocialPress: (provider: string) => void;
  role: 'customer' | 'partner';
  onRoleChange: (role: 'customer' | 'partner') => void;
}

export function CustomerSignUpForm({
  onSubmit,
  onLoginPress,
  onSocialPress,
  role,
  onRoleChange,
}: CustomerSignUpFormProps) {
  const [focusedField, setFocusedField] = useState<'name' | 'identifier' | 'password' | 'confirm' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    password: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    identifier: '',
    password: '',
    confirm: '',
  });

  const isPhone = useMemo(() => /^\d/.test(formData.identifier), [formData.identifier]);

  const handleIdentifierChange = (value: string) => {
    if (/^\d+$/.test(value)) {
      setFormData((current) => ({ ...current, identifier: value.slice(0, 10) }));
      setErrors((current) => ({
        ...current,
        identifier: value.length > 0 && value.length < 10 ? 'Must be exactly 10 digits.' : '',
      }));
      return;
    }

    setFormData((current) => ({ ...current, identifier: value }));
    setErrors((current) => ({ ...current, identifier: '' }));
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required.';
    if (value.length < 8 || !/\d/.test(value) || !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return '8+ chars, 1 number & 1 special char required.';
    }
    return '';
  };

  const handleSubmit = () => {
    const nextErrors = { name: '', identifier: '', password: '', confirm: '' };

    if (!formData.name.trim()) {
      nextErrors.name = 'Full name is required.';
    }
    if (!formData.identifier.trim()) {
      nextErrors.identifier = 'Email or phone is required.';
    } else if (isPhone && formData.identifier.length !== 10) {
      nextErrors.identifier = 'Must be exactly 10 digits.';
    } else if (!isPhone && !/\S+@\S+\.\S+/.test(formData.identifier.trim())) {
      nextErrors.identifier = 'Enter a valid email address.';
    }

    nextErrors.password = validatePassword(formData.password);
    if (!formData.confirm.trim()) {
      nextErrors.confirm = 'Confirm your password.';
    } else if (formData.password !== formData.confirm) {
      nextErrors.confirm = "Passwords don't match.";
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      identifier: formData.identifier.trim(),
      password: formData.password,
    });
  };

  return (
    <View style={[styles.root, loginShadows.card]}>
      <View style={styles.headingBlock}>
        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.headingCopy}>Sign up to get started with PakiPark.</Text>
      </View>

      <View style={styles.segmentedControl}>
        <Pressable
          style={[styles.segmentButton, role === 'customer' ? styles.segmentButtonActive : undefined]}
          onPress={() => onRoleChange('customer')}
        >
          <Feather name="user" size={12} color={role === 'customer' ? '#FFFFFF' : '#97A8B9'} />
          <Text style={role === 'customer' ? styles.segmentActiveText : styles.segmentInactiveText}>Customer</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, role === 'partner' ? styles.segmentButtonActive : undefined]}
          onPress={() => onRoleChange('partner')}
        >
          <Feather name="users" size={12} color={role === 'partner' ? '#FFFFFF' : '#97A8B9'} />
          <Text style={role === 'partner' ? styles.segmentActiveText : styles.segmentInactiveText}>Partner</Text>
        </Pressable>
      </View>

      <SignUpField label="Full Name" error={errors.name}>
        <View style={[sharedFieldStyles.inputShell, focusedField === 'name' ? sharedFieldStyles.inputShellFocused : undefined]}>
          <Feather name="user" size={14} color={focusedField === 'name' ? loginColors.accent : '#B2C0CF'} />
          <TextInput
            value={formData.name}
            onChangeText={(name) => {
              setFormData((current) => ({ ...current, name }));
              setErrors((current) => ({ ...current, name: '' }));
            }}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            placeholder="Juan Dela Cruz"
            placeholderTextColor={loginColors.subtle}
            style={sharedFieldStyles.input}
          />
        </View>
      </SignUpField>

      <SignUpField label="Email or Phone Number" error={errors.identifier}>
        <View style={styles.inputRow}>
          {isPhone && (
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>+63</Text>
            </View>
          )}
          <View style={[sharedFieldStyles.inputShell, styles.flex, focusedField === 'identifier' ? sharedFieldStyles.inputShellFocused : undefined]}>
            <Feather name={isPhone ? 'phone' : 'mail'} size={14} color={focusedField === 'identifier' ? loginColors.accent : '#B2C0CF'} />
            <TextInput
              value={formData.identifier}
              onChangeText={handleIdentifierChange}
              onFocus={() => setFocusedField('identifier')}
              onBlur={() => setFocusedField(null)}
              placeholder="Email or 9123456789"
              placeholderTextColor={loginColors.subtle}
              keyboardType={isPhone ? 'phone-pad' : 'email-address'}
              autoCapitalize="none"
              style={sharedFieldStyles.input}
            />
          </View>
        </View>
      </SignUpField>

      <View style={styles.passwordRow}>
        <View style={styles.half}>
          <SignUpField label="Password" error={errors.password}>
            <View style={[sharedFieldStyles.inputShell, focusedField === 'password' ? sharedFieldStyles.inputShellFocused : undefined]}>
              <Feather name="shield" size={14} color={focusedField === 'password' ? loginColors.accent : '#B2C0CF'} />
              <TextInput
                value={formData.password}
                onChangeText={(password) => {
                  setFormData((current) => ({ ...current, password }));
                  setErrors((current) => ({
                    ...current,
                    password: current.password ? validatePassword(password) : '',
                  }));
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                placeholderTextColor={loginColors.subtle}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={sharedFieldStyles.input}
              />
              <Pressable style={sharedFieldStyles.suffixButton} onPress={() => setShowPassword((current) => !current)}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={14} color={focusedField === 'password' ? loginColors.accent : '#B2C0CF'} />
              </Pressable>
            </View>
          </SignUpField>
        </View>

        <View style={styles.half}>
          <SignUpField label="Confirm" error={errors.confirm}>
            <View style={[sharedFieldStyles.inputShell, focusedField === 'confirm' ? sharedFieldStyles.inputShellFocused : undefined]}>
              <Feather name="shield" size={14} color={focusedField === 'confirm' ? loginColors.accent : '#B2C0CF'} />
              <TextInput
                value={formData.confirm}
                onChangeText={(confirm) => {
                  setFormData((current) => ({ ...current, confirm }));
                  setErrors((current) => ({
                    ...current,
                    confirm: confirm && confirm !== formData.password ? 'Match error' : '',
                  }));
                }}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                placeholderTextColor={loginColors.subtle}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                style={sharedFieldStyles.input}
              />
              <Pressable style={sharedFieldStyles.suffixButton} onPress={() => setShowConfirm((current) => !current)}>
                <Feather name={showConfirm ? 'eye-off' : 'eye'} size={14} color={focusedField === 'confirm' ? loginColors.accent : '#B2C0CF'} />
              </Pressable>
            </View>
          </SignUpField>
        </View>
      </View>

      <Pressable style={[styles.primaryButton, loginShadows.button]} onPress={handleSubmit}>
        <Text style={styles.primaryButtonText}>Create My Account  {'>'}</Text>
      </Pressable>

      <SocialSignUpButtons onPressProvider={onSocialPress} />

      <Text style={styles.footerCopy}>
        Already have an account? <Text style={styles.footerLink} onPress={onLoginPress}>Log In</Text>
      </Text>
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
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E1EB',
    backgroundColor: '#EEF4FA',
    padding: 3,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 30,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: loginColors.primary,
  },
  segmentActiveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentInactiveText: {
    color: '#97A8B9',
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flex: {
    flex: 1,
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
  passwordRow: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
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
  footerCopy: {
    color: '#71859A',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 2,
  },
  footerLink: {
    color: loginColors.accent,
  },
});
