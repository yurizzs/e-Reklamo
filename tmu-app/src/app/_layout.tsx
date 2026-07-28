import React, { useState, useEffect } from 'react';
import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { SplashScreen } from '@/components/splash-screen';

// Prevent Expo splash screen from auto-hiding before our custom splash runs
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  useEffect(() => {
    // Hide native splash screen once initial app mounts
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {!isSplashFinished && (
        <SplashScreen onFinish={() => setIsSplashFinished(true)} />
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#040c07' },
        }}
      >
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
      </Stack>
    </ThemeProvider>
  );
}
