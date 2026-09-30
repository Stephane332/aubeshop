/**
 * app/order/[id].tsx
 * ==================
 * Détail d'une commande, et actions selon le rôle.
 *
 * C'est ici que le vendeur fait avancer la commande — fonction absente de
 * la v1, qui servait au vendeur la même liste inerte qu'au client. Les
 * transitions proposées viennent de la machine à états partagée, donc
 * l'interface ne peut pas offrir un passage que le service refusera.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Card,
  ErrorState,
  IconButton,
  OrderStatusBadge,
  PriceRow,
  RowSkeleton,
  Screen,
  Text,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { confirm, haptic } from '@/lib/feedback';
import { formatDateTime, formatPhone } from '@/lib/format';
import { DELIVERY_ZONES, formatXOF } from '@/lib/money';
import { advanceOrder, orderReference, watchOrder } from '@/lib/orderService';
import {
  ORDER_STATUS_LABEL,
  ORDER_TRANSITIONS,
  PAYMENT_LABEL,
  type Order,
  type OrderStatus,
} from '@/types';

/** Libellé du bouton pour chaque transition proposée. */
const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  accepted: 'Accepter la commande',
  preparing: 'Commencer la préparation',
  ready: 'Marquer comme prête',
  completed: 'Marquer comme terminée',
  refused: 'Refuser',
  cancelled: 'Annuler la commande',
};

/** Étapes affichées dans le suivi, dans l'ordre. */
const TRACK: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed'];

export default function OrderScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user, isVendor } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Temps réel : le client voit le vendeur accepter sans rien rafraîchir.
  useEffect(() => {
    if (!id) return;
    return watchOrder(
      id,
      (o) => {
        setOrder(o);
        setError(null);
      },
      (err) => setError(err.message)
    );
  }, [id]);

  if (error) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ErrorState message={error} onRetry={() => router.back()} />
      </Screen>
    );
  }

  if (!order || !user) {
    return (
      <Screen edges={['top']}>
        <View style={{ gap: t.spacing.md, paddingTop: t.spacing.lg }}>
          <RowSkeleton />
          <RowSkeleton />
        </View>
      </Screen>
    );
  }

  const role: 'client' | 'vendor' = isVendor && order.vendorId === user.uid ? 'vendor' : 'client';
  const actions = ORDER_TRANSITIONS[order.status].filter((tr) => tr.by === role);
  const zone = DELIVERY_ZONES.find((z) => z.id === order.address?.zone);

  const currentStep = TRACK.indexOf(order.status);
  const terminated = order.status === 'cancelled' || order.status === 'refused';

  const run = async (to: OrderStatus) => {
    const destructive = to === 'cancelled' || to === 'refused';

    if (destructive) {
      const ok = await confirm({
        title: to === 'refused' ? 'Refuser cette commande ?' : 'Annuler cette commande ?',
        message: 'Le stock sera restitué et l’autre partie sera prévenue.',
        confirmLabel: to === 'refused' ? 'Refuser' : 'Annuler la commande',
        cancelLabel: 'Retour',
        destructive: true,
      });
      if (!ok) return;
    }

    setBusy(true);
    try {
      await advanceOrder(order.id, to, { uid: user.uid, role });
      haptic('success');
      toast.success(`Commande ${ORDER_STATUS_LABEL[to].toLowerCase()}`);
    } catch (err) {
      haptic('error');
      toast.error(err instanceof Error ? err.message : 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  const counterpartPhone = role === 'vendor' ? order.clientPhone : undefined;

  return (
    <Screen
      padded={false}
      edges={['top']}
      footer={
        actions.length > 0 ? (
          <View style={{ gap: t.spacing.sm }}>
            {actions.map((action) => (
              <Button
                key={action.to}
                label={ACTION_LABEL[action.to] ?? ORDER_STATUS_LABEL[action.to]}
                variant={action.to === 'cancelled' || action.to === 'refused' ? 'secondary' : 'primary'}
                block
                loading={busy}
                onPress={() => run(action.to)}
              />
            ))}
          </View>
        ) : undefined
      }>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.xl, paddingBottom: t.spacing.xxl }}
        showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
          <View style={{ flex: 1, gap: t.spacing.xxs }}>
            <Text variant="heading">{orderReference(order.id)}</Text>
            <Text variant="caption" tone="muted">
              {formatDateTime(order.createdAt)}
            </Text>
          </View>
          <OrderStatusBadge status={order.status} />
        </View>

        {/* Suivi */}
        {!terminated ? (
          <Card>
            <View style={{ gap: t.spacing.md }}>
              {TRACK.map((step, index) => {
                const done = index <= currentStep;
                const active = index === currentStep;
                return (
                  <View
                    key={step}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: t.radius.full,
                        backgroundColor: done ? t.colors.primary : t.colors.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      {done ? (
                        <Ionicons name="checkmark" size={14} color={t.colors.onPrimary} />
                      ) : (
                        <Text variant="caption" tone="subtle">
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      variant={active ? 'bodyStrong' : 'body'}
                      tone={done ? 'default' : 'subtle'}
                      style={{ flex: 1 }}>
                      {ORDER_STATUS_LABEL[step]}
                    </Text>
                    {order.timeline[step] && (
                      <Text variant="caption" tone="subtle">
                        {formatDateTime(order.timeline[step])}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </Card>
        ) : (
          <Card level={0}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md, alignItems: 'center' }}>
              <Ionicons name="close-circle-outline" size={22} color={t.colors.danger} />
              <View style={{ flex: 1, gap: t.spacing.xxs }}>
                <Text variant="bodyStrong">{ORDER_STATUS_LABEL[order.status]}</Text>
                {order.cancelReason && (
                  <Text variant="caption" tone="muted">
                    {order.cancelReason}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Interlocuteur */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: t.radius.full,
                backgroundColor: t.colors.primarySubtle,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons
                name={role === 'vendor' ? 'person-outline' : 'storefront-outline'}
                size={20}
                color={t.colors.primaryText}
              />
            </View>
            <View style={{ flex: 1, gap: t.spacing.xxs }}>
              <Text variant="caption" tone="muted">
                {role === 'vendor' ? 'Client' : 'Vendeur'}
              </Text>
              <Text variant="bodyStrong">
                {role === 'vendor' ? order.clientName : order.vendorName}
              </Text>
            </View>
            {counterpartPhone && (
              <IconButton
                icon="call-outline"
                label="Appeler le client"
                tone="primary"
                onPress={() => Linking.openURL(`tel:${counterpartPhone}`)}
              />
            )}
          </View>
        </Card>

        {/* Articles */}
        <View style={{ gap: t.spacing.sm }}>
          <Text variant="subheading">Articles</Text>
          <Card padded={false}>
            {order.lines.map((line, index) => (
              <View
                key={line.productId}
                style={{
                  flexDirection: 'row',
                  gap: t.spacing.md,
                  alignItems: 'center',
                  padding: t.spacing.md,
                  borderBottomWidth: index === order.lines.length - 1 ? 0 : 1,
                  borderBottomColor: t.colors.divider,
                }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: t.radius.sm,
                    overflow: 'hidden',
                    backgroundColor: t.colors.surfaceAlt,
                  }}>
                  {line.image ? (
                    <Image
                      source={{ uri: line.image }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="cube-outline" size={18} color={t.colors.textSubtle} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, gap: t.spacing.xxs }}>
                  <Text variant="body" numberOfLines={2}>
                    {line.title}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {line.quantity} × {formatXOF(line.unitPrice)}
                  </Text>
                </View>
                <Text variant="bodyStrong">{formatXOF(line.unitPrice * line.quantity)}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Livraison */}
        <View style={{ gap: t.spacing.sm }}>
          <Text variant="subheading">
            {order.shippingMethod === 'delivery' ? 'Livraison' : 'Retrait'}
          </Text>
          <Card>
            {order.shippingMethod === 'delivery' && order.address ? (
              <View style={{ gap: t.spacing.xs }}>
                <Text variant="bodyStrong">{order.address.label}</Text>
                <Text variant="caption" tone="muted">
                  {order.address.district}, {order.address.city}
                </Text>
                {order.address.landmark && (
                  <Text variant="caption" tone="muted">
                    Repère : {order.address.landmark}
                  </Text>
                )}
                <Text variant="caption" tone="subtle">
                  {formatPhone(order.address.phone)}
                </Text>
                {zone && (
                  <View style={{ marginTop: t.spacing.xs }}>
                    <Badge label={zone.label} tone="info" icon="map-outline" />
                  </View>
                )}
              </View>
            ) : (
              <Text variant="body" tone="muted">
                Retrait sur place — {order.pickupPoint || 'campus'}
              </Text>
            )}
          </Card>
        </View>

        {order.clientNote && (
          <View style={{ gap: t.spacing.sm }}>
            <Text variant="subheading">Message du client</Text>
            <Card level={0}>
              <Text variant="body" tone="muted">
                {order.clientNote}
              </Text>
            </Card>
          </View>
        )}

        {/* Montants */}
        <View style={{ gap: t.spacing.sm }}>
          <Text variant="subheading">Montants</Text>
          <Card>
            <PriceRow label="Sous-total" value={order.pricing.subtotal} />
            <PriceRow label="Livraison" value={order.pricing.shipping} />
            {role === 'vendor' && (
              <PriceRow
                label="Commission AubeShop"
                value={order.pricing.commission}
                tone="muted"
                negative
              />
            )}
            <View style={{ height: 1, backgroundColor: t.colors.divider, marginVertical: t.spacing.xs }} />
            <PriceRow
              label={role === 'vendor' ? 'Vous recevez' : 'Total payé'}
              value={role === 'vendor' ? order.pricing.vendorPayout : order.pricing.total}
              emphasis
            />
            <View style={{ marginTop: t.spacing.sm, flexDirection: 'row', gap: t.spacing.xs }}>
              <Badge
                label={PAYMENT_LABEL[order.paymentMethod]}
                tone={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                icon={order.paymentStatus === 'paid' ? 'checkmark-circle' : 'time'}
              />
            </View>
          </Card>
        </View>

        <View style={{ height: insets.bottom }} />
      </ScrollView>
    </Screen>
  );
}
