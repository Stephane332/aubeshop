/**
 * components/ui/Skeleton.tsx
 * ==========================
 * Substituts de contenu pendant le chargement.
 *
 * Remplace le `LoadingSpinner` plein écran de la v1 : conserver la forme de
 * la page évite le saut de mise en page à l'arrivée des données, et l'attente
 * paraît plus courte.
 */

import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

export function Skeleton({
  width = '100%',
  height = 16,
  radius,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.5, { duration: 700 })
      ),
      -1,
      false
    );
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      // Un substitut n'a rien à annoncer : on le masque aux lecteurs d'écran.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? t.radius.sm,
          backgroundColor: t.colors.skeleton,
        },
        animated,
        style,
      ]}
    />
  );
}

/** Silhouette d'une carte produit, pour la grille du catalogue. */
export function ProductCardSkeleton() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, gap: t.spacing.sm }}>
      <Skeleton height={140} radius={t.radius.lg} />
      <Skeleton width="85%" height={14} />
      <Skeleton width="45%" height={14} />
    </View>
  );
}

/** Silhouette d'une ligne de liste (commande, course, candidature). */
export function RowSkeleton() {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: t.spacing.md,
        alignItems: 'center',
        padding: t.spacing.lg,
        backgroundColor: t.colors.surface,
        borderRadius: t.radius.lg,
      }}>
      <Skeleton width={56} height={56} radius={t.radius.md} />
      <View style={{ flex: 1, gap: t.spacing.sm }}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}
