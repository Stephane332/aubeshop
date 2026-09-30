/**
 * components/ui/Avatar.tsx
 * ========================
 * Portrait d'un utilisateur ou logo d'une boutique.
 *
 * Sans image, on retombe sur les initiales posées sur une couleur **dérivée
 * du nom**. La v1 tirait la couleur au hasard à chaque rendu, si bien que
 * l'avatar changeait de teinte en défilant.
 */

import { Image } from 'expo-image';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';

/** Teintes de repli, lisibles en clair comme en sombre. */
const TINTS = [
  '#C81E3C',
  '#B45309',
  '#0E7C3A',
  '#1D4ED8',
  '#7C3AED',
  '#0E7490',
  '#BE185D',
  '#4D7C0F',
];

/** Hachage stable : le même nom donne toujours la même couleur. */
function tintFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return TINTS[Math.abs(hash) % TINTS.length];
}

/** « Awa Traoré » → « AT ». */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const letters = parts.slice(0, 2).map((p) => p[0]!.toUpperCase());
  return letters.join('');
}

export function Avatar({
  name,
  uri,
  size = 44,
}: {
  name: string;
  uri?: string;
  size?: number;
}) {
  const t = useTheme();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        // Décrit par le contexte environnant ; l'annoncer deux fois est du bruit.
        accessibilityElementsHidden
        style={{
          width: size,
          height: size,
          borderRadius: t.radius.full,
          backgroundColor: t.colors.surfaceAlt,
        }}
        contentFit="cover"
        transition={160}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: t.radius.full,
        backgroundColor: tintFor(name || '?'),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        variant={size >= 56 ? 'subheading' : 'captionStrong'}
        style={{ color: '#FFFFFF' }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
