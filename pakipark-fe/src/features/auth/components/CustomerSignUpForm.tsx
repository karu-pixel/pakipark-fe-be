import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { loginColors, loginShadows } from './LoginStyles';
import { sharedFieldStyles, SignUpField } from './SignUpShared';

interface CustomerSignUpFormProps {
  onSubmit: (payload: { firstName: string; lastName: string; name: string; email: string; phone: string; password: string; date_of_birth: string; address: string; city: string; province: string }) => void | Promise<void>;
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
  const [focusedField, setFocusedField] = useState<'firstName' | 'lastName' | 'email' | 'phone' | 'password' | 'confirm' | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    dateOfBirth: '',
    address: '',
    city: '',
    province: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    dateOfBirth: '',
    address: '',
    city: '',
    province: '',
  });

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.startsWith('63')) formatted = digits.slice(2);
    else if (digits.startsWith('0')) formatted = digits.slice(1);
    
    setFormData((current) => ({ ...current, phone: formatted.slice(0, 10) }));
    setErrors((current) => ({
      ...current,
      phone: formatted.length > 0 && formatted.length < 10 ? 'Must be exactly 10 digits.' : '',
    }));
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
    const nextErrors = { firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '', dateOfBirth: '', address: '', city: '', province: '' };

    if (!formData.firstName.trim()) {
      nextErrors.firstName = 'First name is required.';
    }
    if (!formData.lastName.trim()) {
      nextErrors.lastName = 'Last name is required.';
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (formData.phone.length !== 10) {
      nextErrors.phone = 'Must be exactly 10 digits.';
    }

    nextErrors.password = validatePassword(formData.password);
    if (!formData.confirm.trim()) {
      nextErrors.confirm = 'Confirm your password.';
    } else if (formData.password !== formData.confirm) {
      nextErrors.confirm = "Passwords don't match.";
    }
    nextErrors.dateOfBirth = validateDate(formData.dateOfBirth);
    if (!formData.address.trim()) {
      nextErrors.address = 'Street address is required.';
    }
    if (!formData.city.trim()) {
      nextErrors.city = 'City is required.';
    }
    if (!formData.province.trim()) {
      nextErrors.province = 'Province is required.';
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    onSubmit({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password,
      date_of_birth: formData.dateOfBirth,
      address: formData.address.trim(),
      city: formData.city.trim(),
      province: formData.province.trim(),
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

      <SignUpField label="Email Address" error={errors.email}>
        <View style={[sharedFieldStyles.inputShell, focusedField === 'email' ? sharedFieldStyles.inputShellFocused : undefined]}>
          <Feather name="mail" size={14} color={focusedField === 'email' ? loginColors.accent : '#B2C0CF'} />
          <TextInput
            value={formData.email}
            onChangeText={(email) => {
              setFormData((current) => ({ ...current, email: email.trimStart() }));
              setErrors((current) => ({ ...current, email: '' }));
            }}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            placeholder="name@email.com"
            placeholderTextColor={loginColors.subtle}
            keyboardType="email-address"
            autoCapitalize="none"
            style={sharedFieldStyles.input}
          />
        </View>
      </SignUpField>

      <SignUpField label="Mobile Number" error={errors.phone}>
        <View style={styles.inputRow}>
          <View style={styles.countryCodeBox}>
            <Text style={styles.countryCodeText}>+63</Text>
          </View>
          <View style={[sharedFieldStyles.inputShell, styles.flex, focusedField === 'phone' ? sharedFieldStyles.inputShellFocused : undefined]}>
            <Feather name="phone" size={14} color={focusedField === 'phone' ? loginColors.accent : '#B2C0CF'} />
            <TextInput
              value={formData.phone}
              onChangeText={handlePhoneChange}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              placeholder="9123456789"
              placeholderTextColor={loginColors.subtle}
              keyboardType="phone-pad"
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

      <SignUpField label="Street Address" error={errors.address}>
        <View style={[sharedFieldStyles.inputShell, focusedField === 'address' as any ? sharedFieldStyles.inputShellFocused : undefined]}>
          <Feather name="map-pin" size={14} color={focusedField === 'address' as any ? loginColors.accent : '#B2C0CF'} />
          <TextInput
            value={formData.address}
            onChangeText={(address) => {
              setFormData((current) => ({ ...current, address }));
              setErrors((current) => ({ ...current, address: '' }));
            }}
            onFocus={() => setFocusedField('address' as any)}
            onBlur={() => setFocusedField(null)}
            placeholder="123 Main St, Brgy. San Jose"
            placeholderTextColor={loginColors.subtle}
            style={sharedFieldStyles.input}
          />
        </View>
      </SignUpField>

      <View style={styles.passwordRow}>
        <View style={styles.half}>
          <SignUpField label="City" error={errors.city}>
            <View style={[sharedFieldStyles.inputShell, focusedField === 'city' as any ? sharedFieldStyles.inputShellFocused : undefined]}>
              <Feather name="map" size={14} color={focusedField === 'city' as any ? loginColors.accent : '#B2C0CF'} />
              <TextInput
                value={formData.city}
                onChangeText={(city) => {
                  setFormData((current) => ({ ...current, city }));
                  setErrors((current) => ({ ...current, city: '' }));
                }}
                onFocus={() => setFocusedField('city' as any)}
                onBlur={() => setFocusedField(null)}
                placeholder="Manila"
                placeholderTextColor={loginColors.subtle}
                style={sharedFieldStyles.input}
              />
            </View>
          </SignUpField>
        </View>

        <View style={styles.half}>
          <SignUpField label="Province" error={errors.province}>
            <View style={[sharedFieldStyles.inputShell, focusedField === 'province' as any ? sharedFieldStyles.inputShellFocused : undefined]}>
              <Feather name="map" size={14} color={focusedField === 'province' as any ? loginColors.accent : '#B2C0CF'} />
              <TextInput
                value={formData.province}
                onChangeText={(province) => {
                  setFormData((current) => ({ ...current, province }));
                  setErrors((current) => ({ ...current, province: '' }));
                }}
                onFocus={() => setFocusedField('province' as any)}
                onBlur={() => setFocusedField(null)}
                placeholder="Metro Manila"
                placeholderTextColor={loginColors.subtle}
                style={sharedFieldStyles.input}
              />
            </View>
          </SignUpField>
        </View>
      </View>

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
