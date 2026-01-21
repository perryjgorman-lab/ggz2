import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a73e8'
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600'
          }
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Scan2Market'
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
      </Stack>
    </>
  );
}
