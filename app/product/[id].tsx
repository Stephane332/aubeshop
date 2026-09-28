import { LoadingSpinner } from '@/components';
import { COLORS } from '@/constants/colors';
import { useCart } from '@/context/CartContext';
import { ProductService } from '@/lib/productService';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProductDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await ProductService.getProduct(id);
        if (mounted) setProduct(p);
      } catch (err) {
        console.error('Erreur fetch produit', err);
        Alert.alert('Erreur', 'Impossible de charger le produit.');
        router.back();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  if (loading) return <LoadingSpinner message="Chargement du produit..." />;
  if (!product) return null;

  const imageUrl = product.images?.[0]?.url || 'https://via.placeholder.com/400';

  const handleAdd = () => {
    addToCart(product, 1);
    Alert.alert('✅ Ajouté', 'Produit ajouté au panier');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: imageUrl }} style={styles.image} />

      <View style={styles.section}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.category}>{product.category}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Description</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Ajouter au panier</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.tertiary },
  content: { paddingBottom: 30 },
  image: { width: '100%', height: 320, resizeMode: 'cover' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.secondary, marginBottom: 8 },
  price: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  category: { fontSize: 12, color: COLORS.grayDark, fontStyle: 'italic' },
  subtitle: { fontSize: 16, fontWeight: '700', color: COLORS.secondary, marginBottom: 8 },
  description: { fontSize: 14, color: COLORS.grayDark, lineHeight: 20 },
  addButton: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: COLORS.tertiary, fontWeight: '700', fontSize: 16 },
});
