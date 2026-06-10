import React, { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { StatusBar } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Mulish_400Regular,
  Mulish_600SemiBold,
  Mulish_700Bold,
  Mulish_800ExtraBold,
} from '@expo-google-fonts/mulish';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { apiGet } from '../lib/api';
import { useTheme } from '../lib/theme';
import type { Profile } from '@mockly/shared';

SplashScreen.preventAutoHideAsync();

if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Mulish_400Regular,
    Mulish_600SemiBold,
    Mulish_700Bold,
    Mulish_800ExtraBold,
  });

  const { setUser, setProfile, isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        apiGet<{ profile: Profile }>('/api/auth/profile')
          .then(r => setProfile(r.profile))
          .catch(err => console.error('[Auth] Failed to load profile:', err));
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        apiGet<{ profile: Profile }>('/api/auth/profile')
          .then(r => setProfile(r.profile))
          .catch(err => console.error('[Auth] Failed to load profile:', err));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;
    SplashScreen.hideAsync();
    const inAuthGroup = segments[0] === '(auth)';
    const currentScreen = segments[segments.length - 1];
    const onboardingScreens = ['onboarding', 'verify-email'];
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && !onboardingScreens.includes(currentScreen)) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, fontsLoaded, segments]);

  if (!fontsLoaded || isLoading) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
        translucent={false}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="session" />
        <Stack.Screen name="questions-bank" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </QueryClientProvider>
  );
}
