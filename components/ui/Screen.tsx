/**
 * components/ui/Screen.tsx
 * ========================
 * Conteneur racine de tout écran.
 *
 * Répond à un défaut de la v1 : aucun écran ne gérait les zones sûres, si
 * bien que les boutons d'action passaient sous la barre d'accueil des
 * iPhone. Ici c'est traité une fois pour toutes.
 */

import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

export interface ScreenProps {
  children: ReactNode;
  /** Rend le contenu défilant et gère le clavier. */
  scroll?: boolean;
  /** Applique la marge latérale standard. */
  padded?: boolean;
  /**
   * Bords où appliquer la zone sûre. Par défaut le haut seulement : le bas
   * est généralement géré par la barre d'onglets ou une barre d'action.
   */
  edges?: ('top' | 'bottom')[];
  /** Barre d'action collée en bas, hors de la zone défilante. */
  footer?: ReactNode;
  /** Fond alternatif (`surface` au lieu de `background`). */
  surface?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Rafraîchissement tiré vers le bas, transmis au `ScrollView`. */
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  footer,
  surface = false,
  contentContainerStyle,
  refreshControl,
}: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const background = surface ? t.colors.surface : t.colors.background;
  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0;

  const inner = padded ? { paddingHorizontal: t.spacing.lg } : null;

  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        inner,
        { paddingBottom: t.spacing.xxl },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, inner, contentContainerStyle]}>{children}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: background, paddingTop }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // Sur iOS le clavier recouvre la vue ; sur Android le redimensionnement
        // est déjà géré par le système.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer && (
          <View
            style={{
              paddingHorizontal: t.spacing.lg,
              paddingTop: t.spacing.md,
              paddingBottom: Math.max(insets.bottom, t.spacing.md),
              borderTopWidth: 1,
              borderTopColor: t.colors.border,
              backgroundColor: t.colors.surface,
            }}>
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
      {paddingBottom > 0 && <View style={{ height: paddingBottom }} />}
    </View>
  );
}
