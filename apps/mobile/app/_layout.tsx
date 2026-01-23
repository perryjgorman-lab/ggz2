import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ProProvider } from '../src/providers';

// Consistent accent color across the app
const ACCENT_COLOR = '#0f766e'; // Teal-700

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ProProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? '#0d1117' : ACCENT_COLOR
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600'
          },
          contentStyle: {
            backgroundColor: isDark ? '#0d1117' : '#f8fafc'
          }
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Scan2Flip'
          }}
        />
        <Stack.Screen
          name="scan"
          options={{
            title: 'Scan Barcode',
            presentation: 'fullScreenModal'
          }}
        />
        <Stack.Screen
          name="product"
          options={{
            title: 'Product Details'
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: 'Scan History'
          }}
        />
        <Stack.Screen
          name="marketplace"
          options={{
            title: 'Facebook Marketplace',
            presentation: 'modal'
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            title: 'Upgrade to Pro',
            presentation: 'modal',
            headerShown: false
          }}
        />
      </Stack>
    </ProProvider>
  );
}
