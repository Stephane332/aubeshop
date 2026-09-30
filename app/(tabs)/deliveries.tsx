/**
 * app/(tabs)/deliveries.tsx
 * =========================
 * Les courses acceptées par le livreur, et son parcours.
 *
 * Une fois la course acceptée, le livreur accède aux coordonnées complètes
 * du client — adresse précise et téléphone — que le vivier ne montrait pas.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  DeliveryStatusBadge,
  EmptyState,
  ErrorState,
  Price,
  RowSkeleton,
  Screen,
  Text,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import {
  markDelivered,
  markFailed,
  markPickedUp,
  watchCourierDeliveries,
} from '@/lib/deliveryService';
import { confirm, haptic } from '@/lib/feedback';
import { formatRelative, formatPhone } from '@/lib/format';
import { DELIVERY_ZONES, formatXOF } from '@/lib/money';
import { fetchOrder, orderReference } from '@/lib/orderService';
import type { CourierProfile, Delivery, Order } from '@/types';

export default function DeliveriesScreen() {
  const t = useTheme();
  const toast = useToast();
  const { courier } = useAuth();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courier) return;
    return watchCourierDeliveries(
      courier.uid,
      (list) => {
        setDeliveries(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [courier]);

  const { active, past } = useMemo(
    () => ({
      active: deliveries.filter((d) => d.status === 'claimed' || d.status === 'picked_up'),
      past: deliveries.filter((d) => d.status === 'delivered' || d.status === 'failed'),
    }),
    [deliveries]
  );

  if (!courier) {
    return (
      <Screen>
        <EmptyState icon="bicycle-outline" title="Profil livreur introuvable" />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <View style={{ gap: t.spacing.md, paddingTop: t.spacing.lg }}>
          <RowSkeleton />
          <RowSkeleton />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={active}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.md,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.md,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: t.spacing.xxs, paddingBottom: t.spacing.md }}>
            <Text variant="title">Mes courses</Text>
            <Text variant="body" tone="muted">
              {active.length > 0
                ? `${active.length} course(s) en cours`
                : 'Aucune course en cours'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ActiveDeliveryCard delivery={item} courier={courier} toast={toast} />
        )}
        ListEmptyComponent={
          error ? (
            <ErrorState message={error} />
          ) : (
            <EmptyState
              icon="navigate-outline"
              title="Aucune course en cours"
              message="Acceptez une course depuis l'onglet Courses pour la retrouver ici."
            />
          )
        }
        ListFooterComponent={
          past.length > 0 ? (
            <View style={{ gap: t.spacing.sm, paddingTop: t.spacing.xl }}>
              <Text variant="subheading">Historique</Text>
              {past.slice(0, 20).map((d) => (
                <Card key={d.orderId}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: t.spacing.md,
                    }}>
                    <View style={{ flex: 1, gap: t.spacing.xxs }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {d.district}, {d.city}
                      </Text>
                      <Text variant="caption" tone="muted">
                        {formatRelative(d.deliveredAt ?? d.createdAt)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: t.spacing.xxs }}>
                      <Price value={d.payout} size="sm" tone="default" />
                      <DeliveryStatusBadge status={d.status} />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

/**
 * Course en cours : le livreur y trouve le trajet, les coordonnées du
 * client et l'action correspondant à l'étape suivante.
 */
function ActiveDeliveryCard({
  delivery,
  courier,
  toast,
}: {
  delivery: Delivery;
  courier: CourierProfile;
  toast: ReturnType<typeof useToast>;
}) {
  const t = useTheme();
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);

  // Les coordonnées complètes vivent dans la commande, pas dans le vivier.
  useEffect(() => {
    let cancelled = false;
    void fetchOrder(delivery.orderId)
      .then((o) => !cancelled && setOrder(o))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [delivery.orderId]);

  const zone = DELIVERY_ZONES.find((z) => z.id === delivery.zone);

  const advance = async () => {
    setBusy(true);
    try {
      if (delivery.status === 'claimed') {
        await markPickedUp(delivery.orderId, courier.uid);
        haptic('success');
        toast.success('Colis récupéré — bonne route !');
      } else {
        await markDelivered(delivery.orderId, courier);
        haptic('success');
        toast.success(`Course terminée · +${formatXOF(delivery.payout)}`);
      }
    } catch (err) {
      haptic('error');
      toast.error(err instanceof Error ? err.message : 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  const abandon = async () => {
    const ok = await confirm({
      title: 'Abandonner la course ?',
      message: 'Elle retournera dans le vivier pour un autre livreur.',
      confirmLabel: 'Abandonner',
      destructive: true,
    });
    if (!ok) return;

    try {
      await markFailed(delivery.orderId, courier.uid, 'Abandonnée par le livreur');
      toast.info('Course remise dans le vivier');
    } catch {
      toast.error('Action impossible.');
    }
  };

  const phone = order?.clientPhone;

  return (
    <Card>
      <View style={{ gap: t.spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text variant="captionStrong" tone="muted">
            {orderReference(delivery.orderId)}
          </Text>
          <DeliveryStatusBadge status={delivery.status} />
        </View>

        {/* Trajet */}
        <View style={{ gap: t.spacing.sm }}>
          <Step
            icon="storefront-outline"
            title={delivery.vendorName}
            subtitle={delivery.pickupPoint || `Campus ${delivery.campus}`}
            done={delivery.status === 'picked_up'}
          />
          <View
            style={{
              width: 1,
              height: 14,
              marginLeft: 15,
              backgroundColor: t.colors.border,
            }}
          />
          <Step
            icon="location-outline"
            title={order?.address ? `${order.address.district}, ${order.address.city}` : delivery.district}
            subtitle={order?.address?.landmark || zone?.label || ''}
            done={false}
          />
        </View>

        {order?.address?.landmark && (
          <View
            style={{
              flexDirection: 'row',
              gap: t.spacing.sm,
              padding: t.spacing.md,
              borderRadius: t.radius.md,
              backgroundColor: t.colors.infoSubtle,
            }}>
            <Ionicons name="flag-outline" size={16} color={t.colors.info} />
            <Text variant="caption" style={{ flex: 1, color: t.colors.info }}>
              {order.address.landmark}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
          <Badge label={`${delivery.itemCount} article(s)`} tone="neutral" icon="cube-outline" />
          <Badge label={`+${formatXOF(delivery.payout)}`} tone="success" icon="wallet-outline" />
          {order?.paymentMethod === 'cash_on_delivery' && (
            <Badge
              label={`Encaisser ${formatXOF(order.pricing.total)}`}
              tone="warning"
              icon="cash-outline"
            />
          )}
        </View>

        <View style={{ gap: t.spacing.sm }}>
          <Button
            label={delivery.status === 'claimed' ? 'J’ai récupéré le colis' : 'Marquer comme livrée'}
            icon={delivery.status === 'claimed' ? 'cube-outline' : 'checkmark-done-outline'}
            block
            loading={busy}
            onPress={advance}
          />

          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            {phone && (
              <Button
                label="Appeler"
                icon="call-outline"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => Linking.openURL(`tel:${phone}`)}
              />
            )}
            <Button
              label="Abandonner"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={abandon}
            />
          </View>

          {phone && (
            <Text variant="caption" tone="subtle" center>
              Client : {order?.clientName} · {formatPhone(phone)}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

function Step({
  icon,
  title,
  subtitle,
  done,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  done: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: t.radius.full,
          backgroundColor: done ? t.colors.successSubtle : t.colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons
          name={done ? 'checkmark' : icon}
          size={16}
          color={done ? t.colors.success : t.colors.textMuted}
        />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="captionStrong" numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text variant="caption" tone="subtle" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
