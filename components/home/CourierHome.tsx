/**
 * components/home/CourierHome.tsx
 * ===============================
 * Tableau de bord livreur : le vivier de courses.
 *
 * Modèle « pool ouvert » : les courses prêtes apparaissent chez tous les
 * livreurs disponibles couvrant la zone, et la première acceptation
 * l'emporte. L'acceptation passe par une transaction, donc deux livreurs
 * qui tapent en même temps ne peuvent pas obtenir la même course.
 *
 * Tant que la course n'est pas acceptée, seuls le quartier et la zone sont
 * visibles — jamais le téléphone ni l'adresse exacte du client.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { RefreshControl, Switch, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Price,
  RowSkeleton,
  Screen,
  StatGrid,
  StatTile,
  Text,
  useToast,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { claimDelivery, setAvailability, watchAvailableDeliveries } from '@/lib/deliveryService';
import { haptic } from '@/lib/feedback';
import { DELIVERY_ZONES, formatXOF } from '@/lib/money';
import type { CourierProfile, Delivery } from '@/types';

function zoneLabel(zone: Delivery['zone']): string {
  return DELIVERY_ZONES.find((z) => z.id === zone)?.label ?? 'Zone inconnue';
}

export function CourierHome({ courier }: { courier: CourierProfile }) {
  const t = useTheme();
  const toast = useToast();

  const [available, setAvailable] = useState(courier.isAvailable);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  // Le profil peut être rechargé depuis le serveur : on resynchronise.
  useEffect(() => setAvailable(courier.isAvailable), [courier.isAvailable]);

  useEffect(() => {
    if (!available) {
      setDeliveries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    return watchAvailableDeliveries(
      courier,
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
  }, [courier, available]);

  const toggleAvailability = async (next: boolean) => {
    // Bascule optimiste : l'interrupteur doit répondre immédiatement.
    setAvailable(next);
    haptic('medium');
    try {
      await setAvailability(courier.uid, next);
      toast.info(next ? 'Vous recevez des courses' : 'Vous êtes hors ligne');
    } catch {
      setAvailable(!next);
      toast.error('Changement impossible. Vérifiez votre connexion.');
    }
  };

  const handleClaim = async (delivery: Delivery) => {
    setClaiming(delivery.orderId);
    try {
      await claimDelivery(delivery.orderId, courier);
      haptic('success');
      toast.success('Course acceptée — récupérez le colis chez le vendeur');
    } catch (err) {
      haptic('error');
      toast.error(err instanceof Error ? err.message : 'Acceptation impossible.');
    } finally {
      setClaiming(null);
    }
  };

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => {}} tintColor={t.colors.primary} />
      }>
      <View style={{ gap: t.spacing.xl, paddingTop: t.spacing.md }}>
        <View style={{ gap: t.spacing.xxs }}>
          <Text variant="title">Bonjour {courier.displayName.split(' ')[0]}</Text>
          <Text variant="body" tone="muted">
            {courier.campus} · {courier.zones.length} zone(s) desservie(s)
          </Text>
        </View>

        {/* Disponibilité */}
        <Card>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.spacing.md,
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: t.radius.full,
                backgroundColor: available ? t.colors.successSubtle : t.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons
                name={available ? 'radio-outline' : 'moon-outline'}
                size={20}
                color={available ? t.colors.success : t.colors.textSubtle}
              />
            </View>

            <View style={{ flex: 1, gap: t.spacing.xxs }}>
              <Text variant="bodyStrong">
                {available ? 'En service' : 'Hors service'}
              </Text>
              <Text variant="caption" tone="muted">
                {available
                  ? 'Vous voyez les courses de vos zones.'
                  : 'Activez pour recevoir des courses.'}
              </Text>
            </View>

            <Switch
              accessibilityLabel="Disponibilité pour les courses"
              value={available}
              onValueChange={toggleAvailability}
              trackColor={{ false: t.colors.borderStrong, true: t.colors.success }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Chiffres */}
        <StatGrid>
          <StatTile
            label="Gains cumulés"
            value={formatXOF(courier.totalEarnings)}
            icon="wallet-outline"
            tone="success"
          />
          <StatTile
            label="Courses livrées"
            value={String(courier.deliveryCount)}
            icon="checkmark-done-outline"
            tone="info"
          />
        </StatGrid>

        {/* Vivier */}
        <View style={{ gap: t.spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text variant="subheading">Courses disponibles</Text>
            {deliveries.length > 0 && <Badge label={String(deliveries.length)} tone="primary" />}
          </View>

          {!available ? (
            <Card>
              <EmptyState
                icon="moon-outline"
                title="Vous êtes hors service"
                message="Activez votre disponibilité pour voir les courses à prendre."
              />
            </Card>
          ) : error ? (
            <ErrorState message={error} />
          ) : loading ? (
            <View style={{ gap: t.spacing.md }}>
              <RowSkeleton />
              <RowSkeleton />
            </View>
          ) : deliveries.length === 0 ? (
            <Card>
              <EmptyState
                icon="bicycle-outline"
                title="Aucune course pour le moment"
                message="Les nouvelles courses de vos zones apparaîtront ici automatiquement."
              />
            </Card>
          ) : (
            deliveries.map((delivery) => (
              <Card key={delivery.orderId}>
                <View style={{ gap: t.spacing.md }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: t.spacing.md,
                    }}>
                    <View style={{ flex: 1, gap: t.spacing.xxs }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {delivery.vendorName}
                      </Text>
                      <Text variant="caption" tone="muted">
                        {delivery.itemCount} article(s) à livrer
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: t.spacing.xxs }}>
                      <Price value={delivery.payout} size="md" />
                      <Text variant="caption" tone="subtle">
                        votre part
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: t.spacing.xs }}>
                    <Leg
                      icon="storefront-outline"
                      label="Retrait"
                      value={delivery.pickupPoint || `Campus ${delivery.campus}`}
                    />
                    <Leg
                      icon="location-outline"
                      label="Dépôt"
                      value={`${delivery.district}, ${delivery.city}`}
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: t.spacing.sm,
                    }}>
                    <Badge label={zoneLabel(delivery.zone)} tone="info" icon="map-outline" />
                  </View>

                  <Button
                    label="Accepter la course"
                    icon="checkmark-circle-outline"
                    block
                    loading={claiming === delivery.orderId}
                    onPress={() => handleClaim(delivery)}
                  />
                </View>
              </Card>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}

function Leg({
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
      <Ionicons name={icon} size={15} color={t.colors.textSubtle} />
      <Text variant="caption" tone="subtle" style={{ width: 56 }}>
        {label}
      </Text>
      <Text variant="caption" style={{ flex: 1 }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
