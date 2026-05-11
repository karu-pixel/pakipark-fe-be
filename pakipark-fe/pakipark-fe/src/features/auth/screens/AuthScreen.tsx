import { useState } from 'react';

import { LoginScreen } from './LoginScreen';
import { SignUpScreen } from './SignUpScreen';

export function AuthScreen({
  onAuthSuccess,
  onBackToLauncher,
}: {
  onAuthSuccess?: (role?: 'customer' | 'admin' | 'partner') => void;
  onBackToLauncher?: () => void;
}) {
  const [screen, setScreen] = useState<'login' | 'signup'>('login');

  if (screen === 'signup') {
    return (
      <SignUpScreen
        onBackToLogin={() => setScreen('login')}
        onAuthSuccess={onAuthSuccess}
      />
    );
  }

  return (
    <LoginScreen
      onNavigateToSignUp={() => setScreen('signup')}
      onAuthSuccess={onAuthSuccess}
      onBackToLauncher={onBackToLauncher}
    />
  );
}
