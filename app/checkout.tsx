/**
 * app/checkout.tsx
 * ================
 * Paiement et validation de la commande.
 *
 * Le tunnel de la v1 tenait en trois lignes : pas de formulaire d'adresse,
 * `method: 'delivery'` codé en dur, aucun choix de paiement — et surtout
 * **le montant affiché n'était pas celui facturé** : l'écran montrait le
 * sous-total du panier pendant que le service ajoutait 5 € de livraison.
 *
 * Ici, le même calcul (`priceBreakdown`) alimente l'aperçu et la création
 * de la commande, donc les deux ne peuvent pas diverger.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  PriceRow,
  Screen,
  Text,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/feedback';
import { formatPhone } from '@/lib/format';
import { DELIVERY_ZONES, formatXOF, priceBreakdown } from '@/lib/money';
import { placeOrder } from '@/lib/orderService';
import { PAYMENT_LABEL, type PaymentMethod, type ShippingMethod } from '@/types';

/** Moyens réellement proposés. Le paiement en ligne viendra via Flutterwave. */
const PAYMENT_METHODS: { id: PaymentMethod; icon: keyof typeof Ionicons.glyphMap; available: boolean }[] = [
  { id: 'cash_on_delivery', icon: 'cash-outline', available: true },
  { id: 'mobile_money', icon: 'phone-portrait-outline', available: false },
  { id: 'card', icon: 'card-outline', available: false },
];

export default function CheckoutScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { lines, groups, itemCount, clear } = useCart();

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('delivery');
  const [addressId, setAddressId] = useState<string | undefined>(
    () => user?.addresses?.find((a) => a.isDefault)?.id ?? user?.addresses?.[0]?.id
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const address = user?.addresses?.find((a) => a.id === addressId);

  /** Un seul calcul, partagé avec la création de commande. */
  const pricing = useMemo(
    () =>
      priceBreakdown(
        lines.map((l) => ({ price: l.unitPrice, quantity: l.quantity })),
        { method: shippingMethod, zone: address?.zone }
      ),
    [lines, shippingMethod, address?.zone]
  );

  if (lines.length === 0) {
    return (
      <Screen edges={['top', 'bottom']}>
        <EmptyState
          icon="bag-outline"
          title="Votre panier est vide"
          message="Ajoutez des articles avant de passer commande."
          actionLabel="Voir le catalogue"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  const canSubmit = shippingMethod === 'pickup' || !!address;

  const submit = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (shippingMethod === 'delivery' && !address) {
      toast.error('Choisissez une adresse de livraison.');
      return;
    }

    setSubmitting(true);
    try {
      const { orderIds } = await placeOrder(user, groups, {
        shippingMethod,
        address: shippingMethod === 'delivery' ? address : undefined,
        pickupPoint: shippingMethod === 'pickup' ? 'Campus' : undefined,
        paymentMethod,
        clientNote: note,
      });

      await clear();
      haptic('success');
      toast.success(
        orderIds.length > 1
          ? `${orderIds.length} commandes envoyées aux vendeurs`
          : 'Commande envoyée au vendeur'
      );
      // On ouvre la commande créée ; s'il y en a plusieurs, la liste.
      router.replace(orderIds.length === 1 ? `/order/${orderIds[0]}` : '/orders');
    } catch (error) {
      haptic('error');
      // Le message vient du service : stock insuffisant, produit retiré…
      toast.error(error instanceof Error ? error.message : 'Commande impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      padded={false}
      edges={['top']}
      footer={
        <View style={{ gap: t.spacing.sm }}>
          <PriceRow label="Total à payer" value={pricing.total} emphasis />
          <Button
            label={submitting ? 'Envoi…' : `Confirmer la commande`}
            icon="checkmark-circle-outline"
            block
            loading={submitting}
            disabled={!canSubmit}
            onPress={submit}
          />
        </View>
      }>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.xl, paddingBottom: t.spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
          <Text variant="title">Commander</Text>
        </View>

        {/* Mode de réception */}
        <View style={{ gap: t.spacing.sm }}>
          <Text variant="subheading">Réception</Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <Choice
              active={shippingMethod === 'delivery'}
              icon="bicycle-outline"
              title="Livraison"
              subtitle={`${formatXOF(DELIVERY_ZONES[0].fee)} à ${formatXOF(DELIVERY_ZONES[3].fee)}`}
              onPress={() => setShippingMethod('delivery')}
            />
            <Choice
              active={shippingMethod === 'pickup'}
              icon="walk-outline"
              title="Retrait"
              subtitle="Gratuit"
              onPress={() => setShippingMethod('pickup')}
            />
          </View>
        </View>

        {/* Adresse */}
        {shippingMethod === 'delivery' && (
          <View style={{ gap: t.spacing.sm }}>
            <Text variant="subheading">Adresse de livraison</Text>

            {(user?.addresses ?? []).length === 0 ? (
              <Card>
                <View style={{ gap: t.spacing.md }}>
                  <Text variant="caption" tone="muted">
                    Vous n&apos;avez pas encore d&apos;adresse enregistrée.
                  </Text>
                  <Button
                    label="Ajouter une adresse"
                    icon="add-circle-outline"
                    block
                    onPress={() => router.push('/account/address')}
                  />
                </View>
              </Card>
            ) : (
              <>
                {user!.addresses.map((a) => {
                  const active = a.id === addressId;
                  const zone = DELIVERY_ZONES.find((z) => z.id === a.zone);
                  return (
                    <Pressable
                      key={a.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${a.label}, ${a.district}`}
                      onPress={() => {
                        haptic('select');
                        setAddressId(a.id);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: t.spacing.md,
                        padding: t.spacing.lg,
                        borderRadius: t.radius.lg,
                        backgroundColor: t.colors.surface,
                        borderWidth: 1,
                        borderColor: active ? t.colors.primary : t.colors.border,
                      }}>
                      <Ionicons
                        name={active ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={active ? t.colors.primary : t.colors.textSubtle}
                      />
                      <View style={{ flex: 1, gap: t.spacing.xxs }}>
                        <Text variant="bodyStrong">{a.label}</Text>
                        <Text variant="caption" tone="muted">
                          {a.district}, {a.city}
                          {a.landmark ? ` — ${a.landmark}` : ''}
                        </Text>
                        <Text variant="caption" tone="subtle">
                          {formatPhone(a.phone)}
                        </Text>
                      </View>
                      {zone && <Badge label={formatXOF(zone.fee)} tone="info" />}
                    </Pressable>
                  );
                })}
                <Button
                  label="Ajouter une adresse"
                  variant="ghost"
                  icon="add"
                  size="sm"
                  onPress={() => router.push('/account/address')}
                />
              </>
            )}
          </View>
        )}

        {/* Paiement */}
        <View style={{ gap: t.spacing.sm }}>
          <Text variant="subheading">Paiement</Text>
          {PAYMENT_METHODS.map((method) => {
            const active = paymentMethod === method.id;
            return (
              <Pressable
                key={method.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: active, disabled: !method.available }}
                accessibilityLabel={PAYMENT_LABEL[method.id]}
                disabled={!method.available}
                onPress={() => {
                  haptic('select');
                  setPaymentMethod(method.id);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: t.spacing.md,
                  padding: t.spacing.lg,
                  borderRadius: t.radius.lg,
                  backgroundColor: t.colors.surface,
                  borderWidth: 1,
                  borderColor: active ? t.colors.primary : t.colors.border,
                  opacity: method.available ? 1 : 0.5,
                }}>
                <Ionicons
                  name={method.icon}
                  size={20}
                  color={active ? t.colors.primary : t.colors.textSubtle}
                />
                <Text variant="body" style={{ flex: 1 }}>
                  {PAYMENT_LABEL[method.id]}
                </Text>
                {method.available ? (
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? t.colors.primary : t.colors.textSubtle}
                  />
                ) : (
                  <Badge label="Bientôt" tone="neutral" />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Récapitulatif */}
        <View style={{ gap: t.spacing.sm }}>
          <Text variant="subheading">Récapitulatif</Text>

          <Card>
            <View style={{ gap: t.spacing.md }}>
              {groups.map((group) => (
                <View key={group.vendorId} style={{ gap: t.spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
                    <Ionicons name="storefront-outline" size={14} color={t.colors.textSubtle} />
                    <Text variant="captionStrong" tone="muted" numberOfLines={1}>
                      {group.vendorName}
                    </Text>
                  </View>
                  {group.lines.map((line) => (
                    <View
                      key={line.productId}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
                      <Text variant="caption" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
                        {line.quantity} × {line.title}
                      </Text>
                      <Text variant="caption">{formatXOF(line.unitPrice * line.quantity)}</Text>
                    </View>
                  ))}
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: t.colors.divider }} />

              <PriceRow label={`Sous-total (${itemCount} article${itemCount > 1 ? 's' : ''})`} value={pricing.subtotal} />
              <PriceRow
                label={
                  shippingMethod === 'pickup'
                    ? 'Retrait sur place'
                    : `Livraison — ${DELIVERY_ZONES.find((z) => z.id === address?.zone)?.label ?? 'zone à définir'}`
                }
                value={pricing.shipping}
              />
              <View style={{ height: 1, backgroundColor: t.colors.divider }} />
              <PriceRow label="Total" value={pricing.total} emphasis />
            </View>
          </Card>

          {groups.length > 1 && (
            <Text variant="caption" tone="subtle">
              Votre panier sera scindé en {groups.length} commandes, une par vendeur. Chacune est
              suivie et livrée séparément.
            </Text>
          )}
        </View>

        {/* Ce que touche chaque partie — transparence assumée. */}
        <Card level={0}>
          <View style={{ gap: t.spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
              <Ionicons name="information-circle-outline" size={16} color={t.colors.textSubtle} />
              <Text variant="captionStrong" tone="muted">
                Répartition
              </Text>
            </View>
            <Text variant="caption" tone="subtle">
              Sur les {formatXOF(pricing.subtotal)} d&apos;articles, le vendeur reçoit{' '}
              {formatXOF(pricing.vendorPayout)} et AubeShop retient{' '}
              {formatXOF(pricing.commission)} de commission.
              {pricing.shipping > 0 &&
                ` Le livreur perçoit ${formatXOF(pricing.courierPayout)} sur les frais de livraison.`}
            </Text>
          </View>
        </Card>

        <View style={{ height: t.spacing.md }} />
        {/* `note` est envoyée telle quelle au vendeur. */}
        <NoteField value={note} onChange={setNote} />
      </ScrollView>
    </Screen>
  );
}

function Choice({
  active,
  icon,
  title,
  subtitle,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${title}, ${subtitle}`}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      style={{
        flex: 1,
        gap: t.spacing.xs,
        padding: t.spacing.lg,
        borderRadius: t.radius.lg,
        backgroundColor: active ? t.colors.primarySubtle : t.colors.surface,
        borderWidth: 1,
        borderColor: active ? t.colors.primary : t.colors.border,
      }}>
      <Ionicons name={icon} size={22} color={active ? t.colors.primaryText : t.colors.textMuted} />
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="caption" tone="muted">
        {subtitle}
      </Text>
    </Pressable>
  );
}

function NoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTheme();

  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text variant="subheading">Message au vendeur</Text>
      <Input
        placeholder="Précision sur la taille, la couleur, l'heure de retrait…"
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={3}
        maxLength={280}
      />
    </View>
  );
}
