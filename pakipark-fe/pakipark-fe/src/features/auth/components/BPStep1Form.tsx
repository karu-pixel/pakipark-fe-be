import type React from 'react';
import { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { loginColors, loginShadows } from './LoginStyles';
import { sharedFieldStyles, SignUpField } from './SignUpShared';

interface PartnerFormData {
  fullName: string;
  dob: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  province: string;
  password: string;
  confirm: string;
}

const getDateParts = (value: string) => {
  const [day = '', month = '', year = ''] = value.split('/');
  return { day, month, year };
};

const buildDateValue = ({
  day,
  month,
  year,
}: {
  day: string;
  month: string;
  year: string;
}) => {
  if (!day && !month && !year) return '';
  if (!month && !year) return day;
  if (!year) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
};

const isValidSegmentedDate = (value: string) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false;
  }

  const [dayText, monthText, yearText] = value.split('/');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export function BPStep1Form({
  subStep,
  formData,
  setFormData,
  onNext,
  onBack,
}: {
  subStep: 1 | 2;
  formData: PartnerFormData;
  setFormData: React.Dispatch<React.SetStateAction<PartnerFormData>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<
    'fullName' | 'dob' | 'phone' | 'email' | 'street' | 'city' | 'province' | 'password' | 'confirm' | null
  >(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const dateParts = getDateParts(formData.dob);

  const handleDobPartChange = (part: 'day' | 'month' | 'year', rawValue: string) => {
    const nextValue = rawValue.replace(/\D/g, '').slice(0, part === 'year' ? 4 : 2);
    const nextParts = { ...dateParts, [part]: nextValue };

    setFormData((current) => ({
      ...current,
      dob: buildDateValue(nextParts),
    }));

    if (part === 'day' && nextValue.length === 2) {
      monthRef.current?.focus();
    }

    if (part === 'month' && nextValue.length === 2) {
      yearRef.current?.focus();
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (subStep === 1) {
      if (!formData.fullName.trim()) nextErrors.fullName = 'Required.';
      if (!formData.dob.trim()) {
        nextErrors.dob = 'Required.';
      } else if (!isValidSegmentedDate(formData.dob.trim())) {
        nextErrors.dob = 'Use DD/MM/YYYY.';
      }
      if (!/^9\d{9}$/.test(formData.phone)) nextErrors.phone = 'Start with 9, 10 digits.';
      if (!/\S+@\S+\.\S+/.test(formData.email.trim())) nextErrors.email = 'Invalid format.';
    } else {
      if (!formData.street.trim()) nextErrors.street = 'Required.';
      if (!formData.city.trim()) nextErrors.city = 'Required.';
      if (!formData.province.trim()) nextErrors.province = 'Required.';
      if (formData.password.length < 8) nextErrors.password = '8+ chars required.';
      if (formData.password !== formData.confirm) nextErrors.confirm = 'Passwords must match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <View style={styles.root}>
      <View style={styles.intro}>
        <Text style={styles.title}>{subStep === 1 ? 'Personal Details' : 'Account Security'}</Text>
        <Text style={styles.subtitle}>Please provide your business partner information.</Text>
      </View>

      {subStep === 1 ? (
        <View style={styles.stack}>
          <View style={styles.row}>
            <View style={styles.half}>
              <SignUpField label="Full Name" error={errors.fullName}>
                <View style={[sharedFieldStyles.inputShell, focusedField === 'fullName' ? sharedFieldStyles.inputShellFocused : undefined]}>
                  <Feather name="user" size={14} color={focusedField === 'fullName' ? loginColors.accent : '#B2C0CF'} />
                  <TextInput
                    value={formData.fullName}
                    onChangeText={(fullName) => setFormData((current) => ({ ...current, fullName }))}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Full Name"
                    placeholderTextColor={loginColors.subtle}
                    style={sharedFieldStyles.input}
                  />
                </View>
              </SignUpField>
            </View>
            <View style={styles.half}>
              <SignUpField label="Birth Date" error={errors.dob}>
                <View style={[styles.dateShell, focusedField === 'dob' ? styles.dateShellFocused : undefined]}>
                  <Feather name="calendar" size={14} color={focusedField === 'dob' ? loginColors.accent : '#B2C0CF'} />
                  <View style={styles.dateParts}>
                    <TextInput
                      value={dateParts.day}
                      onChangeText={(value) => handleDobPartChange('day', value)}
                      onFocus={() => setFocusedField('dob')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="DD"
                      placeholderTextColor={loginColors.subtle}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={styles.dateInputSmall}
                    />
                    <Text style={[styles.dateDivider, focusedField === 'dob' ? styles.dateDividerFocused : undefined]}>/</Text>
                    <TextInput
                      ref={monthRef}
                      value={dateParts.month}
                      onChangeText={(value) => handleDobPartChange('month', value)}
                      onFocus={() => setFocusedField('dob')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="MM"
                      placeholderTextColor={loginColors.subtle}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={styles.dateInputSmall}
                    />
                    <Text style={[styles.dateDivider, focusedField === 'dob' ? styles.dateDividerFocused : undefined]}>/</Text>
                    <TextInput
                      ref={yearRef}
                      value={dateParts.year}
                      onChangeText={(value) => handleDobPartChange('year', value)}
                      onFocus={() => setFocusedField('dob')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="YYYY"
                      placeholderTextColor={loginColors.subtle}
                      keyboardType="number-pad"
                      maxLength={4}
                      style={styles.dateInputLarge}
                    />
                  </View>
                </View>
              </SignUpField>
            </View>
          </View>

          <SignUpField label="Mobile Number" error={errors.phone}>
            <View style={styles.row}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>+63</Text>
              </View>
              <View style={[sharedFieldStyles.inputShell, styles.flex, focusedField === 'phone' ? sharedFieldStyles.inputShellFocused : undefined]}>
                <Feather name="phone" size={14} color={focusedField === 'phone' ? loginColors.accent : '#B2C0CF'} />
                <TextInput
                  value={formData.phone}
                  onChangeText={(phone) =>
                    setFormData((current) => ({ ...current, phone: phone.replace(/\D/g, '').slice(0, 10) }))
                  }
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

          <SignUpField label="Email Address" error={errors.email}>
            <View style={[sharedFieldStyles.inputShell, focusedField === 'email' ? sharedFieldStyles.inputShellFocused : undefined]}>
              <Feather name="mail" size={14} color={focusedField === 'email' ? loginColors.accent : '#B2C0CF'} />
              <TextInput
                value={formData.email}
                onChangeText={(email) => setFormData((current) => ({ ...current, email }))}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="juan@paki.park"
                placeholderTextColor={loginColors.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                style={sharedFieldStyles.input}
              />
            </View>
          </SignUpField>
        </View>
      ) : (
        <View style={styles.stack}>
          <SignUpField label="Street / Unit" error={errors.street}>
            <View style={[sharedFieldStyles.inputShell, focusedField === 'street' ? sharedFieldStyles.inputShellFocused : undefined]}>
              <Feather name="map-pin" size={14} color={focusedField === 'street' ? loginColors.accent : '#B2C0CF'} />
              <TextInput
                value={formData.street}
                onChangeText={(street) => setFormData((current) => ({ ...current, street }))}
                onFocus={() => setFocusedField('street')}
                onBlur={() => setFocusedField(null)}
                placeholder="House No / Street"
                placeholderTextColor={loginColors.subtle}
                style={sharedFieldStyles.input}
              />
            </View>
          </SignUpField>

          <View style={styles.row}>
            <View style={styles.half}>
              <SignUpField label="City" error={errors.city}>
                <View style={[sharedFieldStyles.inputShell, focusedField === 'city' ? sharedFieldStyles.inputShellFocused : undefined]}>
                  <Feather name="home" size={14} color={focusedField === 'city' ? loginColors.accent : '#B2C0CF'} />
                  <TextInput
                    value={formData.city}
                    onChangeText={(city) => setFormData((current) => ({ ...current, city }))}
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="City"
                    placeholderTextColor={loginColors.subtle}
                    style={sharedFieldStyles.input}
                  />
                </View>
              </SignUpField>
            </View>
            <View style={styles.half}>
              <SignUpField label="Province" error={errors.province}>
                <View style={[sharedFieldStyles.inputShell, focusedField === 'province' ? sharedFieldStyles.inputShellFocused : undefined]}>
                  <Feather name="map-pin" size={14} color={focusedField === 'province' ? loginColors.accent : '#B2C0CF'} />
                  <TextInput
                    value={formData.province}
                    onChangeText={(province) => setFormData((current) => ({ ...current, province }))}
                    onFocus={() => setFocusedField('province')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Province"
                    placeholderTextColor={loginColors.subtle}
                    style={sharedFieldStyles.input}
                  />
                </View>
              </SignUpField>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <SignUpField label="Password" error={errors.password}>
                <View style={[sharedFieldStyles.inputShell, focusedField === 'password' ? sharedFieldStyles.inputShellFocused : undefined]}>
                  <Feather name="shield" size={14} color={focusedField === 'password' ? loginColors.accent : '#B2C0CF'} />
                  <TextInput
                    value={formData.password}
                    onChangeText={(password) => setFormData((current) => ({ ...current, password }))}
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
                    onChangeText={(confirm) => setFormData((current) => ({ ...current, confirm }))}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    placeholderTextColor={loginColors.subtle}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={sharedFieldStyles.input}
                  />
                  <Pressable style={sharedFieldStyles.suffixButton} onPress={() => setShowPassword((current) => !current)}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={14} color={focusedField === 'confirm' ? loginColors.accent : '#B2C0CF'} />
                  </Pressable>
                </View>
              </SignUpField>
            </View>
          </View>
        </View>
      )}

      <View style={styles.buttonRow}>
        {subStep === 2 && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <Feather name="arrow-left" size={16} color="#8492A6" />
          </Pressable>
        )}
        <Pressable
          style={[styles.primaryButton, loginShadows.button]}
          onPress={() => {
            if (validate()) onNext();
          }}
        >
          <Text style={styles.primaryButtonText}>
            {subStep === 1 ? 'Continue >' : 'Next: Upload Documents >'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
  },
  intro: {
    gap: 3,
  },
  title: {
    color: loginColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8492A6',
    fontSize: 11,
  },
  stack: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  half: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  codeBox: {
    minWidth: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: loginColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    color: loginColors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  dateShell: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E1EB',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 12,
  },
  dateShellFocused: {
    borderColor: loginColors.accent,
  },
  dateParts: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInputSmall: {
    width: 24,
    color: loginColors.text,
    fontSize: 13,
    paddingVertical: 9,
    textAlign: 'center',
  },
  dateInputLarge: {
    flex: 1,
    color: loginColors.text,
    fontSize: 13,
    paddingVertical: 9,
  },
  dateDivider: {
    color: '#9FB0C2',
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 2,
  },
  dateDividerFocused: {
    color: loginColors.accent,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  backButton: {
    width: 44,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#DDE5EE',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: loginColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
