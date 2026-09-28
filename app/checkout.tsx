import { LoadingSpinner } from '@/components';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { OrderService } from '@/lib/orderService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CheckoutScreen() {
  const { cartItems, total, clearCart } = useCart();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      Alert.alert('Veuillez vous connecter', 'Connectez-vous pour passer commande');
      router.push('/auth/login');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des produits avant de commander');
      router.push('/');
      return;
    }

    setLoading(true);
    try {
      const result = await OrderService.createOrder(currentUser.uid, {
        items: cartItems as any,
        shippingInfo: { method: 'delivery' },
        paymentMethod: 'card',
      });
      clearCart();
      Alert.alert('Commande passée', `Votre commande ${result.orderId} a été créée`);
      router.push('/orders');
    } catch (err) {
      console.error('Erreur création commande', err);
      Alert.alert('Erreur', 'Impossible de créer la commande');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Envoi de la commande..." />;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>
        <Text style={styles.summaryText}>Articles: {cartItems?.length ?? 0}</Text>
        <Text style={styles.summaryText}>Total: {total?.toFixed(2) ?? '0.00'} €</Text>
      </View>

      <TouchableOpacity style={styles.payButton} onPress={handlePlaceOrder}>
        <Text style={styles.payText}>Confirmer et payer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: COLORS.tertiary },
  summary: { padding: 16, borderRadius: 8, backgroundColor: COLORS.grayLight, marginBottom: 20 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: COLORS.secondary, marginBottom: 8 },
  summaryText: { fontSize: 14, color: COLORS.grayDark, marginBottom: 6 },
  payButton: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  payText: { color: COLORS.tertiary, fontWeight: '700', fontSize: 16 },
  cancelButton: { padding: 12, alignItems: 'center' },
  cancelText: { color: COLORS.secondary, fontSize: 14 },
});
