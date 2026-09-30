/**
 * app/(tabs)/orders.tsx
 * =====================
 * Commandes — vue client, ventes — vue vendeur.
 *
 * La v1 servait la même liste inerte aux deux rôles, sans aucune action
 * vendeur, et l'écran n'était même pas déclaré dans la barre d'onglets,
 * donc inatteignable. Ici les données arrivent en temps réel et un filtre
 * par statut permet de retrouver une commande.
 */

import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';

import { OrderCard } from '@/components/OrderCard';
import { EmptyState, ErrorState, RowSkeleton, Screen, Text } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/feedback';
import { watchOrders } from '@/lib/orderService';
import { ORDER_STATUS_LABEL, type Order, type OrderStatus } from '@/types';

/** Regroupements proposés en filtre, plus parlants que les 7 statuts bruts. */
const FILTERS: { id: string; label: string; match: (s: OrderStatus) => boolean }[] = [
  { id: 'active', label: 'En cours', match: (s) => ['pending', 'accepted', 'preparing', 'ready'].includes(s) },
  { id: 'completed', label: 'Terminées', match: (s) => s === 'completed' },
  { id: 'cancelled', label: 'Annulées', match: (s) => s === 'refused' || s === 'cancelled' },
  { id: 'all', label: 'Toutes', match: () => true },
];

export default function OrdersScreen() {
  const t = useTheme();
  const { user, isVendor } = useAuth();
  const perspective = isVendor ? 'vendor' : 'client';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    return watchOrders(
      user.uid,
      perspective,
      (list) => {
        setOrders(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        // La v1 renvoyait un tableau vide sur erreur : on ne distinguait pas
        // « aucune commande » d'un index Firestore manquant.
        setError(err.message);
        setLoading(false);
      }
    );
  }, [user, perspective]);

  const visible = useMemo(() => {
    const rule = FILTERS.find((f) => f.id === filter) ?? FILTERS[3];
    return orders.filter((o) => rule.match(o.status));
  }, [orders, filter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of FILTERS) map[f.id] = orders.filter((o) => f.match(o.status)).length;
    return map;
  }, [orders]);

  const header = (
    <View style={{ gap: t.spacing.md, paddingBottom: t.spacing.md }}>
      <Text variant="title">{isVendor ? 'Mes ventes' : 'Mes commandes'}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -t.spacing.lg }}
        contentContainerStyle={{ gap: t.spacing.sm, paddingHorizontal: t.spacing.lg }}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${f.label}, ${counts[f.id] ?? 0}`}
              onPress={() => {
                haptic('select');
                setFilter(f.id);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.spacing.xs,
                paddingHorizontal: t.spacing.md,
                height: 36,
                borderRadius: t.radius.full,
                backgroundColor: active ? t.colors.primary : t.colors.surface,
                borderWidth: active ? 0 : 1,
                borderColor: t.colors.border,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Text
                variant="captionStrong"
                style={{ color: active ? t.colors.onPrimary : t.colors.textMuted }}>
                {f.label}
              </Text>
              {(counts[f.id] ?? 0) > 0 && (
                <Text
                  variant="caption"
                  style={{ color: active ? t.colors.onPrimary : t.colors.textSubtle }}>
                  {counts[f.id]}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <Screen>
        <View style={{ gap: t.spacing.md, paddingTop: t.spacing.md }}>
          {header}
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <OrderCard order={item} perspective={perspective} />}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.md,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.md,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          error ? (
            <ErrorState message={error} />
          ) : (
            <EmptyState
              icon="receipt-outline"
              title={
                filter === 'active'
                  ? 'Aucune commande en cours'
                  : `Aucune commande ${ORDER_STATUS_LABEL[
                      filter === 'completed' ? 'completed' : 'cancelled'
                    ].toLowerCase()}`
              }
              message={
                isVendor
                  ? 'Les commandes de vos clients apparaîtront ici en temps réel.'
                  : 'Vos commandes apparaîtront ici dès votre premier achat.'
              }
            />
          )
        }
      />
    </Screen>
  );
}
