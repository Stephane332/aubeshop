import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * ProtectionWrapper - Vérifie l'auth et redirige si nécessaire
 */
function ProtectionWrapper() {
  const { currentUser, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [navigated, setNavigated] = useState(false);

  useEffect(() => {
    if (loading || navigated) return;

    const isInAuthGroup = segments[0] === 'auth';
    const isPublic = segments[0] === '(tabs)' || segments[0] === 'product' || segments[0] === 'order' || segments[0] === 'checkout';

    // Si user n'est pas connecté ET essaie d'aller vers une route protégée
    if (!currentUser && !isInAuthGroup && !isPublic) {
      router.replace('/auth/login');
      setNavigated(true);
    }
    // Si user est connecté ET est sur login/signup, redirige vers home
    else if (currentUser && isInAuthGroup) {
      router.replace('/');
      setNavigated(true);
    }
  }, [currentUser, loading, segments, navigated, router]);

  if (loading) {
    return null; // Attendre que auth charge
  }

  return <Stack />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ProtectionWrapper />
          <StatusBar style="auto" />
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}
