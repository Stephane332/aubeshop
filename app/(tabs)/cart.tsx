/**
 * app/(tabs)/cart.tsx
 * ===================
 * Panier, groupé par vendeur.
 *
 * Trois corrections visibles par rapport à la v1 :
 * - les lignes affichent le bon titre et la bonne photo (la v1 lisait
 *   `item.product.title` sur un type qui ne le portait pas, d'où
 *   « Produit inconnu » sur chaque ligne) ;
 * - le compteur additionne les quantités au lieu de compter les lignes ;
 * - plus de clignotement « panier vide » au démarrage, grâce à l'état
 *   d'hydratation du stockage local.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Price,
  PriceRow,
  RowSkeleton,
  Screen,
  Text,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/hooks/use-theme';
import { confirm, haptic } from '@/lib/feedback';
import { DELIVERY_FEE_MAX, DELIVERY_FEE_MIN, formatXOF } from '@/lib/money';
import type { CartLine } from '@/types';

export default function CartScreen() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { lines, groups, itemCount, subtotal, hydrating, setQuantity, remove, clear } = useCart();

  if (hydrating) {
    return (
      <Screen>
        <View style={{ gap: t.spacing.md, paddingTop: t.spacing.lg }}>
          <RowSkeleton />
          <RowSkeleton />
        </View>
      </Screen>
    );
  }

  if (lines.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="bag-outline"
          title="Votre panier est vide"
          message="Parcourez le catalogue et ajoutez vos premiers articles."
          actionLabel="Voir le catalogue"
          onAction={() => router.push('/')}
        />
      </Screen>
    );
  }

  const handleClear = async () => {
    if (await confirm({
      title: 'Vider le panier ?',
      message: `${itemCount} article(s) seront retirés.`,
      confirmLabel: 'Vider',
      destructive: true,
    })) {
      await clear();
    }
  };

  return (
    <Screen
      padded={false}
      footer={
        <View style={{ gap: t.spacing.sm }}>
          <PriceRow label={`Sous-total (${itemCount} article${itemCount > 1 ? 's' : ''})`} value={subtotal} />
          <Text variant="caption" tone="subtle">
            Livraison de {formatXOF(DELIVERY_FEE_MIN)} à {formatXOF(DELIVERY_FEE_MAX)} selon la
            distance, calculée à l&apos;étape suivante.
          </Text>
          <Button
            label={user ? 'Passer la commande' : 'Se connecter pour commander'}
            icon={user ? 'arrow-forward' : 'log-in-outline'}
            block
            onPress={() => {
              haptic('medium');
              router.push(user ? '/checkout' : '/auth/login');
            }}
          />
        </View>
      }>
      <ScrollView
        contentContainerStyle={{
          padding: t.spacing.lg,
          gap: t.spacing.lg,
          paddingBottom: t.spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Un panier réparti sur plusieurs vendeurs donnera plusieurs
            commandes : il faut le dire avant le paiement, pas après. */}
        {groups.length > 1 && (
          <Card level={0}>
            <View style={{ flexDirection: 'row', gap: t.spacing.sm, alignItems: 'flex-start' }}>
              <Ionicons name="information-circle-outline" size={18} color={t.colors.info} />
              <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                Votre panier contient des articles de {groups.length} vendeurs. Cela créera{' '}
                {groups.length} commandes distinctes, chacune suivie séparément.
              </Text>
            </View>
          </Card>
        )}

        {groups.map((group) => (
          <View key={group.vendorId} style={{ gap: t.spacing.sm }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, flex: 1 }}>
                <Ionicons name="storefront-outline" size={16} color={t.colors.textMuted} />
                <Text variant="captionStrong" tone="muted" numberOfLines={1}>
                  {group.vendorName}
                </Text>
              </View>
              <Price value={group.subtotal} size="sm" tone="default" />
            </View>

            {group.lines.map((line) => (
              <CartRow
                key={line.productId}
                line={line}
                onQuantity={(q) => setQuantity(line.productId, q)}
                onRemove={() => remove(line.productId)}
              />
            ))}
          </View>
        ))}

        <Button
          label="Vider le panier"
          variant="ghost"
          icon="trash-outline"
          onPress={handleClear}
          style={{ alignSelf: 'center' }}
        />
      </ScrollView>
    </Screen>
  );
}

function CartRow({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const t = useTheme();
  const atMax = line.quantity >= line.maxStock;

  return (
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
          {line.image ? (
            <Image
              source={{ uri: line.image }}
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
          <Text variant="bodyStrong" numberOfLines={2}>
            {line.title}
          </Text>
          <Text variant="caption" tone="muted">
            {formatXOF(line.unitPrice)} l&apos;unité
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: t.spacing.xxs,
            }}>
            {/* Boutons à 36 px avec zone tactile étendue : la v1 avait des
                cibles de 28 px, sous le minimum recommandé de 44. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
              <IconButton
                icon={line.quantity === 1 ? 'trash-outline' : 'remove'}
                label={line.quantity === 1 ? 'Retirer du panier' : 'Diminuer la quantité'}
                tone={line.quantity === 1 ? 'danger' : 'default'}
                size={36}
                onPress={() => (line.quantity === 1 ? onRemove() : onQuantity(line.quantity - 1))}
              />
              <Text variant="bodyStrong" style={{ minWidth: 22, textAlign: 'center' }}>
                {line.quantity}
              </Text>
              <IconButton
                icon="add"
                label="Augmenter la quantité"
                size={36}
                disabled={atMax}
                onPress={() => onQuantity(line.quantity + 1)}
              />
            </View>

            <Price value={line.unitPrice * line.quantity} size="sm" />
          </View>

          {atMax && (
            <Badge label={`Stock maximum : ${line.maxStock}`} tone="warning" />
          )}
        </View>
      </View>
    </Card>
  );
}
