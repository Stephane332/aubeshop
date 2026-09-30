/**
 * components/home/VendorHome.tsx
 * ==============================
 * Tableau de bord vendeur — étudiant comme partenaire.
 *
 * La v1 renvoyait vers `/vendor/dashboard`, une route qui n'existait pas :
 * le bouton faisait planter l'app.
 *
 * Le partenaire voit en plus les informations de son stand ; le reste des
 * fonctions est identique, puisque la commission est la même pour les deux.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  Price,
  Screen,
  StatGrid,
  StatTile,
  Text,
  VerifiedBadge,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { formatXOF } from '@/lib/money';
import { orderReference, watchOrders } from '@/lib/orderService';
import type { Order, VendorProfile } from '@/types';

export function VendorHome({ vendor }: { vendor: VendorProfile }) {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Abonnement temps réel : une nouvelle commande apparaît sans que le
  // vendeur ait à rafraîchir.
  useEffect(() => {
    if (!user) return;
    return watchOrders(
      user.uid,
      'vendor',
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      (error) => {
        toast.error(error.message);
        setLoading(false);
      }
    );
  }, [user, toast]);

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'completed');
    const toHandle = orders.filter((o) =>
      ['pending', 'accepted', 'preparing'].includes(o.status)
    );
    const revenue = completed.reduce((sum, o) => sum + o.pricing.vendorPayout, 0);
    const commission = completed.reduce((sum, o) => sum + o.pricing.commission, 0);

    return { completed, toHandle, revenue, commission };
  }, [orders]);

  const pending = orders.filter((o) => o.status === 'pending');

  return (
    <Screen scroll>
      <View style={{ gap: t.spacing.xl, paddingTop: t.spacing.md }}>
        {/* En-tête boutique */}
        <View style={{ gap: t.spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: t.spacing.md,
            }}>
            <View style={{ flex: 1, gap: t.spacing.xxs }}>
              <Text variant="title" numberOfLines={1}>
                {vendor.storeName}
              </Text>
              <Text variant="caption" tone="muted">
                {vendor.campus}
              </Text>
            </View>
            <VerifiedBadge kind={vendor.kind} />
          </View>

          {!vendor.isOpen && (
            <Card level={0} padded={false}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: t.spacing.sm,
                  padding: t.spacing.md,
                }}>
                <Ionicons name="moon-outline" size={18} color={t.colors.warning} />
                <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                  Votre boutique est fermée : vos produits n&apos;apparaissent pas au catalogue.
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* Chiffres clés */}
        <StatGrid>
          <StatTile
            label="Revenus nets"
            value={formatXOF(stats.revenue)}
            icon="wallet-outline"
            tone="success"
            hint={`${formatXOF(stats.commission)} de commission`}
          />
          <StatTile
            label="À traiter"
            value={String(stats.toHandle.length)}
            icon="time-outline"
            tone={stats.toHandle.length > 0 ? 'warning' : 'neutral'}
          />
          <StatTile
            label="Ventes conclues"
            value={String(stats.completed.length)}
            icon="checkmark-done-outline"
            tone="info"
          />
          <StatTile
            label="Note moyenne"
            value={vendor.reviewCount > 0 ? vendor.rating.toFixed(1) : '—'}
            icon="star-outline"
            tone="primary"
            hint={vendor.reviewCount > 0 ? `${vendor.reviewCount} avis` : 'Pas encore d’avis'}
          />
        </StatGrid>

        {/* Actions */}
        <View style={{ gap: t.spacing.sm }}>
          <Button
            label="Ajouter un produit"
            icon="add-circle-outline"
            block
            onPress={() => router.push('/vendor/product-form')}
          />
          <Button
            label="Voir mes ventes"
            icon="receipt-outline"
            variant="secondary"
            block
            onPress={() => router.push('/orders')}
          />
        </View>

        {/* Stand du partenaire */}
        {vendor.kind === 'partner' && vendor.stand && (
          <View style={{ gap: t.spacing.sm }}>
            <Text variant="subheading">Mon stand</Text>
            <Card>
              <View style={{ gap: t.spacing.sm }}>
                <Row icon="location-outline" label="Emplacement" value={vendor.stand.location || '—'} />
                <Row
                  icon="time-outline"
                  label="Horaires"
                  value={vendor.stand.openingHours || 'Non renseignés'}
                />
                {vendor.stand.businessId && (
                  <Row icon="document-text-outline" label="IFU" value={vendor.stand.businessId} />
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Commandes en attente */}
        <View style={{ gap: t.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="subheading">Commandes en attente</Text>
            {pending.length > 0 && <Badge label={String(pending.length)} tone="warning" />}
          </View>

          {loading ? (
            <Card>
              <Text variant="caption" tone="muted">
                Chargement…
              </Text>
            </Card>
          ) : pending.length === 0 ? (
            <Card>
              <EmptyState
                icon="checkmark-circle-outline"
                title="Tout est à jour"
                message="Aucune commande n'attend votre réponse."
              />
            </Card>
          ) : (
            pending.slice(0, 5).map((order) => (
              <Card
                key={order.id}
                onPress={() => router.push(`/order/${order.id}`)}
                accessibilityLabel={`Commande ${orderReference(order.id)} de ${order.clientName}`}>
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
                      {order.clientName} · {order.lines.length} article(s)
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: t.spacing.xxs }}>
                    <Price value={order.pricing.vendorPayout} size="sm" />
                    <Ionicons name="chevron-forward" size={16} color={t.colors.textSubtle} />
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

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
      <Ionicons name={icon} size={16} color={t.colors.textSubtle} />
      <Text variant="caption" tone="muted" style={{ width: 96 }}>
        {label}
      </Text>
      <Text variant="caption" style={{ flex: 1 }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
