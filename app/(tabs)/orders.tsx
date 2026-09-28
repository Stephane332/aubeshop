import { EmptyState, LoadingSpinner } from '@/components';
import { OrderCard } from '@/components/OrderCard';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { OrderService } from '@/lib/orderService';
import { Order } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

export default function OrdersScreen() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      if (!currentUser) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        const role = currentUser.role === 'vendor' ? 'vendor' : 'client';
        const list = await OrderService.getUserOrders(currentUser.uid, role as any);
        if (mounted) setOrders(list);
      } catch (err) {
        console.error('Erreur chargement commandes', err);
        Alert.alert('Erreur', 'Impossible de charger vos commandes');
        if (mounted) setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  if (loading) return <LoadingSpinner message="Chargement des commandes..." />;
  if (!orders || orders.length === 0)
    return (
      <EmptyState
        title="Aucune commande"
        message="Vous n'avez pas encore passé de commande ou vous n'en avez pas reçue."
        actionLabel="Retour à l'accueil"
        onAction={() => router.push('/')}
      />
    );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard order={item} />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.tertiary },
  list: { paddingVertical: 12 },
});
