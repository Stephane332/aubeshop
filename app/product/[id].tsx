/**
 * app/product/[id].tsx
 * ====================
 * Fiche produit.
 *
 * La v1 n'affichait ni le stock, ni le vendeur, ni les avis, et n'exposait
 * qu'une seule image alors que le modèle en prévoyait plusieurs. Surtout,
 * elle ne montrait nulle part que le vendeur était un étudiant vérifié —
 * c'est pourtant l'argument central d'AubeShop.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Card,
  ErrorState,
  IconButton,
  Price,
  Screen,
  Skeleton,
  Text,
  VerifiedBadge,
  useToast,
} from '@/components/ui';
import { categoryLabel } from '@/constants/catalog';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/feedback';
import { formatXOF } from '@/lib/money';
import { fetchProduct } from '@/lib/productService';
import type { Product } from '@/types';

export default function ProductScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user } = useAuth();
  const { add, quantityOf } = useCart();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setProduct(await fetchProduct(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Produit introuvable.');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  if (!product) return <ProductSkeleton />;

  const soldOut = product.stock <= 0;
  const alreadyInCart = quantityOf(product.id);
  const maxAddable = Math.max(0, product.stock - alreadyInCart);
  const width = Dimensions.get('window').width;

  const handleAdd = async () => {
    if (!user) {
      toast.info('Connectez-vous pour commander');
      router.push('/auth/login');
      return;
    }
    haptic('success');
    await add(
      {
        productId: product.id,
        title: product.title,
        image: product.images[0],
        unitPrice: product.price,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        maxStock: product.stock,
      },
      quantity
    );
    toast.success(`${quantity} × ${product.title} au panier`);
    setQuantity(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: t.spacing.xxxl }}>
        {/* Galerie */}
        <View style={{ height: width, backgroundColor: t.colors.surfaceAlt }}>
          {product.images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))
              }>
              {product.images.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={{ width, height: width }}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={48} color={t.colors.textSubtle} />
            </View>
          )}

          {/* Retour, posé sur l'image */}
          <View style={{ position: 'absolute', top: insets.top + t.spacing.sm, left: t.spacing.md }}>
            <View
              style={{
                borderRadius: t.radius.full,
                backgroundColor: t.colors.surface,
                ...t.elevation(2),
              }}>
              <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
            </View>
          </View>

          {/* Pagination de la galerie */}
          {product.images.length > 1 && (
            <View
              style={{
                position: 'absolute',
                bottom: t.spacing.md,
                alignSelf: 'center',
                flexDirection: 'row',
                gap: t.spacing.xs,
              }}>
              {product.images.map((uri, i) => (
                <View
                  key={uri}
                  style={{
                    width: i === imageIndex ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === imageIndex ? t.colors.primary : t.colors.surface,
                    opacity: i === imageIndex ? 1 : 0.7,
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ padding: t.spacing.lg, gap: t.spacing.xl }}>
          {/* Titre et prix */}
          <View style={{ gap: t.spacing.sm }}>
            <Badge label={categoryLabel(product.category)} tone="neutral" />
            <Text variant="title">{product.title}</Text>
            <Price value={product.price} size="xl" />

            <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
              {soldOut ? (
                <Badge label="Rupture de stock" tone="danger" icon="close-circle" />
              ) : product.stock <= 3 ? (
                <Badge label={`Plus que ${product.stock} en stock`} tone="warning" icon="alert-circle" />
              ) : (
                <Badge label={`${product.stock} disponibles`} tone="success" icon="checkmark-circle" />
              )}
              {product.soldCount > 0 && (
                <Badge label={`${product.soldCount} vendu(s)`} tone="info" />
              )}
              {product.reviewCount > 0 && (
                <Badge
                  label={`${product.rating.toFixed(1)} · ${product.reviewCount} avis`}
                  tone="primary"
                  icon="star"
                />
              )}
            </View>
          </View>

          {/* Le vendeur — la confiance est l'argument du produit. */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: t.radius.full,
                  backgroundColor: t.colors.primarySubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="storefront-outline" size={20} color={t.colors.primaryText} />
              </View>
              <View style={{ flex: 1, gap: t.spacing.xxs }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {product.vendorName}
                </Text>
                <Text variant="caption" tone="muted">
                  Campus de {product.vendorCampus}
                </Text>
              </View>
              <VerifiedBadge kind={product.vendorKind} />
            </View>
          </Card>

          {/* Description */}
          {!!product.description && (
            <View style={{ gap: t.spacing.sm }}>
              <Text variant="subheading">Description</Text>
              <Text variant="body" tone="muted">
                {product.description}
              </Text>
            </View>
          )}

          {alreadyInCart > 0 && (
            <Card level={0}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                <Ionicons name="bag-check-outline" size={18} color={t.colors.success} />
                <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                  Déjà {alreadyInCart} dans votre panier.
                </Text>
                <Button
                  label="Voir"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/cart')}
                />
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Barre d'achat, au-dessus de la zone sûre du bas */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.md,
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.md,
          paddingBottom: Math.max(insets.bottom, t.spacing.md),
          borderTopWidth: 1,
          borderTopColor: t.colors.border,
          backgroundColor: t.colors.surface,
        }}>
        {!soldOut && maxAddable > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: t.radius.md,
              borderWidth: 1,
              borderColor: t.colors.border,
            }}>
            <IconButton
              icon="remove"
              label="Diminuer la quantité"
              size={40}
              disabled={quantity <= 1}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            />
            <Text variant="bodyStrong" style={{ minWidth: 24, textAlign: 'center' }}>
              {quantity}
            </Text>
            <IconButton
              icon="add"
              label="Augmenter la quantité"
              size={40}
              disabled={quantity >= maxAddable}
              onPress={() => setQuantity((q) => Math.min(maxAddable, q + 1))}
            />
          </View>
        )}

        <Button
          label={
            soldOut
              ? 'Indisponible'
              : maxAddable === 0
                ? 'Tout est déjà au panier'
                : `Ajouter · ${formatXOF(product.price * quantity)}`
          }
          icon={soldOut || maxAddable === 0 ? undefined : 'bag-add-outline'}
          disabled={soldOut || maxAddable === 0}
          style={{ flex: 1 }}
          onPress={handleAdd}
        />
      </View>
    </View>
  );
}

function ProductSkeleton() {
  const t = useTheme();
  const width = Dimensions.get('window').width;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <Skeleton width={width} height={width} radius={0} />
      <View style={{ padding: t.spacing.lg, gap: t.spacing.md }}>
        <Skeleton width="40%" height={20} />
        <Skeleton width="85%" height={26} />
        <Skeleton width="35%" height={24} />
        <Skeleton height={72} radius={t.radius.lg} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
  );
}
