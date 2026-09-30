/**
 * components/Logo.tsx
 * ===================
 * Marque AubeShop, dessinée en vues natives.
 *
 * « Aube » : un soleil levant au-dessus de l'horizon, dans le rouge de la
 * marque. Pas de fichier image, donc net à toutes les densités et
 * automatiquement adapté au thème sombre.
 */

import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function Logo({ size = 48 }: { size?: number }) {
  const t = useTheme();

  const disc = size * 0.52;
  const barWidth = size * 0.68;
  const barHeight = Math.max(2, size * 0.075);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="AubeShop"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: t.colors.primary,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: size * 0.2,
        overflow: 'hidden',
      }}>
      {/* Le soleil, à demi masqué par l'horizon. */}
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.3,
          width: disc,
          height: disc,
          borderRadius: disc / 2,
          backgroundColor: t.colors.onPrimary,
          opacity: 0.95,
        }}
      />
      {/* L'horizon, qui recouvre la moitié basse du disque. */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: size,
          height: size * 0.3,
          backgroundColor: t.colors.primary,
        }}
      />
      <View
        style={{
          width: barWidth,
          height: barHeight,
          borderRadius: barHeight,
          backgroundColor: t.colors.onPrimary,
        }}
      />
    </View>
  );
}
