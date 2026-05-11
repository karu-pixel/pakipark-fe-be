import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState } from 'react';

import { AuthScreen } from '@features/auth/screens/AuthScreen';
import { ServiceSelectionScreen } from '@features/launcher/screens/ServiceSelectionScreen';
// import PakiShipApp from '@features/pakiship/PakiShipApp';
import { RootNavigator } from '@navigation/RootNavigator';

export default function App() {
  const [route, setRoute] = useState<'launcher' | 'pakipark-auth' | 'pakipark-app' | 'pakiship-app'>('launcher');
  const [authenticatedAsAdmin, setAuthenticatedAsAdmin] = useState(false);

  const handleServiceSelect = (service: 'pakiship' | 'pakipark') => {
    setRoute(service === 'pakiship' ? 'pakiship-app' : 'pakipark-auth');
  };

  const handlePakiParkAuthSuccess = (role: 'customer' | 'admin' | 'partner' = 'customer') => {
    // Both admin and partner roles use the management dashboard
    setAuthenticatedAsAdmin(role === 'admin' || role === 'partner');
    setRoute('pakipark-app');
  };

  const handleBackToLauncher = () => {
    setAuthenticatedAsAdmin(false);
    setRoute('launcher');
  };

/*
  if (route === 'pakiship-app') {
    return <PakiShipApp onBackToLauncher={handleBackToLauncher} />;
  }
*/

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {route === 'pakipark-app' ? (
        <RootNavigator initialRouteName={authenticatedAsAdmin ? 'AdminHome' : 'CustomerHome'} onLogoutToAuth={() => setRoute('pakipark-auth')} />
      ) : route === 'pakipark-auth' ? (
        <AuthScreen onAuthSuccess={handlePakiParkAuthSuccess} onBackToLauncher={handleBackToLauncher} />
      ) : (
        <ServiceSelectionScreen onSelectService={handleServiceSelect} />
      )}
    </SafeAreaProvider>
  );
}
