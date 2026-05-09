import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useAppTranslation } from '@/src/hooks/use-app-translation';
import '@/src/i18n';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDB } from '@/src/database/db';
import { startAutoSync } from '@/src/services/syncService';
import useAuthGuard from '@/src/hooks/useAuthGuard';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { t } = useAppTranslation();

  // Redireciona baseado no status de autenticação e aprovação do perfil
  useAuthGuard();

  useEffect(() => {
    initDB().catch((err: unknown) => {
      console.error('initDB failed:', err);
    });

    const stopSync = startAutoSync();

    return () => {
      stopSync();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: t('modal.title') }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
