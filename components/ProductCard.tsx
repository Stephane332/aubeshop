/**
 * components/ProductCard.tsx
 * ==========================
 * Carte produit du catalogue, dimensionnée pour une grille à deux colonnes.
 *
 * Le bouton d'ajout est un frère de la zone cliquable, jamais son enfant :
 * la v1 imbriquait deux `TouchableOpacity`, si bien qu'un appui sur
 * « Ajouter » déclenchait aussi la navigation vers la fiche sous Android.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Price, Text, VerifiedBadge } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatXOF } from '@/lib/money';
import type { Product } from '@/types';

export interface ProductCardProps {
  product: Product;
  /** Absent = carte en lecture seule (aperçu vendeur, historique). */
  onAdd?: (product: Product) => void;
  /** Quantité déjà au panier, affichée sur le bouton. */
  inCart?: number;
}

function ProductCardBase({ product, onAdd, inCart = 0 }: ProductCardProps) {
  const t = useTheme();
  const router = useRouter();

  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 3;
  const cover = product.images[0];

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${product.title}, ${formatXOF(product.price)}${
          soldOut ? ', en rupture' : ''
        }`}
        onPress={() => router.push(`/product/${product.id}`)}
        style={({ pressed }) => ({
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: t.colors.border,
          opacity: pressed ? 0.9 : 1,
          ...t.elevation(t.isDark ? 0 : 1),
        })}>
        <View style={{ aspectRatio: 1, backgroundColor: t.colors.surfaceAlt }}>
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={180}
              // Une image absente ne doit pas déclencher d'appel réseau vers
              // un service tiers, comme le faisait `via.placeholder.com`.
              placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={28} color={t.colors.textSubtle} />
            </View>
          )}

          {soldOut && (
            <View
              style={{
                ...StyleSheetAbsoluteFill,
                backgroundColor: t.colors.overlay,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text variant="captionStrong" style={{ color: '#FFFFFF' }}>
                Rupture de stock
              </Text>
            </View>
          )}
        </View>

        <View style={{ padding: t.spacing.md, gap: t.spacing.xs }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {product.title}
          </Text>

          <Price value={product.price} size="md" />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
            <Ionicons name="storefront-outline" size={12} color={t.colors.textSubtle} />
            <Text variant="caption" tone="subtle" numberOfLines={1} style={{ flex: 1 }}>
              {product.vendorName}
            </Text>
          </View>

          {/* La marque de confiance est l'argument central d'AubeShop ;
              la v1 avait le composant mais ne l'affichait nulle part. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs }}>
            <VerifiedBadge kind={product.vendorKind} />
          </View>

          {lowStock && (
            <Text variant="caption" tone="warning">
              Plus que {product.stock} en stock
            </Text>
          )}
        </View>
      </Pressable>

      {/* Frère de la zone cliquable, pas enfant — voir l'en-tête du fichier. */}
      {onAdd && !soldOut && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ajouter ${product.title} au panier`}
          onPress={() => onAdd(product)}
          style={({ pressed }) => ({
            position: 'absolute',
            right: t.spacing.sm,
            // Posé sur la limite entre l'image et le texte.
            top: '50%',
            marginTop: -20,
            width: 40,
            height: 40,
            borderRadius: t.radius.full,
            backgroundColor: inCart > 0 ? t.colors.success : t.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.75 : 1,
            ...t.elevation(2),
          })}>
          {inCart > 0 ? (
            <Text variant="captionStrong" style={{ color: '#FFFFFF' }}>
              {inCart}
            </Text>
          ) : (
            <Ionicons name="add" size={22} color={t.colors.onPrimary} />
          )}
        </Pressable>
      )}
    </View>
  );
}

/** Évite de redessiner toute la grille au défilement. */
export const ProductCard = memo(ProductCardBase);

/** Équivalent local de `StyleSheet.absoluteFillObject`, sans import. */
const StyleSheetAbsoluteFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;
