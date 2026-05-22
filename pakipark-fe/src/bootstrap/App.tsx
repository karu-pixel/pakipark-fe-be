import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthScreen } from '@features/auth/screens/AuthScreen';
import { ServiceSelectionScreen } from '@features/launcher/screens/ServiceSelectionScreen';
import PakiShipApp from '@features/pakiship/PakiShipApp';
import { RootNavigator } from '@navigation/RootNavigator';

type PakiParkRole = 'customer' | 'admin' | 'staff' | 'partner' | 'teller' | 'business_partner';

const isManagementRole = (role?: string) =>
  role === 'admin' || role === 'staff' || role === 'partner' || role === 'teller' || role === 'business_partner';

export default function App() {
  const [route, setRoute] = useState<'launcher' | 'pakipark-auth' | 'pakipark-app' | 'pakiship-app'>('launcher');
  const [authenticatedAsAdmin, setAuthenticatedAsAdmin] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const keepLoggedIn = await AsyncStorage.getItem('pakipark_keep_logged_in');
        
        if (keepLoggedIn !== 'true') {
          // If keep me logged in was not selected, clear session on fresh reload
          await AsyncStorage.multiRemove(['pakipark_api_token', 'pakipark_api_user']);
          return;
        }

        const token = await AsyncStorage.getItem('pakipark_api_token');
        const userStr = await AsyncStorage.getItem('pakipark_api_user');
        console.log('[restoreSession] Token found:', !!token, 'User found:', !!userStr);
        if (token) {
          if (userStr) {
            const user = JSON.parse(userStr);
            setAuthenticatedAsAdmin(isManagementRole(user.role));
          } else {
            setAuthenticatedAsAdmin(false); // Fallback to customer
          }
          setHasSession(true);
          setRoute('pakipark-app'); // Automatically route to app if session restored
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      }
    };
    void restoreSession();
  }, []);

  const handleServiceSelect = (service: 'pakiship' | 'pakipark') => {
    if (service === 'pakiship') {
      setRoute('pakiship-app');
    } else {
      setRoute('pakipark-auth');
    }
  };

  const handlePakiParkAuthSuccess = (role: PakiParkRole = 'customer') => {
    // Both admin and partner roles use the management dashboard
    setAuthenticatedAsAdmin(isManagementRole(role));
    setHasSession(true);
    setRoute('pakipark-app');
  };

  const handleBackToLauncher = () => {
    setRoute('launcher');
  };

  if (route === 'pakiship-app') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <PakiShipApp onBackToLauncher={handleBackToLauncher} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {route === 'pakipark-app' ? (
        <RootNavigator 
          initialRouteName={authenticatedAsAdmin ? 'AdminHome' : 'CustomerHome'} 
          onLogoutToAuth={() => { setHasSession(false); setRoute('pakipark-auth'); }} 
          onNavigateToPakiShip={() => setRoute('pakiship-app')}
        />
      ) : route === 'pakipark-auth' ? (
        <AuthScreen
          onAuthSuccess={handlePakiParkAuthSuccess}
          onBackToLauncher={handleBackToLauncher}
          onNavigateToPakiShip={() => setRoute('pakiship-app')}
        />
      ) : (
        <ServiceSelectionScreen onSelectService={handleServiceSelect} />
      )}
    </SafeAreaProvider>
  );
}
