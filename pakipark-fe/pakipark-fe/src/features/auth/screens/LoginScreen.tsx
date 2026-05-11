import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../../lib/supabase';

import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { LoginFormMain } from '../components/LoginFormMain';
import { LoginHeader } from '../components/LoginHeader';
import { LoginLeftPanel } from '../components/LoginLeftPanel';
import { loginShadows } from '../components/LoginStyles';

const INITIAL_FORM = { identifier: '', password: '' };
const INITIAL_ERRORS = { identifier: '', password: '' };

export function LoginScreen({
  onNavigateToSignUp,
  onAuthSuccess,
  onBackToLauncher,
}: {
  onNavigateToSignUp?: () => void;
  onAuthSuccess?: (role?: 'customer' | 'admin' | 'partner') => void;
  onBackToLauncher?: () => void;
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [isForgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetError, setResetError] = useState('');

  const isEmail = useMemo(() => formData.identifier.includes('@') || formData.identifier === '' || !/^\d+$/.test(formData.identifier), [formData.identifier]);

  const handleIdentifierChange = (value: string) => {
    const cleaned = value.trimStart();
    setFormData((current) => ({ ...current, identifier: cleaned }));
    setErrors((current) => ({ ...current, identifier: '' }));
  };

  const validateLogin = () => {
    const nextErrors = { identifier: '', password: '' };

    if (!formData.identifier.trim()) {
      nextErrors.identifier = 'Please enter your email or mobile number.';
    } else if (isEmail) {
      const emailPattern = /\S+@\S+\.\S+/;
      if (!emailPattern.test(formData.identifier.trim())) {
        nextErrors.identifier = 'Please enter a valid email address.';
      }
    } else if (formData.identifier.trim().length !== 10) {
      nextErrors.identifier = 'Use a 10-digit mobile number without the country code.';
    }

    if (!formData.password.trim()) {
      nextErrors.password = 'Please enter your password.';
    } else if (formData.password.trim().length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    setErrors(nextErrors);
    return !nextErrors.identifier && !nextErrors.password;
  };

  const handleLoginSubmit = async () => {
    if (!validateLogin()) {
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.identifier, // Assuming email for now as per Supabase default
        password: formData.password,
      });

      if (error) {
        Alert.alert('Login failed', error.message);
        return;
      }

      // Fetch the real role from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single();

      const role = profile?.role || 'customer';

      if (onAuthSuccess) {
        onAuthSuccess(role as any);
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred during login.');
    }
  };

  const handleForgotPassword = () => {
    setResetIdentifier(formData.identifier.trim());
    setResetError('');
    setForgotPasswordVisible(true);
  };

  const handleResetIdentifierChange = (value: string) => {
    setResetIdentifier(value.trimStart());
    if (resetError) {
      setResetError('');
    }
  };

  const handleForgotPasswordClose = () => {
    setForgotPasswordVisible(false);
    setResetError('');
  };

  const validateResetIdentifier = () => {
    const trimmed = resetIdentifier.trim();

    if (!trimmed) {
      return 'Please enter your email or mobile number.';
    }

    if (/[A-Za-z@]/.test(trimmed)) {
      const emailPattern = /\S+@\S+\.\S+/;
      return emailPattern.test(trimmed) ? '' : 'Please enter a valid email address.';
    }

    const digits = trimmed.replace(/\D/g, '');
    const isValidMobile =
      digits.length === 10 ||
      (digits.length === 11 && digits.startsWith('0')) ||
      (digits.length === 12 && digits.startsWith('63'));

    return isValidMobile ? '' : 'Enter a valid mobile number or email address.';
  };

  const handleResetPasswordSubmit = () => {
    const nextError = validateResetIdentifier();

    if (nextError) {
      setResetError(nextError);
      return;
    }

    const recipient = resetIdentifier.trim();
    setForgotPasswordVisible(false);
    setResetError('');
    Alert.alert('Reset link sent', `We sent password reset instructions to ${recipient}.`);
  };

  const handleHeaderBackPress = () => {
    if (onBackToLauncher) {
      onBackToLauncher();
      return;
    }

    Alert.alert('Back button unavailable', 'Connect this screen to navigation before using the back button.');
  };

  const handleSocialClick = (provider: string) => {
    if (onAuthSuccess) {
      onAuthSuccess(provider === 'Facebook' ? 'admin' : 'customer');
      return;
    }

    Alert.alert(`${provider} sign in`, `Connect your ${provider} flow when backend auth is ready.`);
  };

  const handleNavigateToSignUp = () => {
    if (onNavigateToSignUp) {
      onNavigateToSignUp();
      return;
    }

    Alert.alert('Sign up unavailable', 'Connect this screen to navigation before opening sign up.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LoginHeader onBackPress={handleHeaderBackPress} />
      <View style={styles.contentBackground}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroArea}>
              <LoginLeftPanel />
            </View>

            <View
              collapsable={false}
              nativeID="login-screen"
              testID="login-screen-root"
              style={[styles.screenCard, loginShadows.card]}
            >
              <LoginFormMain
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                isEmail={isEmail}
                keepLoggedIn={keepLoggedIn}
                setKeepLoggedIn={setKeepLoggedIn}
                onSubmit={handleLoginSubmit}
                onForgotPassword={handleForgotPassword}
                onSocialClick={handleSocialClick}
                handleIdentifierChange={handleIdentifierChange}
                onCreateAccount={handleNavigateToSignUp}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <ForgotPasswordModal
        visible={isForgotPasswordVisible}
        value={resetIdentifier}
        error={resetError}
        onChangeText={handleResetIdentifierChange}
        onClose={handleForgotPasswordClose}
        onSubmit={handleResetPasswordSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentBackground: {
    flex: 1,
    backgroundColor: '#EFF4FA',
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 10,
    marginTop: -5,
    paddingBottom: 30,
    gap: 10,
  },
  heroArea: {
    paddingTop: 30,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  screenCard: {
    marginHorizontal: 6,
    marginTop: 0,
    borderRadius: 36,
    paddingBottom: 12,
  },
});
