/**
 * hooks/use-theme.ts
 * ==================
 * Accès au design system depuis n'importe quel composant.
 *
 *   const t = useTheme();
 *   <View style={{ backgroundColor: t.colors.surface, padding: t.spacing.lg }} />
 *
 * Les styles qui dépendent du thème doivent être construits dans le rendu
 * (ou via `useThemedStyles`) et non dans un `StyleSheet.create` au niveau
 * module, sinon ils resteraient figés sur la palette claire.
 */

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { Colors, Palette, Theme, elevation } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface AppTheme {
  /** 'light' | 'dark' — utile pour les barres de statut et les images. */
  scheme: 'light' | 'dark';
  isDark: boolean;
  colors: Palette;
  spacing: typeof Theme.spacing;
  radius: typeof Theme.radius;
  type: typeof Theme.type;
  fonts: typeof Theme.fonts;
  duration: typeof Theme.duration;
  /** Ombre portée déjà teintée par le thème. */
  elevation: (level: 0 | 1 | 2 | 3) => object;
}

export function useTheme(): AppTheme {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return useMemo(() => {
    const colors = Colors[scheme];
    return {
      scheme,
      isDark: scheme === 'dark',
      colors,
      ...Theme,
      elevation: (level: 0 | 1 | 2 | 3) => elevation(colors, level),
    };
  }, [scheme]);
}

/**
 * Construit une feuille de styles dépendante du thème, mémoïsée par palette.
 *
 *   const styles = useThemedStyles((t) => ({
 *     card: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg },
 *   }));
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: AppTheme) => T
): T {
  const theme = useTheme();
  // `factory` est redéfinie à chaque rendu par l'appelant ; on ne dépend que
  // du thème, ce qui est le comportement voulu.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
