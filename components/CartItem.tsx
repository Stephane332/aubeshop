/**
 * components/CartItem.tsx
 * =======================
 * Composant affichant un article du panier
 * Permet de modifier la quantité et supprimer
 */

import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { formatPrice } from '../lib/utils';
import { CartItem as CartItemType } from '../types/index';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

/**
 * CartItem - Affiche un article du panier
 * Permet d'ajuster quantité et supprimer
 */
export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  // Augmenter quantité
  const handleIncrement = () => {
    onUpdateQuantity(item.productId, item.quantity + 1);
  };

  // Diminuer quantité
  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.productId, item.quantity - 1);
    }
  };

  // Supprimer de panier
  const handleRemove = () => {
    onRemove(item.productId);
  };

  // Image du produit ou placeholder
  const imageUrl =
    item.product?.images?.[0]?.url ||
    'https://via.placeholder.com/100';

  // Sous-total pour cet article
  const subtotal = item.price * item.quantity;

  return (
    <View style={styles.container}>
      {/* Image produit */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
      />

      {/* Informations */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.product?.title || 'Produit inconnu'}
        </Text>
        <Text style={styles.price}>
          {formatPrice(item.price)} unité
        </Text>
        <Text style={styles.vendor}>
          Vendeur: {item.product?.vendorId || 'N/A'}
        </Text>
      </View>

      {/* Quantité */}
      <View style={styles.quantityControl}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={handleDecrement}
        >
          <Text style={styles.quantityButtonText}>−</Text>
        </TouchableOpacity>

        <View style={styles.quantityDisplay}>
          <Text style={styles.quantityText}>{item.quantity}</Text>
        </View>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={handleIncrement}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Sous-total et supprimer */}
      <View style={styles.rightSection}>
        <Text style={styles.subtotal}>
          {formatPrice(subtotal)}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
        >
          <Text style={styles.removeButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tertiary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  price: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  vendor: {
    fontSize: 11,
    color: COLORS.grayDark,
    fontStyle: 'italic',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: COLORS.tertiary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityDisplay: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  rightSection: {
    alignItems: 'center',
  },
  subtotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
  },
});

export default CartItem;
