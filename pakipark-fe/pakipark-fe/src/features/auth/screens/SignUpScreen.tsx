import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { supabase } from '../../../lib/supabase';

import { BPRemindersModal } from '../components/BPRemindersModal';
import { BPStep1Form } from '../components/BPStep1Form';
import { BPStep2Form } from '../components/BPStep2Form';
import type { PartnerUploads } from '../components/BPStep2Form';
import { CustomerSignUpForm } from '../components/CustomerSignUpForm';
import { loginColors, loginShadows } from '../components/LoginStyles';
import { SignUpHeader } from '../components/SignUpHeader';
import { SignUpLeftPanel } from '../components/SignUpLeftPanel';
import { SignUpStepIndicator } from '../components/SignUpStepIndicator';

type PartnerFormData = {
  fullName: string;
  dob: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  province: string;
  password: string;
  confirm: string;
};

const INITIAL_PARTNER: PartnerFormData = {
  fullName: '',
  dob: '',
  phone: '',
  email: '',
  street: '',
  city: '',
  province: '',
  password: '',
  confirm: '',
};

const INITIAL_UPLOADS: PartnerUploads = {
  permit: null,
  registration: null,
  ownership: null,
};

export function SignUpScreen({
  onBackToLogin,
  onAuthSuccess,
}: {
  onBackToLogin: () => void;
  onAuthSuccess?: () => void;
}) {
  const [role, setRole] = useState<'customer' | 'partner'>('customer');
  const [showPartnerReminder, setShowPartnerReminder] = useState(false);
  const [partnerStep, setPartnerStep] = useState<1 | 2 | 3>(1);
  const [partnerFormData, setPartnerFormData] = useState(INITIAL_PARTNER);
  const [partnerUploads, setPartnerUploads] = useState(INITIAL_UPLOADS);

  const handleSocialPress = (provider: string) => {
    if (onAuthSuccess) {
      onAuthSuccess();
      return;
    }

    Alert.alert(`${provider} sign up`, `Connect your ${provider} sign up flow when backend auth is ready.`);
  };

  const handleCustomerSubmit = async (payload: { name: string; identifier: string; password: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.identifier,
        password: payload.password,
        options: {
          data: {
            full_name: payload.name,
            role: 'customer',
          },
        },
      });

      if (error) {
        Alert.alert('Signup failed', error.message);
        return;
      }

      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred during signup.');
    }
  };

  const handlePartnerSubmit = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: partnerFormData.email,
        password: partnerFormData.password,
        options: {
          data: {
            full_name: partnerFormData.fullName,
            role: 'partner',
            phone: partnerFormData.phone,
            city: partnerFormData.city,
          },
        },
      });

      if (error) {
        Alert.alert('Partner signup failed', error.message);
        return;
      }

      Alert.alert('Application submitted', 'Welcome! Your partner account has been created.');
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred during partner signup.');
    }
  };

  const handleRoleChange = (nextRole: 'customer' | 'partner') => {
    if (nextRole === 'partner' && role !== 'partner') {
      setShowPartnerReminder(true);
    }

    setRole(nextRole);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SignUpHeader onBack={onBackToLogin} />
      <View style={styles.contentBackground}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View collapsable={false} nativeID="signup-screen" testID="signup-screen-root" style={styles.screenCard}>
              <SignUpLeftPanel />

              {role === 'customer' ? (
                <CustomerSignUpForm
                  onSubmit={handleCustomerSubmit}
                  onLoginPress={onBackToLogin}
                  onSocialPress={handleSocialPress}
                  role={role}
                  onRoleChange={handleRoleChange}
                />
              ) : (
                <View style={[styles.partnerCard, loginShadows.card]}>
                  <View style={styles.partnerHeader}>
                    <Text style={styles.partnerTitle}>Create Account</Text>
                    <Text style={styles.partnerCopy}>Sign up to get started with PakiPark.</Text>
                  </View>

                  <View style={styles.segmentedControl}>
                    <Text style={styles.segmentGhost} onPress={() => setRole('customer')}>Customer</Text>
                    <View style={[styles.segmentButton, styles.segmentButtonActive]}>
                      <Text style={styles.segmentText}>Partner</Text>
                    </View>
                  </View>

                  <SignUpStepIndicator step={partnerStep} />

                  {partnerStep === 1 ? (
                    <BPStep1Form
                      subStep={1}
                      formData={partnerFormData}
                      setFormData={setPartnerFormData}
                      onNext={() => setPartnerStep(2)}
                      onBack={onBackToLogin}
                    />
                  ) : partnerStep === 2 ? (
                    <BPStep1Form
                      subStep={2}
                      formData={partnerFormData}
                      setFormData={setPartnerFormData}
                      onNext={() => setPartnerStep(3)}
                      onBack={() => setPartnerStep(1)}
                    />
                  ) : (
                    <BPStep2Form
                      uploads={partnerUploads}
                      setUploads={setPartnerUploads}
                      onSubmit={handlePartnerSubmit}
                      onBack={() => setPartnerStep(2)}
                    />
                  )}

                  <Text style={styles.loginCopy}>
                    Already have an account? <Text style={styles.loginLink} onPress={onBackToLogin}>Log In</Text>
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {showPartnerReminder && (
        <BPRemindersModal
          onProceed={() => {
            setShowPartnerReminder(false);
            setRole('partner');
          }}
        />
      )}
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
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 34,
    gap: 10,
  },
  screenCard: {
    paddingHorizontal: 10,
    paddingBottom: 18,
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
  },
  segmentGhost: {
    flex: 1,
    minHeight: 30,
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#97A8B9',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 30,
  },
  segmentButtonActive: {
    backgroundColor: loginColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  partnerCard: {
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: loginColors.surface,
    gap: 16,
  },
  partnerHeader: {
    alignItems: 'center',
    gap: 6,
  },
  partnerTitle: {
    color: loginColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  partnerCopy: {
    color: '#7B8EA5',
    fontSize: 12,
    textAlign: 'center',
  },
  loginCopy: {
    color: '#71859A',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
  },
  loginLink: {
    color: loginColors.accent,
  },
});
