import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { db } from '../src/services/database';
import { AppResetProvider } from '../src/state/AppResetContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    async function init() {
      try {
        await db.init();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppResetProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="analyze/wizard"
          options={{
            presentation: 'card',
            headerShown: true,
            headerTitle: 'Analyze Listing',
          }}
        />
        <Stack.Screen
          name="analyze/result/[id]"
          options={{
            presentation: 'card',
            headerShown: true,
            headerTitle: 'Risk Report',
          }}
        />
      </Stack>
    </AppResetProvider>
  );
}
