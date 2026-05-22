import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { backendApi } from '../../../lib/api';

import { CustomerSignUpForm } from '../components/CustomerSignUpForm';
import { loginShadows } from '../components/LoginStyles';
import { SignUpHeader } from '../components/SignUpHeader';
import { SignUpLeftPanel } from '../components/SignUpLeftPanel';

export function SignUpScreen({
  onBackToLogin,
  onAuthSuccess,
}: {
  onBackToLogin: () => void;
  onAuthSuccess?: () => void;
}) {
  const [isCustomerSubmitting, setCustomerSubmitting] = useState(false);

  const handleSocialPress = (provider: string) => {
    if (onAuthSuccess) {
      onAuthSuccess();
      return;
    }

    Alert.alert(`${provider} sign up`, `Connect your ${provider} sign up flow when backend auth is ready.`);
  };

  const handleCustomerSubmit = async (payload: { firstName: string; lastName: string; name: string; identifier: string; password: string; date_of_birth: string; address: string }) => {
    setCustomerSubmitting(true);
    try {
      await backendApi.registerCustomer({
        firstName: payload.firstName,
        lastName: payload.lastName,
        name: payload.name,
        identifier: payload.identifier.trim(),
        password: payload.password,
        date_of_birth: payload.date_of_birth,
        address: payload.address,
      });

      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (err: any) {
      Alert.alert('Signup failed', err.message || 'An unexpected error occurred during signup.');
    } finally {
      setCustomerSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SignUpHeader onBack={onBackToLogin} />
      <View style={styles.contentBackground}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.heroArea}>
              <SignUpLeftPanel />
            </View>

            <View collapsable={false} nativeID="signup-screen" testID="signup-screen-root" style={[styles.screenCard, loginShadows.card]}>
              <CustomerSignUpForm
                onSubmit={handleCustomerSubmit}
                onLoginPress={onBackToLogin}
                onSocialPress={handleSocialPress}
                isSubmitting={isCustomerSubmitting}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
