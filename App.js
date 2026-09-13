import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Frontend/pages/authentication/login';
import Landing from './Frontend/pages/landing';
import Garden from './Frontend/pages/garden/garden';
import NewGarden from './Frontend/pages/garden/newGarden';
import Plants from './Frontend/pages/plants';
import EStyleSheet from 'react-native-extended-stylesheet';
import Register from './Frontend/pages/authentication/register';
import Dashboard from './Frontend/pages/dashboard';
import { useEffect } from 'react';
import { init, ApiError } from './Frontend/src/api-calls.js';
import { LogBox, Platform } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await init();
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : 'Backend API did not respond during startup.';
        if (!cancelled && __DEV__) {
          console.warn('[PLAN-IT] API init:', msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Quiet a couple of known RN warnings; keep real errors visible.
  if (Platform.OS !== 'web') {
    LogBox.ignoreLogs([
      'Warning: componentWillReceiveProps',
      'Non-serializable values were found in the navigation state',
    ]);
  }

  EStyleSheet.build({});

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F7F9F6' },
        }}
      >
        <Stack.Screen name="Landing" component={Landing} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="NewGarden" component={NewGarden} />
        <Stack.Screen name="Garden" component={Garden} />
        <Stack.Screen
          name="Plants"
          component={Plants}
          initialParams={{ demo: false }}
        />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
