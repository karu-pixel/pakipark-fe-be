import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '@features/home/screens/HomeScreen';
import { AuthScreen } from '@features/auth/screens/AuthScreen';
import { PakiParkCustomerHomeScreen } from '@features/customer/screens/PakiParkCustomerHomeScreen';
import { AdminHomeScreen } from '@features/admin/screens/AdminHomeScreen';
import type { RootStackParamList } from '@navigation/types';
import { colors } from '@theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
  },
};

export function RootNavigator({
  initialRouteName,
  onLogoutToAuth,
}: {
  initialRouteName?: keyof RootStackParamList;
  onLogoutToAuth?: () => void;
}) {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={initialRouteName ?? 'CustomerHome'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Auth">
          {({ navigation }) => (
            <AuthScreen
              onAuthSuccess={(role) => navigation.replace(role === 'admin' || role === 'partner' ? 'AdminHome' : 'CustomerHome')}
              onBackToLauncher={() => navigation.replace('Home')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="CustomerHome">
          {() => <PakiParkCustomerHomeScreen onLogoutToAuth={onLogoutToAuth} />}
        </Stack.Screen>
        <Stack.Screen name="AdminHome">
          {() => <AdminHomeScreen onLogoutToAuth={onLogoutToAuth} />}
        </Stack.Screen>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
