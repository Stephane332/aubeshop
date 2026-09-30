/**
 * components/home/CatalogueHome.tsx
 * =================================
 * Le catalogue — écran d'accueil du client.
 *
 * C'est la pièce qui manquait entièrement à la v1 : l'écran principal d'une
 * app de commerce y affichait encore la démo Expo (« Step 1: Try it », logo
 * React, `npm run reset-project`).
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/ProductCard';
import {
  EmptyState,
  ErrorState,
  Input,
  ProductCardSkeleton,
  Text,
  useToast,
} from '@/components/ui';
import { CATEGORIES, SORT_OPTIONS } from '@/constants/catalog';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/feedback';
import { fetchCatalog } from '@/lib/productService';
import type { CategoryId, Product, SortOption } from '@/types';

/** Délai avant de lancer une recherche, pour ne pas requêter à chaque frappe. */
const SEARCH_DEBOUNCE_MS = 350;

export function CatalogueHome() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user } = useAuth();
  const { add, quantityOf } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<unknown>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryId | undefined>();
  const [sort, setSort] = useState<SortOption>('recent');

  // Anti-rebond de la recherche.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /** Identifie la requête courante : une réponse tardive d'un filtre
   *  abandonné ne doit pas écraser les résultats affichés. */
  const requestId = useRef(0);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'more') => {
      const id = ++requestId.current;

      if (mode === 'more') setLoadingMore(true);
      else if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);

      try {
        const page = await fetchCatalog(
          { search: search || undefined, category, sort },
          mode === 'more' ? cursor : undefined
        );

        if (id !== requestId.current) return;

        setProducts((current) => (mode === 'more' ? [...current, ...page.items] : page.items));
        setCursor(page.cursor);
        setHasMore(page.hasMore);
        setError(null);
      } catch (err) {
        if (id !== requestId.current) return;
        // Contrairement à la v1 qui renvoyait `[]` en silence, on distingue
        // « aucun résultat » de « le chargement a échoué ».
        setError(err instanceof Error ? err.message : 'Chargement impossible.');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [search, category, sort, cursor]
  );

  // Rechargement à chaque changement de filtre. `load` dépend de `cursor`,
  // qu'on ne veut pas surveiller ici : seuls les filtres relancent une
  // recherche depuis le début.
  useEffect(() => {
    void load('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sort]);

  const handleAdd = useCallback(
    async (product: Product) => {
      if (!user) {
        toast.info('Connectez-vous pour commander');
        router.push('/auth/login');
        return;
      }
      haptic('success');
      await add({
        productId: product.id,
        title: product.title,
        image: product.images[0],
        unitPrice: product.price,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        maxStock: product.stock,
      });
      // Un toast, pas une modale bloquante comme dans la v1.
      toast.success(`${product.title} ajouté au panier`);
    },
    [user, add, toast, router]
  );

  const header = (
    <View style={{ gap: t.spacing.md, paddingBottom: t.spacing.md }}>
      <View style={{ gap: t.spacing.xxs }}>
        <Text variant="title">
          {user ? `Bonjour ${user.displayName.split(' ')[0]}` : 'Bienvenue sur AubeShop'}
        </Text>
        <Text variant="body" tone="muted">
          Achetez et vendez facilement sur le campus.
        </Text>
      </View>

      <Input
        placeholder="Rechercher un produit, une boutique…"
        icon="search-outline"
        value={searchInput}
        onChangeText={setSearchInput}
        returnKeyType="search"
        autoCorrect={false}
      />

      <ChipRow>
        <Chip label="Tout" active={!category} onPress={() => setCategory(undefined)} />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            icon={c.icon as keyof typeof Ionicons.glyphMap}
            active={category === c.id}
            onPress={() => setCategory(category === c.id ? undefined : c.id)}
          />
        ))}
      </ChipRow>

      <ChipRow>
        {SORT_OPTIONS.map((option) => (
          <Chip
            key={option.id}
            label={option.label}
            active={sort === option.id}
            onPress={() => setSort(option.id)}
            subtle
          />
        ))}
      </ChipRow>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, paddingHorizontal: t.spacing.lg, paddingTop: insets.top + t.spacing.md }}>
        {header}
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: t.spacing.md }}
      contentContainerStyle={{
        paddingHorizontal: t.spacing.lg,
        paddingTop: insets.top + t.spacing.md,
        paddingBottom: t.spacing.xxxl,
        gap: t.spacing.md,
      }}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <ProductCard product={item} onAdd={handleAdd} inCart={quantityOf(item.id)} />
      )}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load('refresh')}
          tintColor={t.colors.primary}
          colors={[t.colors.primary]}
        />
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (hasMore && !loadingMore) void load('more');
      }}
      ListEmptyComponent={
        error ? (
          <ErrorState message={error} onRetry={() => load('initial')} />
        ) : (
          <EmptyState
            icon="search-outline"
            title="Aucun produit trouvé"
            message={
              search || category
                ? 'Essayez d’élargir votre recherche ou de changer de catégorie.'
                : "Le catalogue est encore vide. Revenez bientôt !"
            }
            actionLabel={search || category ? 'Réinitialiser' : undefined}
            onAction={() => {
              setSearchInput('');
              setCategory(undefined);
              setSort('recent');
            }}
          />
        )
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={{ flexDirection: 'row', gap: t.spacing.md, paddingTop: t.spacing.md }}>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
        ) : null
      }
    />
  );
}

// ============================================
// FILTRES
// ============================================

function ChipRow({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Le débordement latéral est volontaire : les puces touchent le bord
      // de l'écran, ce qui indique qu'on peut les faire défiler.
      style={{ marginHorizontal: -t.spacing.lg }}
      contentContainerStyle={{ gap: t.spacing.sm, paddingHorizontal: t.spacing.lg }}>
      {children}
    </ScrollView>
  );
}

function Chip({
  label,
  icon,
  active,
  onPress,
  subtle = false,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  subtle?: boolean;
}) {
  const t = useTheme();

  const background = active
    ? subtle
      ? t.colors.surfaceAlt
      : t.colors.primary
    : t.colors.surface;
  const foreground = active
    ? subtle
      ? t.colors.text
      : t.colors.onPrimary
    : t.colors.textMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.xs,
        paddingHorizontal: t.spacing.md,
        height: 36,
        borderRadius: t.radius.full,
        backgroundColor: background,
        borderWidth: active && !subtle ? 0 : 1,
        borderColor: t.colors.border,
        opacity: pressed ? 0.7 : 1,
      })}>
      {icon && <Ionicons name={icon} size={14} color={foreground} />}
      <Text variant="captionStrong" style={{ color: foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}
