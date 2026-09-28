import { EmptyState, LoadingSpinner } from '@/components';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PendingVendor {
  id: string;
  displayName: string;
  email: string;
  storeName: string;
  studentId: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  badgeUrl?: string;
}

/**
 * AdminScreen - Tableau de bord admin pour approuver vendeurs
 * Démo: liste statique, production: charger depuis Firestore
 */
export default function AdminScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [vendors, setVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger vendeurs en attente (démo)
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        // TODO: Remplacer par requête Firestore en production
        // const q = query(
        //   collection(firestore, 'vendors'),
        //   where('verificationStatus', '==', 'pending')
        // );
        // const snap = await getDocs(q);
        // setVendors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Démo data
        setVendors([
          {
            id: 'vendor-1',
            displayName: 'Alice Dupont',
            email: 'alice@example.com',
            storeName: 'Bouquinerie Alice',
            studentId: '2024001001',
            verificationStatus: 'pending',
          },
          {
            id: 'vendor-2',
            displayName: 'Bob Martin',
            email: 'bob@example.com',
            storeName: 'Électronique Bob',
            studentId: '2024001002',
            verificationStatus: 'pending',
          },
        ]);
      } catch (err) {
        console.error('Erreur chargement vendeurs', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.role === 'admin') {
      fetchVendors();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Accès refusé"
          message="Seuls les admins peuvent accéder à cette page"
          actionLabel="Retour"
          onAction={() => router.push('/')}
        />
      </View>
    );
  }

  if (loading) return <LoadingSpinner message="Chargement..." />;

  const handleApprove = (vendorId: string) => {
    Alert.alert(
      'Approuver vendeur ?',
      'Cette action ne peut pas être annulée',
      [
        { text: 'Annuler', onPress: () => {} },
        {
          text: 'Approuver',
          onPress: async () => {
            try {
              // TODO: Appeler AuthService.approveVendor(vendorId)
              // await AuthService.approveVendor(vendorId);
              setVendors(vendors.filter((v) => v.id !== vendorId));
              Alert.alert('✅ Vendeur approuvé');
            } catch {
              Alert.alert('Erreur', 'Impossible d\'approuver le vendeur');
            }
          },
        },
      ]
    );
  };

  const handleReject = (vendorId: string) => {
    Alert.alert(
      'Rejeter vendeur ?',
      'Le vendeur sera notifié',
      [
        { text: 'Annuler', onPress: () => {} },
        {
          text: 'Rejeter',
          onPress: async () => {
            try {
              // TODO: Appeler endpoint pour rejeter
              setVendors(vendors.filter((v) => v.id !== vendorId));
              Alert.alert('✅ Vendeur rejeté');
            } catch {
              Alert.alert('Erreur', 'Impossible de rejeter le vendeur');
            }
          },
        },
      ]
    );
  };

  if (vendors.length === 0) {
    return (
      <EmptyState
        title="Aucun vendeur en attente"
        message="Tous les vendeurs ont été approuvés ou rejetés"
        actionLabel="Retour"
        onAction={() => router.push('/')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👨‍💼 Approbation Vendeurs</Text>
        <Text style={styles.count}>{vendors.length} en attente</Text>
      </View>

      <FlatList
        data={vendors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.vendorCard}>
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{item.displayName}</Text>
              <Text style={styles.vendorStore}>🏪 {item.storeName}</Text>
              <Text style={styles.vendorEmail}>{item.email}</Text>
              <Text style={styles.vendorId}>ID étudiant: {item.studentId}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleApprove(item.id)}
              >
                <Text style={styles.approveBtnText}>✓ Approuver</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleReject(item.id)}
              >
                <Text style={styles.rejectBtnText}>✗ Rejeter</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.tertiary },
  header: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 4 },
  count: { fontSize: 12, color: COLORS.grayDark },
  list: { paddingVertical: 12 },
  vendorCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: COLORS.grayLight,
  },
  vendorInfo: { marginBottom: 12 },
  vendorName: { fontSize: 16, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 4 },
  vendorStore: { fontSize: 13, color: COLORS.grayDark, marginBottom: 4 },
  vendorEmail: { fontSize: 12, color: COLORS.grayDark, marginBottom: 4 },
  vendorId: { fontSize: 11, color: COLORS.grayDark, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: COLORS.success, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  approveBtnText: { color: COLORS.tertiary, fontWeight: 'bold', fontSize: 13 },
  rejectBtn: { flex: 1, backgroundColor: COLORS.error, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  rejectBtnText: { color: COLORS.tertiary, fontWeight: 'bold', fontSize: 13 },
});
