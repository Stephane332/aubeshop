/**
 * components/ui/Card.tsx
 * ======================
 * Surface élevée : la brique de mise en page de l'app.
 */

import { type ReactNode } from 'react';
import {
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export interface CardProps {
  children: ReactNode;
  /** Rend la carte activable ; ajoute le rôle d'accessibilité qui va avec. */
  onPress?: () => void;
  /** Libellé lu par les lecteurs d'écran quand la carte est activable. */
  accessibilityLabel?: string;
  /** 0 = plate avec bordure, 1 à 3 = ombre croissante. */
  level?: 0 | 1 | 2 | 3;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  accessibilityLabel,
  level = 1,
  padded = true,
  style,
}: CardProps) {
  const t = useTheme();

  const base: ViewStyle = {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    padding: padded ? t.spacing.lg : 0,
    // En mode sombre l'ombre ne se voit pas : une bordure prend le relais
    // pour détacher la carte du fond.
    borderWidth: t.isDark || level === 0 ? 1 : 0,
    borderColor: t.colors.border,
    ...t.elevation(t.isDark ? 0 : level),
  };

  if (!onPress) return <View style={[base, style]}>{children}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.85 }, style]}>
      {children}
    </Pressable>
  );
}
