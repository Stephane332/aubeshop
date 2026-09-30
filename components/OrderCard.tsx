/**
 * components/OrderCard.tsx
 * ========================
 * Résumé d'une commande dans une liste.
 *
 * Lit `timeline`/`pricing` aux bons emplacements : la v1 accédait à
 * `order.createdAt` et `order.total`, deux champs qui n'existaient pas dans
 * son propre modèle, si bien que la date et le montant restaient vides.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { View } from 'react-native';

import { Card, OrderStatusBadge, Price, Text } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatRelative } from '@/lib/format';
import { orderReference } from '@/lib/orderService';
import type { Order } from '@/types';

function OrderCardBase({
  order,
  /** Côté vendeur on montre le client, côté client on montre la boutique. */
  perspective,
}: {
  order: Order;
  perspective: 'client' | 'vendor';
}) {
  const t = useTheme();
  const router = useRouter();

  const counterpart = perspective === 'client' ? order.vendorName : order.clientName;
  const amount =
    perspective === 'client' ? order.pricing.total : order.pricing.vendorPayout;
  const cover = order.lines.find((l) => l.image)?.image;
  const itemCount = order.lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <Card
      onPress={() => router.push(`/order/${order.id}`)}
      accessibilityLabel={`Commande ${orderReference(order.id)}, ${counterpart}`}
      padded={false}>
      <View style={{ padding: t.spacing.md, gap: t.spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: t.spacing.sm,
          }}>
          <Text variant="captionStrong" tone="muted">
            {orderReference(order.id)}
          </Text>
          <OrderStatusBadge status={order.status} />
        </View>

        <View style={{ flexDirection: 'row', gap: t.spacing.md, alignItems: 'center' }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: t.radius.md,
              overflow: 'hidden',
              backgroundColor: t.colors.surfaceAlt,
            }}>
            {cover ? (
              <Image
                source={{ uri: cover }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="cube-outline" size={20} color={t.colors.textSubtle} />
              </View>
            )}
          </View>

          <View style={{ flex: 1, gap: t.spacing.xxs }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {counterpart}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {itemCount} article{itemCount > 1 ? 's' : ''} · {formatRelative(order.createdAt)}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: t.spacing.xxs }}>
            <Price value={amount} size="sm" />
            <Ionicons
              name={order.shippingMethod === 'delivery' ? 'bicycle-outline' : 'walk-outline'}
              size={14}
              color={t.colors.textSubtle}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}

export const OrderCard = memo(OrderCardBase);
