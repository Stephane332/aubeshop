import { LoadingSpinner } from '@/components';
import { COLORS } from '@/constants/colors';
import { OrderService } from '@/lib/orderService';
import { formatDate, formatPrice } from '@/lib/utils';
import { Order } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrderDetailScreen() {
  const params = useLocalSearchParams();
  const { id } = params as { id: string };
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await OrderService.getOrder(id);
        if (mounted) setOrder(data);
      } catch (err) {
        console.error('Erreur chargement commande', err);
        Alert.alert('Erreur', 'Impossible de charger la commande');
        router.back();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  if (loading) return <LoadingSpinner message="Chargement de la commande..." />;
  if (!order) return null;

  const createdAt = order.timeline?.createdAt ? formatDate(order.timeline.createdAt) : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Commande #{order.id}</Text>
        <Text style={[styles.status, { color: COLORS.primary }]}>{order.status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé</Text>
        <Text>Client: {order.clientId}</Text>
        <Text>Vendeur: {order.vendorId || '—'}</Text>
        <Text>Statut: {order.status}</Text>
        <Text>Créée: {createdAt}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Articles</Text>
        {order.items?.map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemTitle}>{it.title || it.productId}</Text>
            <Text>{it.quantity} × {formatPrice(it.price)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prix</Text>
        <Text>Sous-total: {formatPrice(order.pricing?.subtotal ?? 0)}</Text>
        <Text>Frais de port: {formatPrice(order.pricing?.shipping ?? 0)}</Text>
        <Text>Commission: {formatPrice(order.pricing?.commission ?? 0)}</Text>
        <Text style={styles.total}>Total: {formatPrice(order.pricing?.total ?? 0)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {order.timeline && Object.entries(order.timeline).map(([k, v]) => (
          <Text key={k}>{k}: {typeof v === 'number' ? formatDate(v as number) : String(v)}</Text>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.tertiary },
  content: { paddingBottom: 30 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.secondary },
  status: { fontSize: 14, fontWeight: '700' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: COLORS.secondary },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemTitle: { fontWeight: '600' },
  total: { fontWeight: '800', marginTop: 8, color: COLORS.primary },
  actions: { padding: 16 },
  primaryButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  primaryText: { color: COLORS.tertiary, fontWeight: '700' },
});
