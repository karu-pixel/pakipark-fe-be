import { useState } from 'react';

import { LoginScreen } from './LoginScreen';
import { SignUpScreen } from './SignUpScreen';

type PakiParkRole = 'customer' | 'admin' | 'staff' | 'partner' | 'teller' | 'business_partner';

export function AuthScreen({
  onAuthSuccess,
  onBackToLauncher,
  onNavigateToPakiShip,
}: {
  onAuthSuccess?: (role?: PakiParkRole) => void;
  onBackToLauncher?: () => void;
  onNavigateToPakiShip?: () => void;
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
      onNavigateToPakiShip={onNavigateToPakiShip}
    />
  );
}
