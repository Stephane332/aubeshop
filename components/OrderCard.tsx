/**
 * components/OrderCard.tsx
 * ========================
 * Composant affichant une commande
 * Utilisé dans l'historique des commandes
 */

import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { formatDate, formatPrice } from '../lib/utils';
import { Order } from '../types/index';

interface OrderCardProps {
  order: Order;
}

/**
 * OrderCard - Affiche une commande
 * Statut, date, total, nombre d'articles
 */
export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const router = useRouter();

  // Ouvrir détail commande
  const handlePress = () => {
    router.push(`/order/${order.id}`);
  };

  // Couleur du badge statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'accepted':
        return COLORS.info;
      case 'in-progress':
        return COLORS.info;
      case 'ready':
        return COLORS.warning;
      case 'delivered':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.grayMedium;
    }
  };

  // Texte français du statut
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '⏳ En attente',
      accepted: '✅ Acceptée',
      'in-progress': '⚙️ En cours',
      ready: '📦 Prête',
      delivered: '🚚 Livrée',
      cancelled: '❌ Annulée',
    };
    return labels[status] || status;
  };

  // Nombre d'articles
  const itemCount = order.items?.length || 0;

  // Date de création lisible
  const createdDate = formatDate(order.createdAt);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* En-tête: Numéro + Statut */}
      <View style={styles.header}>
        <View style={styles.orderNumber}>
          <Text style={styles.orderNumberText}>
            Commande #{order.id.slice(-6).toUpperCase()}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      {/* Informations */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅 Date:</Text>
          <Text style={styles.detailValue}>{createdDate}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📦 Articles:</Text>
          <Text style={styles.detailValue}>
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💰 Total:</Text>
          <Text style={[styles.detailValue, styles.totalValue]}>
            {formatPrice(order.total)}
          </Text>
        </View>
      </View>

      {/* Vendeur (si applicable) */}
      {order.vendorId && (
        <View style={styles.vendor}>
          <Text style={styles.vendorLabel}>
            Vendeur: <Text style={styles.vendorValue}>{order.vendorId}</Text>
          </Text>
        </View>
      )}

      {/* Flèche navigation */}
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.tertiary,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.gray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    flex: 1,
  },
  orderNumberText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: COLORS.tertiary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  details: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.grayDark,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  vendor: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  vendorLabel: {
    fontSize: 11,
    color: COLORS.grayDark,
  },
  vendorValue: {
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  arrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -12,
  },
  arrowText: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default OrderCard;
