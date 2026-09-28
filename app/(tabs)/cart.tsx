import { EmptyState, LoadingSpinner } from '@/components';
import { CartItem } from '@/components/CartItem';
import { COLORS } from '@/constants/colors';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CartScreen() {
  const { cartItems, itemCount, total, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  };

  const handleRemove = (productId: string) => {
    removeFromCart(productId);
  };

  if (!cartItems) {
    return <LoadingSpinner message="Chargement du panier..." />;
  }

  if (cartItems.length === 0) {
    return (
      <EmptyState
        title="Votre panier est vide"
        message="Ajoutez des produits depuis le catalogue pour commencer une commande."
        actionLabel="Explorer les produits"
        onAction={() => router.push('/')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) => (
          <CartItem
            item={item as any}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemove}
          />
        )}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{itemCount} article{itemCount > 1 ? 's' : ''}</Text>
          <Text style={styles.totalText}>{total ? `${total.toFixed(2)} €` : '€0.00'}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.checkoutText}>Passer la commande</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.tertiary },
  list: { paddingVertical: 12 },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    backgroundColor: COLORS.tertiary,
  },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryText: { fontSize: 16, fontWeight: '600', color: COLORS.secondary },
  totalText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: { color: COLORS.tertiary, fontSize: 16, fontWeight: 'bold' },
});
