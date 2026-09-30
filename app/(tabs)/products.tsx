/**
 * app/(tabs)/products.tsx
 * =======================
 * Catalogue personnel du vendeur.
 *
 * Écran entièrement absent de la v1 : le profil pointait vers
 * `/vendor/products`, une route qui n'existait pas.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Price,
  RowSkeleton,
  Screen,
  Text,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { confirm } from '@/lib/feedback';
import { removeProduct, setProductVisibility, watchVendorProducts } from '@/lib/productService';
import type { Product } from '@/types';

export default function VendorProductsScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchVendorProducts(
      user.uid,
      (list) => {
        setProducts(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [user]);

  const toggleVisibility = async (product: Product) => {
    const makeVisible = product.status !== 'active';
    try {
      await setProductVisibility(product.id, makeVisible);
      toast.success(makeVisible ? 'Produit remis en vente' : 'Produit masqué');
    } catch {
      toast.error('Modification impossible.');
    }
  };

  const handleRemove = async (product: Product) => {
    const ok = await confirm({
      title: 'Retirer ce produit ?',
      message: `« ${product.title} » disparaîtra du catalogue. Vos ventes passées sont conservées.`,
      confirmLabel: 'Retirer',
      destructive: true,
    });
    if (!ok) return;

    try {
      await removeProduct(product.id);
      toast.success('Produit retiré');
    } catch {
      toast.error('Suppression impossible.');
    }
  };

  const header = (
    <View style={{ gap: t.spacing.md, paddingBottom: t.spacing.md }}>
      <Text variant="title">Mes produits</Text>
      <Button
        label="Ajouter un produit"
        icon="add-circle-outline"
        block
        onPress={() => router.push('/vendor/product-form')}
      />
    </View>
  );

  if (loading) {
    return (
      <Screen>
        <View style={{ gap: t.spacing.md, paddingTop: t.spacing.md }}>
          {header}
          <RowSkeleton />
          <RowSkeleton />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.md,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.md,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card padded={false}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md, padding: t.spacing.md }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: t.radius.md,
                  overflow: 'hidden',
                  backgroundColor: t.colors.surfaceAlt,
                }}>
                {item.images[0] ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={20} color={t.colors.textSubtle} />
                  </View>
                )}
              </View>

              <View style={{ flex: 1, gap: t.spacing.xs }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {item.title}
                </Text>
                <Price value={item.price} size="sm" />

                <View style={{ flexDirection: 'row', gap: t.spacing.xs, flexWrap: 'wrap' }}>
                  {item.status === 'hidden' ? (
                    <Badge label="Masqué" tone="neutral" icon="eye-off-outline" />
                  ) : item.stock === 0 ? (
                    <Badge label="Rupture" tone="danger" />
                  ) : item.stock <= 3 ? (
                    <Badge label={`Plus que ${item.stock}`} tone="warning" />
                  ) : (
                    <Badge label={`${item.stock} en stock`} tone="success" />
                  )}
                  {item.soldCount > 0 && (
                    <Badge label={`${item.soldCount} vendu(s)`} tone="info" />
                  )}
                </View>
              </View>

              <View style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <IconButton
                  icon="create-outline"
                  label={`Modifier ${item.title}`}
                  size={36}
                  onPress={() =>
                    router.push({ pathname: '/vendor/product-form', params: { id: item.id } })
                  }
                />
                <IconButton
                  icon={item.status === 'active' ? 'eye-off-outline' : 'eye-outline'}
                  label={item.status === 'active' ? 'Masquer' : 'Remettre en vente'}
                  tone="muted"
                  size={36}
                  onPress={() => toggleVisibility(item)}
                />
                <IconButton
                  icon="trash-outline"
                  label={`Retirer ${item.title}`}
                  tone="danger"
                  size={36}
                  onPress={() => handleRemove(item)}
                />
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          error ? (
            <ErrorState message={error} />
          ) : (
            <EmptyState
              icon="pricetags-outline"
              title="Aucun produit en vente"
              message="Publiez votre premier article pour qu'il apparaisse au catalogue du campus."
              actionLabel="Ajouter un produit"
              onAction={() => router.push('/vendor/product-form')}
            />
          )
        }
      />
    </Screen>
  );
}
