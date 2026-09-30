/**
 * app/_layout.tsx
 * ===============
 * Racine de l'application : fournisseurs, thème et garde d'accès.
 *
 * La garde de la v1 était inopérante à trois titres : elle ne vérifiait que
 * l'authentification et jamais le rôle (tout client connecté pouvait ouvrir
 * `/admin`), elle classait `checkout` parmi les routes publiques, et un
 * verrou `navigated` à usage unique la désactivait définitivement après la
 * première redirection.
 */

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SetupRequired } from '@/components/SetupRequired';
import { ToastProvider } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { useTheme } from '@/hooks/use-theme';
import { isFirebaseConfigured } from '@/lib/firebase.config';

export const unstable_settings = { anchor: '(tabs)' };

/**
 * Routes accessibles sans compte : la découverte du catalogue doit rester
 * ouverte, tout le reste demande une session.
 */
const PUBLIC_SEGMENTS = new Set(['auth', 'product']);

function Gate() {
  const { isAuthenticated, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const section = segments[0];

  useEffect(() => {
    // Tant que la session n'est pas résolue, toute redirection serait
    // prématurée : on afficherait l'écran de connexion à quelqu'un de déjà
    // connecté, le temps que Firebase relise son jeton.
    if (initializing) return;

    const isPublic = section === undefined || PUBLIC_SEGMENTS.has(section);
    const inAuthFlow = section === 'auth';

    if (!isAuthenticated && !isPublic) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthFlow) {
      router.replace('/');
    }
    // Pas de verrou « déjà navigué » : la garde doit rester active pendant
    // toute la durée de la session.
  }, [isAuthenticated, initializing, section, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="become/[kind]" />
      <Stack.Screen name="vendor/product-form" options={{ presentation: 'modal' }} />
      <Stack.Screen name="account/address" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

/** Applique la palette AubeShop à la navigation elle-même. */
function Navigation() {
  const t = useTheme();

  const navTheme = useMemo<NavTheme>(() => {
    const base = t.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        // La v1 laissait le turquoise Expo (#0a7ea4) piloter la navigation
        // pendant que le reste de l'app utilisait le rouge de la marque.
        primary: t.colors.primary,
        background: t.colors.background,
        card: t.colors.surface,
        text: t.colors.text,
        border: t.colors.border,
        notification: t.colors.primary,
      },
    };
  }, [t]);

  return (
    <ThemeProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: t.colors.background }}>
        {/* Sans projet Firebase relié, rien ne peut fonctionner : on
            l'explique plutôt que de laisser une page blanche. */}
        {isFirebaseConfigured ? <Gate /> : <SetupRequired />}
      </View>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Navigation />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Réexporté pour que les écrans puissent lire la palette hors du hook. */
export { Colors };
