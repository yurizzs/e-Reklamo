import React, { useState, useEffect } from 'react';
import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useColorScheme, Platform } from 'react-native';
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
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          input:focus, input:hover, input:active, textarea:focus, textarea:hover, textarea:active {
            outline: none !important;
            box-shadow: none !important;
            border-color: inherit !important;
          }
        `}} />
      )}
      {!isSplashFinished && (
        <SplashScreen onFinish={() => setIsSplashFinished(true)} />
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8F9FC' },
        }}
      >
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="complaint-form" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
      </Stack>
    </ThemeProvider>
  );
}
