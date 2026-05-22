import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { clearSession, getSavedUser } from '../../lib/api';
import { PakiShipLoginScreen } from './screens/PakiShipLoginScreen';
import { PakiShipCreateAccountScreen } from './screens/PakiShipCreateAccountScreen';
import { PakiShipDashboard } from './components/PakiShipDashboard';

export default function PakiShipApp({ onBackToLauncher }: { onBackToLauncher: () => void }) {
  const [isLoading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [screen, setScreen] = useState<'login' | 'create-account' | 'dashboard'>('login');

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getSavedUser();
        if (user) {
          setCurrentUser(user);
          setScreen('dashboard');
        } else {
          setScreen('login');
        }
      } catch {
        setScreen('login');
      } finally {
        setLoading(false);
      }
    }
    void checkAuth();
  }, []);

  const handleAuthSuccess = async (role?: string) => {
    const user = await getSavedUser();
    setCurrentUser(user);
    setScreen('dashboard');
  };

  const handleLogout = async () => {
    setLoading(true);
    await clearSession();
    setCurrentUser(null);
    setScreen('login');
    setLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39B5A8" />
      </View>
    );
  }

  if (screen === 'dashboard' && currentUser) {
    return (
      <PakiShipDashboard
        userName={currentUser.name || 'PakiShip User'}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === 'create-account') {
    return (
      <PakiShipCreateAccountScreen
        onBackToLogin={() => setScreen('login')}
      />
    );
  }

  return (
    <PakiShipLoginScreen
      onBack={onBackToLauncher}
      onNavigateToCreateAccount={() => setScreen('create-account')}
      onAuthSuccess={handleAuthSuccess}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#DBF0EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
