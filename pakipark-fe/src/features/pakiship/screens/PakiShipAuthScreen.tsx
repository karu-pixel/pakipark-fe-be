import { useState } from 'react';

import { PakiShipCreateAccountScreen } from './PakiShipCreateAccountScreen';
import { PakiShipLoginScreen } from './PakiShipLoginScreen';

type PakiShipAuthScreenProps = {
  onBack: () => void;
  onAuthSuccess: (role: 'customer' | 'admin' | 'partner') => void;
};

export function PakiShipAuthScreen({ onBack, onAuthSuccess }: PakiShipAuthScreenProps) {
  const [screen, setScreen] = useState<'login' | 'create-account'>('login');

  if (screen === 'create-account') {
    return <PakiShipCreateAccountScreen onBackToLogin={() => setScreen('login')} />;
  }

  return (
    <PakiShipLoginScreen
      onBack={onBack}
      onNavigateToCreateAccount={() => setScreen('create-account')}
      onAuthSuccess={onAuthSuccess}
    />
  );
}
