/**
 * components/ProductCard.tsx
 * ==========================
 * Composant affichant une carte produit
 * Utilisé dans le catalogue, recherche, etc.
 * Commentaires en français
 */

import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { formatPrice } from '../lib/utils';
import { Product } from '../types/index';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

/**
 * ProductCard - Affiche une carte produit
 * UI: Image, titre, prix, rating, bouton "Ajouter"
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
}) => {
  const router = useRouter();

  // Ouvrir détail produit
  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  // Ajouter au panier
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
      Alert.alert('✅ Produit ajouté', `${product.title} ajouté au panier`);
    }
  };

  // Récupérer première image (ou placeholder)
  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0].url
      : 'https://via.placeholder.com/150';

  // Affichage rating
  const ratingDisplay =
    product.reviews > 0
      ? `${product.rating.toFixed(1)} ⭐ (${product.reviews})`
      : 'Pas d\'avis';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Image produit */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
        />
        {/* Badge stock si faible */}
        {product.stock.available < 3 && product.stock.available > 0 && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Peu en stock</Text>
          </View>
        )}
        {product.stock.available === 0 && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Rupture</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Titre (tronqué à 2 lignes) */}
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        {/* Prix en rouge */}
        <Text style={styles.price}>{formatPrice(product.price)}</Text>

        {/* Rating */}
        <Text style={styles.rating}>{ratingDisplay}</Text>

        {/* Catégorie */}
        <Text style={styles.category}>{product.category}</Text>
      </View>

      {/* Bouton Ajouter */}
      <TouchableOpacity
        style={[
          styles.button,
          { opacity: product.stock.available === 0 ? 0.5 : 1 },
        ]}
        onPress={handleAddToCart}
        disabled={product.stock.available === 0}
      >
        <Text style={styles.buttonText}>
          {product.stock.available === 0 ? 'Rupture' : 'Ajouter'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.tertiary,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: COLORS.gray,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  lowStockText: {
    color: COLORS.tertiary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.error,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  outOfStockText: {
    color: COLORS.tertiary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    color: COLORS.grayDark,
    marginBottom: 4,
  },
  category: {
    fontSize: 11,
    color: COLORS.grayDark,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  buttonText: {
    color: COLORS.tertiary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ProductCard;
