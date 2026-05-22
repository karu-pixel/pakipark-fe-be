import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../../services/authService';

import { backendApi } from '../../../lib/api';

import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { LoginFormMain } from '../components/LoginFormMain';
import { LoginHeader } from '../components/LoginHeader';
import { LoginLeftPanel } from '../components/LoginLeftPanel';
import { loginShadows } from '../components/LoginStyles';
import { SocialAuthModal } from '../components/SocialAuthModal';

const INITIAL_FORM = { identifier: '', password: '', twoFactorCode: '' };
const INITIAL_ERRORS = { identifier: '', password: '', twoFactorCode: '' };

type PakiParkRole =
  | 'customer'
  | 'admin'
  | 'staff'
  | 'partner'
  | 'teller'
  | 'business_partner';

const AUTH_TOKEN_KEY = 'pakipark_auth_token';
const AUTH_USER_KEY = 'pakipark_auth_user';
const KEEP_LOGGED_IN_KEY = 'pakipark_keep_logged_in';

const looksLikePhoneInput = (value: string) =>
  /^[\d\s()+-]+$/.test(value.trim());

const normalizePhoneInput = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if (digits.startsWith('63')) {
    return digits.slice(2, 12);
  }

  if (digits.startsWith('0')) {
    return digits.slice(1, 11);
  }

  return digits.slice(0, 10);
};

const getLoginToken = (user: any) => {
  return (
    user?.token ||
    user?.access_token ||
    user?.accessToken ||
    user?.session?.access_token ||
    user?.data?.token ||
    user?.data?.access_token ||
    null
  );
};

export function LoginScreen({
  onNavigateToSignUp,
  onAuthSuccess,
  onBackToLauncher,
  onNavigateToPakiShip,
}: {
  onNavigateToSignUp?: () => void;
  onAuthSuccess?: (role?: PakiParkRole) => void;
  onBackToLauncher?: () => void;
  onNavigateToPakiShip?: () => void;
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isForgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetError, setResetError] = useState('');
  const [two_factor_required, settwo_factor_required] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<string | null>(
    null,
  );

  const isEmail = useMemo(() => {
    const identifier = formData.identifier.trim();
    return identifier === '' || !looksLikePhoneInput(identifier);
  }, [formData.identifier]);

  const handleIdentifierChange = (value: string) => {
    const raw = value.trimStart();
    const cleaned = looksLikePhoneInput(raw) ? normalizePhoneInput(raw) : raw;
    setFormData((current) => ({ ...current, identifier: cleaned }));
    setErrors((current) => ({ ...current, identifier: '' }));
  };

  const validateLogin = () => {
    const nextErrors = { identifier: '', password: '', twoFactorCode: '' };

    if (!formData.identifier.trim()) {
      nextErrors.identifier = 'Please enter your email or mobile number.';
    } else if (isEmail) {
      const emailPattern = /\S+@\S+\.\S+/;
      if (!emailPattern.test(formData.identifier.trim())) {
        nextErrors.identifier = 'Please enter a valid email address.';
      }
    } else if (formData.identifier.trim().length !== 10) {
      nextErrors.identifier =
        'Use a 10-digit mobile number without the country code.';
    }

    if (!formData.password.trim()) {
      nextErrors.password = 'Please enter your password.';
    } else if (formData.password.trim().length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (two_factor_required && !/^\d{6}$/.test(formData.twoFactorCode.trim())) {
      nextErrors.twoFactorCode =
        'Enter the 6-digit code from your authenticator app.';
    }

    setErrors(nextErrors);
    return (
      !nextErrors.identifier &&
      !nextErrors.password &&
      !nextErrors.twoFactorCode
    );
  };

  const persistLoginSession = async (user: any, shouldKeepLoggedIn: boolean) => {
    const token = getLoginToken(user);

    if (shouldKeepLoggedIn) {
      if (!token) {
        throw new Error('Login succeeded, but no auth token was returned.');
      }

      await AsyncStorage.multiSet([
        [AUTH_TOKEN_KEY, String(token)],
        [AUTH_USER_KEY, JSON.stringify(user)],
        [KEEP_LOGGED_IN_KEY, 'true'],
      ]);

      return;
    }

    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY,
      AUTH_USER_KEY,
      KEEP_LOGGED_IN_KEY,
    ]);
  };

  const handleLoginSubmit = async () => {
    if (!validateLogin()) {
      return;
    }

    setSubmitting(true);

    try {
      const user = await authService.login(
        formData.identifier.trim(),
        formData.password,
        two_factor_required ? formData.twoFactorCode.trim() : undefined,
        'pakipark',
        keepLoggedIn,
      );

      if (user.two_factor_required) {
        settwo_factor_required(true);
        setFormData((current) => ({ ...current, twoFactorCode: '' }));
        setErrors((current) => ({ ...current, twoFactorCode: '' }));
        return;
      }

      await persistLoginSession(user, keepLoggedIn);

      settwo_factor_required(false);

      const role = user.role === 'business_partner' ? 'partner' : user.role;

      if (onAuthSuccess) {
        onAuthSuccess(role);
      }
    } catch (err: any) {
      Alert.alert(
        'Login failed',
        err.message || 'An unexpected error occurred during login.',
      );

      if (two_factor_required) {
        setFormData((current) => ({ ...current, twoFactorCode: '' }));
      }
    } finally {
      setSubmitting(false);
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
      return emailPattern.test(trimmed)
        ? ''
        : 'Please enter a valid email address.';
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
    Alert.alert(
      'Reset link sent',
      `We sent password reset instructions to ${recipient}.`,
    );
  };

  const handleHeaderBackPress = () => {
    if (onBackToLauncher) {
      onBackToLauncher();
      return;
    }

    Alert.alert(
      'Back button unavailable',
      'Connect this screen to navigation before using the back button.',
    );
  };

  const handleSocialClick = (provider: string) => {
    setActiveSocialProvider(provider);
  };

  const handleNavigateToSignUp = () => {
    if (onNavigateToSignUp) {
      onNavigateToSignUp();
      return;
    }

    Alert.alert(
      'Sign up unavailable',
      'Connect this screen to navigation before opening sign up.',
    );
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
                isSubmitting={isSubmitting}
                two_factor_required={two_factor_required}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <ForgotPasswordModal
        visible={isForgotPasswordVisible}
        initialIdentifier={resetIdentifier}
        onClose={handleForgotPasswordClose}
        onSuccess={() => {
          setForgotPasswordVisible(false);
          Alert.alert(
            'Password Reset',
            'Your password has been reset successfully. Please log in with your new password.',
          );
        }}
      />

      <SocialAuthModal
        visible={activeSocialProvider !== null}
        provider={activeSocialProvider || ''}
        onClose={() => setActiveSocialProvider(null)}
        onSuccess={async (role) => {
          await AsyncStorage.setItem(KEEP_LOGGED_IN_KEY, keepLoggedIn ? 'true' : 'false');

          if (onAuthSuccess) {
            onAuthSuccess(role);
          }
        }}
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