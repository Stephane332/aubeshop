/**
 * components/home/AdminHome.tsx
 * =============================
 * Tableau de bord administrateur.
 *
 * La v1 affichait deux vendeurs codés en dur (« Alice Dupont », « Bob
 * Martin ») avec la vraie requête Firestore laissée en commentaire.
 */

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, View } from 'react-native';

import {
  Button,
  Card,
  ErrorState,
  Price,
  Screen,
  Skeleton,
  StatGrid,
  StatTile,
  Text,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { fetchPlatformStats, fetchRecentOrders, type PlatformStats } from '@/lib/adminService';
import { formatXOF } from '@/lib/money';
import { orderReference } from '@/lib/orderService';
import { ORDER_STATUS_LABEL, type Order } from '@/types';

export function AdminHome() {
  const t = useTheme();
  const router = useRouter();

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [platformStats, orders] = await Promise.all([
        fetchPlatformStats(),
        fetchRecentOrders(8),
      ]);
      setStats(platformStats);
      setRecent(orders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !stats) {
    return (
      <Screen>
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null);
            void load();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={t.colors.primary}
        />
      }>
      <View style={{ gap: t.spacing.xl, paddingTop: t.spacing.md }}>
        <View style={{ gap: t.spacing.xxs }}>
          <Text variant="title">Administration</Text>
          <Text variant="body" tone="muted">
            Vue d&apos;ensemble de la plateforme AubeShop.
          </Text>
        </View>

        {stats ? (
          <StatGrid>
            <StatTile
              label="Commissions perçues"
              value={formatXOF(stats.revenue)}
              icon="cash-outline"
              tone="success"
            />
            <StatTile
              label="Candidatures en attente"
              value={String(stats.pendingApplications)}
              icon="hourglass-outline"
              tone={stats.pendingApplications > 0 ? 'warning' : 'neutral'}
            />
            <StatTile label="Commandes" value={String(stats.orders)} icon="receipt-outline" tone="info" />
            <StatTile label="Utilisateurs" value={String(stats.users)} icon="people-outline" />
            <StatTile label="Vendeurs" value={String(stats.vendors)} icon="storefront-outline" tone="primary" />
            <StatTile label="Livreurs" value={String(stats.couriers)} icon="bicycle-outline" tone="primary" />
          </StatGrid>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={110} style={{ flex: 1, minWidth: 140 }} radius={t.radius.lg} />
            ))}
          </View>
        )}

        <Button
          label="Examiner les candidatures"
          icon="shield-checkmark-outline"
          block
          onPress={() => router.push('/applications')}
        />

        <View style={{ gap: t.spacing.sm }}>
          <Text variant="subheading">Dernières commandes</Text>

          {recent.length === 0 ? (
            <Card>
              <Text variant="caption" tone="muted">
                Aucune commande pour le moment.
              </Text>
            </Card>
          ) : (
            recent.map((order) => (
              <Card key={order.id} onPress={() => router.push(`/order/${order.id}`)}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: t.spacing.md,
                  }}>
                  <View style={{ flex: 1, gap: t.spacing.xxs }}>
                    <Text variant="bodyStrong">{orderReference(order.id)}</Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {order.clientName} → {order.vendorName}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: t.spacing.xxs }}>
                    <Price value={order.pricing.total} size="sm" />
                    <Text variant="caption" tone="subtle">
                      {ORDER_STATUS_LABEL[order.status]}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
