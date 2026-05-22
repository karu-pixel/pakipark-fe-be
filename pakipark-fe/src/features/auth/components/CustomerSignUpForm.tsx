import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { loginColors, loginShadows } from './LoginStyles';
import { sharedFieldStyles, SignUpField } from './SignUpShared';

interface CustomerSignUpFormProps {
  onSubmit: (payload: { firstName: string; lastName: string; name: string; identifier: string; password: string; date_of_birth: string; address: string }) => void | Promise<void>;
  onLoginPress: () => void;
  onSocialPress: (provider: string) => void;
  isSubmitting?: boolean;
}

export function CustomerSignUpForm({
  onSubmit,
  onLoginPress,
  onSocialPress,
  isSubmitting = false,
}: CustomerSignUpFormProps) {
  const [focusedField, setFocusedField] = useState<'firstName' | 'lastName' | 'identifier' | 'password' | 'confirm' | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    identifier: '',
    password: '',
    confirm: '',
    dateOfBirth: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    identifier: '',
    password: '',
    confirm: '',
    dateOfBirth: '',
    address: '',
  });

  const isPhone = useMemo(() => /^\d/.test(formData.identifier), [formData.identifier]);

  const handleIdentifierChange = (value: string) => {
    if (/^\d+$/.test(value)) {
      const digits = value.startsWith('63') ? value.slice(2) : value.startsWith('0') ? value.slice(1) : value;
      setFormData((current) => ({ ...current, identifier: digits.slice(0, 10) }));
      setErrors((current) => ({
        ...current,
        identifier: digits.length > 0 && digits.length < 10 ? 'Must be exactly 10 digits.' : '',
      }));
      return;
    }

    setFormData((current) => ({ ...current, identifier: value.trimStart() }));
    setErrors((current) => ({ ...current, identifier: '' }));
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required.';
    if (value.length < 8 || !/\d/.test(value) || !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return '8+ chars, 1 number & 1 special char required.';
    }
    return '';
  };

  const handleDateChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 4) formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    if (cleaned.length > 6) formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    setFormData((current) => ({ ...current, dateOfBirth: formatted }));
    setErrors((current) => ({ ...current, dateOfBirth: '' }));
  };

  const validateDate = (date: string) => {
    if (!date.trim()) return 'Required.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Use YYYY-MM-DD.';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date.';
    if (d > new Date()) return 'Cannot be future date.';
    return '';
  };

  const handleSubmit = () => {
    const nextErrors = { firstName: '', lastName: '', identifier: '', password: '', confirm: '', dateOfBirth: '', address: '' };

    if (!formData.firstName.trim()) {
      nextErrors.firstName = 'First name is required.';
    }
    if (!formData.lastName.trim()) {
      nextErrors.lastName = 'Last name is required.';
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
    nextErrors.dateOfBirth = validateDate(formData.dateOfBirth);
    if (!formData.address.trim()) {
      nextErrors.address = 'Address is required.';
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    onSubmit({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      identifier: formData.identifier.trim(),
      password: formData.password,
      date_of_birth: formData.dateOfBirth,
      address: formData.address.trim(),
    });
  };

  return (
    <View style={[styles.root, loginShadows.card]}>
      <View style={styles.headingBlock}>
        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.headingCopy}>Sign up to get started with PakiPark.</Text>
      </View>

      <View style={styles.passwordRow}>
        <View style={styles.half}>
          <SignUpField label="First Name" error={errors.firstName}>
            <View style={[sharedFieldStyles.inputShell, focusedField === 'firstName' ? sharedFieldStyles.inputShellFocused : undefined]}>
              <Feather name="user" size={14} color={focusedField === 'firstName' ? loginColors.accent : '#B2C0CF'} />
              <TextInput
                value={formData.firstName}
                onChangeText={(firstName) => {
                  setFormData((current) => ({ ...current, firstName }));
                  setErrors((current) => ({ ...current, firstName: '' }));
                }}
                onFocus={() => setFocusedField('firstName')}
                onBlur={() => setFocusedField(null)}
                placeholder="Juan"
                placeholderTextColor={loginColors.subtle}
                style={sharedFieldStyles.input}
              />
            </View>
          </SignUpField>
        </View>

        <View style={styles.half}>
          <SignUpField label="Last Name" error={errors.lastName}>
            <View style={[sharedFieldStyles.inputShell, focusedField === 'lastName' ? sharedFieldStyles.inputShellFocused : undefined]}>
              <Feather name="user" size={14} color={focusedField === 'lastName' ? loginColors.accent : '#B2C0CF'} />
              <TextInput
                value={formData.lastName}
                onChangeText={(lastName) => {
                  setFormData((current) => ({ ...current, lastName }));
                  setErrors((current) => ({ ...current, lastName: '' }));
                }}
                onFocus={() => setFocusedField('lastName')}
                onBlur={() => setFocusedField(null)}
                placeholder="Dela Cruz"
                placeholderTextColor={loginColors.subtle}
                style={sharedFieldStyles.input}
              />
            </View>
          </SignUpField>
        </View>
      </View>

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
              placeholder="name@email.com or 09123456789"
              placeholderTextColor={loginColors.subtle}
              keyboardType={isPhone ? 'phone-pad' : 'email-address'}
              autoCapitalize="none"
              style={sharedFieldStyles.input}
            />
          </View>
        </View>
      </SignUpField>

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

      <SignUpField label="Confirm Password" error={errors.confirm}>
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

      <SignUpField label="Date of Birth (YYYY-MM-DD)" error={errors.dateOfBirth}>
        <View style={[sharedFieldStyles.inputShell, focusedField === 'dateOfBirth' as any ? sharedFieldStyles.inputShellFocused : undefined]}>
          <Feather name="calendar" size={14} color={focusedField === 'dateOfBirth' as any ? loginColors.accent : '#B2C0CF'} />
          <TextInput
            value={formData.dateOfBirth}
            onChangeText={handleDateChange}
            onFocus={() => setFocusedField('dateOfBirth' as any)}
            onBlur={() => setFocusedField(null)}
            placeholder="1990-01-25"
            placeholderTextColor={loginColors.subtle}
            keyboardType="number-pad"
            maxLength={10}
            style={sharedFieldStyles.input}
          />
        </View>
      </SignUpField>

      <SignUpField label="Full Address" error={errors.address}>
        <View style={[sharedFieldStyles.inputShell, { minHeight: 80, alignItems: 'flex-start', paddingVertical: 12 }, focusedField === 'address' as any ? sharedFieldStyles.inputShellFocused : undefined]}>
          <Feather name="map-pin" size={14} color={focusedField === 'address' as any ? loginColors.accent : '#B2C0CF'} style={{ marginTop: 2 }} />
          <TextInput
            value={formData.address}
            onChangeText={(address) => {
              setFormData((current) => ({ ...current, address }));
              setErrors((current) => ({ ...current, address: '' }));
            }}
            onFocus={() => setFocusedField('address' as any)}
            onBlur={() => setFocusedField(null)}
            placeholder="123 Main St, Brgy. San Jose, Manila"
            placeholderTextColor={loginColors.subtle}
            multiline
            style={[sharedFieldStyles.input, { paddingVertical: 0, marginTop: -2 }]}
          />
        </View>
      </SignUpField>

      <Pressable
        disabled={isSubmitting}
        style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : null, loginShadows.button]}
        onPress={handleSubmit}
      >
        <Text style={styles.primaryButtonText}>{isSubmitting ? 'Creating Account...' : 'Create Account'}</Text>
      </Pressable>

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
  primaryButtonDisabled: {
    opacity: 0.65,
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
